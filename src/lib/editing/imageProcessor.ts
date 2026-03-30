// ── Image Processor ──
// Tauri invoke wrapper with single-flight coalescing and adaptive resolution pipeline
// Uses temp file transfer with cache-busting for Tauri asset protocol

import { invokeCommand, convertFileSource } from '../store';
import { toRustPayload, type AdjustmentState } from './adjustments';

interface ProcessResult {
    previewPath: string; // temp file path
    width: number;
    height: number;
    pixels: number[] | null; // raw RGBA pixel data (if available)
}

export interface HistogramData {
    r: number[];
    g: number[];
    b: number[];
    l: number[];
}

// ── Single-Flight Coalescing State ──
// Only one Rust invocation can be in-flight at a time.
// New requests while processing replace the pending slot (latest-wins).
// When processing finishes, the pending request fires immediately.

let isProcessing = false;
let pendingRequest: {
    path: string;
    adj: AdjustmentState;
    preview: boolean;
    maxEdge?: number;
    resolve: (v: ImageData | null) => void;
    reject: (e: any) => void;
} | null = null;

// Monotonic version counter for stale detection
let requestVersion = 0;

/**
 * Load source image into Rust cache (call once on editor open)
 */
export async function loadEditorSource(imagePath: string): Promise<[number, number] | null> {
    try {
        const result = await invokeCommand<[number, number]>('load_editor_source', { imagePath });
        return result;
    } catch (err) {
        console.error('Failed to load editor source:', err);
        return null;
    }
}

/**
 * Unload source image from Rust cache (call on editor close)
 */
export async function unloadEditorSource(): Promise<void> {
    try {
        await invokeCommand('unload_editor_source');
    } catch (err) {
        console.error('Failed to unload editor source:', err);
    }
}

/**
 * Load a temp file preview image into an ImageData for canvas rendering.
 * Uses Tauri's asset protocol with cache-busting query param.
 */
async function loadPreviewFile(previewPath: string): Promise<ImageData | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            resolve(imageData);
        };
        img.onerror = () => {
            console.error('Failed to load preview file');
            resolve(null);
        };
        // Use asset protocol with cache-busting
        const mapped = convertFileSource(previewPath);
        if (mapped.startsWith('data:')) {
            img.src = mapped;
        } else {
            img.src = mapped + '?t=' + Date.now();
        }
    });
}

/**
 * Convert raw RGBA pixel array from Rust into ImageData directly.
 * Bypasses file I/O entirely — much faster for preview-sized images.
 */
function pixelsToImageData(pixels: number[], width: number, height: number): ImageData | null {
    try {
        const expectedLength = width * height * 4;
        if (pixels.length !== expectedLength) {
            console.warn(`Pixel array length mismatch: got ${pixels.length}, expected ${expectedLength}`);
            return null;
        }
        const data = new Uint8ClampedArray(pixels);
        return new ImageData(data, width, height);
    } catch (err) {
        console.error('Failed to convert pixels to ImageData:', err);
        return null;
    }
}

/**
 * Core processing function — sends request to Rust backend.
 * Returns ImageData from either raw pixels (fast) or file preview (fallback).
 */
async function executeProcess(
    path: string,
    adj: AdjustmentState,
    preview: boolean,
    maxEdge?: number,
    version?: number,
): Promise<ImageData | null> {
    const payload = toRustPayload(adj);
    try {
        const result = await invokeCommand<ProcessResult>('process_image', {
            imagePath: path,
            adjustments: payload,
            preview,
            maxPreviewEdge: maxEdge ?? null,
        });

        if (!result) return null;

        // Fast path: raw RGBA pixels returned directly (no file I/O)
        if (result.pixels && result.pixels.length > 0) {
            return pixelsToImageData(result.pixels, result.width, result.height);
        }

        // Fallback: load from temp BMP file
        if (result.previewPath) {
            return await loadPreviewFile(result.previewPath);
        }
    } catch (err) {
        console.error('Image processing failed:', err);
    }
    return null;
}

/**
 * Process image with single-flight coalescing for fluid updates.
 * 
 * - Only one Rust invocation is in-flight at a time
 * - New requests while processing replace the pending slot (latest-wins)
 * - Superseded pending requests resolve with null
 * - When processing finishes, any pending request fires immediately
 *
 * @param path - Absolute file path to the source image
 * @param adjustments - Current adjustment state
 * @param preview - If true, process at reduced resolution
 * @param maxPreviewEdge - Adaptive preview: 600 during drag, 800 on release
 */
export function processImage(
    path: string,
    adjustments: AdjustmentState,
    preview: boolean = true,
    maxPreviewEdge?: number,
): Promise<ImageData | null> {
    const version = ++requestVersion;

    return new Promise((resolve, reject) => {
        // If currently processing, replace the pending request
        // The previous pending request (if any) gets resolved with null
        if (isProcessing) {
            if (pendingRequest) {
                // Superseded — resolve the old pending with null
                pendingRequest.resolve(null);
            }
            pendingRequest = { path, adj: adjustments, preview, maxEdge: maxPreviewEdge, resolve, reject };
            return;
        }

        // Not processing — fire immediately
        runProcess(path, adjustments, preview, maxPreviewEdge, version, resolve, reject);
    });
}

/**
 * Internal: Execute processing and drain pending queue when done.
 */
async function runProcess(
    path: string,
    adj: AdjustmentState,
    preview: boolean,
    maxEdge: number | undefined,
    version: number,
    resolve: (v: ImageData | null) => void,
    reject: (e: any) => void,
): Promise<void> {
    isProcessing = true;
    try {
        const imageData = await executeProcess(path, adj, preview, maxEdge, version);
        
        // Stale check: if a newer request has been made, discard result
        if (version < requestVersion && pendingRequest) {
            resolve(null);
        } else {
            resolve(imageData);
        }
    } catch (err) {
        reject(err);
    } finally {
        isProcessing = false;

        // Drain pending: if a new request queued during processing, fire it now
        if (pendingRequest) {
            const req = pendingRequest;
            pendingRequest = null;
            const nextVersion = ++requestVersion;
            // Use queueMicrotask for immediate but non-blocking dispatch
            queueMicrotask(() => {
                runProcess(req.path, req.adj, req.preview, req.maxEdge, nextVersion, req.resolve, req.reject);
            });
        }
    }
}

/**
 * Process at full resolution (no throttling). For final render on pointer release.
 */
export async function processImageFull(
    path: string,
    adjustments: AdjustmentState,
): Promise<ImageData | null> {
    return executeProcess(path, adjustments, false);
}

/**
 * Compute histogram from ImageData (inline, no IPC needed).
 * Uses typed arrays for performance.
 */
export function computeHistogram(imageData: ImageData): HistogramData {
    const data = imageData.data;
    const r = new Uint32Array(256);
    const g = new Uint32Array(256);
    const b = new Uint32Array(256);
    const l = new Uint32Array(256);

    for (let i = 0; i < data.length; i += 4) {
        r[data[i]]++;
        g[data[i + 1]]++;
        b[data[i + 2]]++;
        const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2] + 0.5) | 0;
        l[Math.min(lum, 255)]++;
    }

    return {
        r: Array.from(r),
        g: Array.from(g),
        b: Array.from(b),
        l: Array.from(l),
    };
}
