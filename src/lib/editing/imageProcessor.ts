// ── Image Processor ──
// Tauri invoke wrapper with rAF throttling, adaptive resolution, and two-resolution pipeline
// Uses temp file transfer instead of base64 for performance

import { invokeCommand, convertFileSource } from '../store';
import { toRustPayload, type AdjustmentState } from './adjustments';

interface ProcessResult {
    previewPath: string; // temp file path
    width: number;
    height: number;
}

export interface HistogramData {
    r: number[];
    g: number[];
    b: number[];
    l: number[];
}

let isProcessing = false;
let pendingRequest: {
    path: string;
    adj: AdjustmentState;
    preview: boolean;
    maxEdge?: number;
    resolve: (v: ImageData | null) => void;
} | null = null;
let previewVersion = 0;
let rafId: number | null = null;
let isScrubbingActive = false;

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
 * Load a temp file preview image into an ImageData for canvas rendering
 */
async function loadPreviewFile(previewPath: string, _width: number, _height: number): Promise<ImageData | null> {
    return new Promise((resolve) => {
        const img = new Image();
        const version = ++previewVersion;
        img.onload = () => {
            if (version !== previewVersion) { resolve(null); return; }
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
        img.src = convertFileSource(previewPath) + '?t=' + Date.now();
    });
}

/**
 * Core processing function — sends request to Rust backend
 */
async function executeProcess(
    path: string,
    adj: AdjustmentState,
    preview: boolean,
    maxEdge?: number,
): Promise<ImageData | null> {
    const payload = toRustPayload(adj);
    try {
        const result = await invokeCommand<ProcessResult>('process_image', {
            imagePath: path,
            adjustments: payload,
            preview,
            maxPreviewEdge: maxEdge ?? null,
        });

        if (result && result.previewPath) {
            return await loadPreviewFile(result.previewPath, result.width, result.height);
        }
    } catch (err) {
        console.error('Image processing failed:', err);
    }
    return null;
}

/**
 * Process image with rAF throttling for fluid 60fps-aligned updates.
 * During active scrubbing (fast slider movement), only one rAF request
 * is active at a time, and new slider values are coalesced.
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
    return new Promise((resolve) => {
        // Always store the latest request (coalesce)
        pendingRequest = { path, adj: adjustments, preview, maxEdge: maxPreviewEdge, resolve };

        // If already waiting for a frame, let the existing rAF handle it
        if (isScrubbingActive) return;

        isScrubbingActive = true;

        // Use rAF to align processing with display refresh
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            rafId = null;
            isScrubbingActive = false;
            drainPending();
        });
    });
}

/** Drain pending request queue — separated to avoid TS control-flow narrowing */
async function drainPending(): Promise<void> {
    if (isProcessing) {
        // We're already processing. The `finally` block of the current 
        // processing run will pick up `pendingRequest` when it's done.
        return;
    }

    const req = pendingRequest;
    if (!req) return;
    pendingRequest = null;

    isProcessing = true;
    try {
        const imageData = await executeProcess(req.path, req.adj, req.preview, req.maxEdge);
        // Only resolve with the image data.
        req.resolve(imageData);
    } catch (err) {
        req.resolve(null);
    } finally {
        isProcessing = false;
        // If a new request queued while we were processing, fire it immediately
        if (pendingRequest) {
            // Use setTimeout to avoid exceeding max call stack size over long deep drags
            setTimeout(drainPending, 0);
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
