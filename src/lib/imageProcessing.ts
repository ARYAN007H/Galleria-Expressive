// ── Image Processing Library ──
// Pure Canvas-based pixel manipulation for photo editing
// No external dependencies — all math done in-browser

export interface AdjustmentValues {
    exposure: number;      // -100 to 100
    brilliance: number;    // -100 to 100
    highlights: number;    // -100 to 100
    shadows: number;       // -100 to 100
    contrast: number;      // -100 to 100
    brightness: number;    // -100 to 100
    blackPoint: number;    // -100 to 100
    saturation: number;    // -100 to 100
    vibrance: number;      // -100 to 100
    warmth: number;        // -100 to 100
    tint: number;          // -100 to 100
    sharpness: number;     // 0 to 100
    definition: number;    // -100 to 100
    noiseReduction: number;// 0 to 100
    vignette: number;      // 0 to 100
}

export const defaultAdjustments: AdjustmentValues = {
    exposure: 0,
    brilliance: 0,
    highlights: 0,
    shadows: 0,
    contrast: 0,
    brightness: 0,
    blackPoint: 0,
    saturation: 0,
    vibrance: 0,
    warmth: 0,
    tint: 0,
    sharpness: 0,
    definition: 0,
    noiseReduction: 0,
    vignette: 0,
};

export interface FilterPreset {
    name: string;
    id: string;
    adjustments: Partial<AdjustmentValues>;
}

export const filterPresets: FilterPreset[] = [
    { name: 'Original', id: 'original', adjustments: {} },
    { name: 'Vivid', id: 'vivid', adjustments: { saturation: 30, contrast: 15, vibrance: 25 } },
    { name: 'Vivid Warm', id: 'vivid-warm', adjustments: { saturation: 25, contrast: 10, warmth: 25, vibrance: 20 } },
    { name: 'Vivid Cool', id: 'vivid-cool', adjustments: { saturation: 25, contrast: 10, warmth: -20, tint: -10, vibrance: 20 } },
    { name: 'Dramatic', id: 'dramatic', adjustments: { contrast: 40, highlights: -20, shadows: 20, saturation: -10, definition: 30 } },
    { name: 'Dramatic Warm', id: 'dramatic-warm', adjustments: { contrast: 35, highlights: -15, shadows: 15, warmth: 20, saturation: -5, definition: 25 } },
    { name: 'Dramatic Cool', id: 'dramatic-cool', adjustments: { contrast: 35, highlights: -20, shadows: 15, warmth: -15, saturation: -5, definition: 25 } },
    { name: 'Mono', id: 'mono', adjustments: { saturation: -100, contrast: 10 } },
    { name: 'Silvertone', id: 'silvertone', adjustments: { saturation: -100, contrast: 20, brightness: 10, highlights: -10 } },
    { name: 'Noir', id: 'noir', adjustments: { saturation: -100, contrast: 45, blackPoint: 20, shadows: -20 } },
];

export interface CropState {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;  // degrees
    flipH: boolean;
    flipV: boolean;
    aspectRatio: number | null; // null = free
}

export const aspectRatios: { label: string; value: number | null }[] = [
    { label: 'Free', value: null },
    { label: 'Square', value: 1 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:4', value: 3 / 4 },
    { label: '3:2', value: 3 / 2 },
    { label: '2:3', value: 2 / 3 },
];

// ── Core pixel processing ──

function clamp(v: number, min = 0, max = 255): number {
    return v < min ? min : v > max ? max : v;
}

export function applyAdjustments(
    ctx: CanvasRenderingContext2D,
    sourceCanvas: HTMLCanvasElement,
    adj: AdjustmentValues,
    width: number,
    height: number
): void {
    // Draw source to processing canvas
    ctx.drawImage(sourceCanvas, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Pre-compute adjustment factors
    const exposureFactor = 1 + adj.exposure / 100;
    const brightnessDelta = adj.brightness * 2.55; // -255 to 255
    const contrastFactor = (259 * (adj.contrast * 2.55 + 255)) / (255 * (259 - adj.contrast * 2.55));
    const saturationFactor = 1 + adj.saturation / 100;
    const vibranceFactor = adj.vibrance / 100;
    const warmthShift = adj.warmth * 0.5;
    const tintShift = adj.tint * 0.3;
    const blackPointLevel = adj.blackPoint * 2.55; // 0-255 range
    const highlightsFactor = adj.highlights / 100;
    const shadowsFactor = adj.shadows / 100;
    const brillianceFactor = adj.brilliance / 100;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Exposure
        if (adj.exposure !== 0) {
            r *= exposureFactor;
            g *= exposureFactor;
            b *= exposureFactor;
        }

        // Brightness
        if (adj.brightness !== 0) {
            r += brightnessDelta;
            g += brightnessDelta;
            b += brightnessDelta;
        }

        // Contrast
        if (adj.contrast !== 0) {
            r = contrastFactor * (r - 128) + 128;
            g = contrastFactor * (g - 128) + 128;
            b = contrastFactor * (b - 128) + 128;
        }

        // Black Point — raises the floor of dark tones
        if (adj.blackPoint !== 0) {
            const bp = blackPointLevel;
            r = r * (1 - bp / 255) + bp;
            g = g * (1 - bp / 255) + bp;
            b = b * (1 - bp / 255) + bp;
        }

        // Highlights & Shadows
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        if (adj.highlights !== 0 && luminance > 128) {
            const amount = (luminance - 128) / 127; // 0-1 for brighter pixels
            const delta = highlightsFactor * amount * 50;
            r += delta;
            g += delta;
            b += delta;
        }
        if (adj.shadows !== 0 && luminance < 128) {
            const amount = 1 - luminance / 128; // 0-1 for darker pixels
            const delta = shadowsFactor * amount * 50;
            r += delta;
            g += delta;
            b += delta;
        }

        // Brilliance — adaptive brightness that lifts shadows more
        if (adj.brilliance !== 0) {
            const lum = (r + g + b) / 3;
            const factor = (1 - lum / 255) * brillianceFactor * 80;
            r += factor;
            g += factor;
            b += factor;
        }

        // Warmth (shift red/blue)
        if (adj.warmth !== 0) {
            r += warmthShift;
            b -= warmthShift;
        }

        // Tint (shift green/magenta)
        if (adj.tint !== 0) {
            g += tintShift;
        }

        // Saturation
        if (adj.saturation !== 0) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray + saturationFactor * (r - gray);
            g = gray + saturationFactor * (g - gray);
            b = gray + saturationFactor * (b - gray);
        }

        // Vibrance — selectively boosts less-saturated colors
        if (adj.vibrance !== 0) {
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            const sat = maxC > 0 ? (maxC - minC) / maxC : 0;
            const boost = (1 - sat) * vibranceFactor;
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray + (1 + boost) * (r - gray);
            g = gray + (1 + boost) * (g - gray);
            b = gray + (1 + boost) * (b - gray);
        }

        data[i] = clamp(r);
        data[i + 1] = clamp(g);
        data[i + 2] = clamp(b);
    }

    ctx.putImageData(imageData, 0, 0);

    // Vignette — post-pixel overlay
    if (adj.vignette > 0) {
        applyVignette(ctx, width, height, adj.vignette / 100);
    }
}

function applyVignette(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    strength: number
): void {
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.max(w, h) * 0.7;
    const gradient = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
    gradient.addColorStop(0, `rgba(0,0,0,0)`);
    gradient.addColorStop(1, `rgba(0,0,0,${strength * 0.7})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
}

// ── Crop & Rotation ──

export function applyCropAndRotation(
    sourceCanvas: HTMLCanvasElement,
    crop: CropState
): HTMLCanvasElement {
    const result = document.createElement('canvas');
    const ctx = result.getContext('2d')!;

    // Calculate output dimensions after rotation
    const radians = (crop.rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    const outW = crop.width;
    const outH = crop.height;

    result.width = outW;
    result.height = outH;

    ctx.save();
    ctx.translate(outW / 2, outH / 2);
    if (crop.rotation !== 0) {
        ctx.rotate(radians);
    }
    if (crop.flipH) ctx.scale(-1, 1);
    if (crop.flipV) ctx.scale(1, -1);

    ctx.drawImage(
        sourceCanvas,
        crop.x, crop.y, crop.width, crop.height,
        -outW / 2, -outH / 2, outW, outH
    );
    ctx.restore();

    return result;
}

// ── Export ──

export function canvasToBlob(canvas: HTMLCanvasElement, format = 'image/jpeg', quality = 0.92): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Canvas toBlob failed'));
            },
            format,
            quality
        );
    });
}

export function canvasToBase64(canvas: HTMLCanvasElement, format = 'image/jpeg', quality = 0.92): string {
    return canvas.toDataURL(format, quality);
}

// ── Markup drawing ──

export interface DrawStroke {
    tool: 'pen' | 'highlighter' | 'pencil';
    color: string;
    size: number;
    points: { x: number; y: number }[];
}

export interface TextOverlay {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
}

export function renderStrokes(
    ctx: CanvasRenderingContext2D,
    strokes: DrawStroke[]
): void {
    for (const stroke of strokes) {
        if (stroke.points.length < 2) continue;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = stroke.size;

        switch (stroke.tool) {
            case 'pen':
                ctx.strokeStyle = stroke.color;
                ctx.globalAlpha = 1;
                break;
            case 'highlighter':
                ctx.strokeStyle = stroke.color;
                ctx.globalAlpha = 0.35;
                ctx.lineWidth = stroke.size * 3;
                break;
            case 'pencil':
                ctx.strokeStyle = stroke.color;
                ctx.globalAlpha = 0.6;
                ctx.lineWidth = stroke.size * 0.7;
                break;
        }

        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
            const prev = stroke.points[i - 1];
            const curr = stroke.points[i];
            // Smooth with midpoint for natural look
            const mx = (prev.x + curr.x) / 2;
            const my = (prev.y + curr.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
        }
        ctx.stroke();
        ctx.restore();
    }
}

export function renderTextOverlays(
    ctx: CanvasRenderingContext2D,
    overlays: TextOverlay[]
): void {
    for (const t of overlays) {
        ctx.save();
        ctx.font = `${t.fontSize}px ${t.fontFamily}`;
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
    }
}

// Adjustment slider metadata for UI
export const adjustmentSliders: { key: keyof AdjustmentValues; label: string; min: number; max: number; icon: string }[] = [
    { key: 'exposure', label: 'Exposure', min: -100, max: 100, icon: '☀' },
    { key: 'brilliance', label: 'Brilliance', min: -100, max: 100, icon: '✦' },
    { key: 'highlights', label: 'Highlights', min: -100, max: 100, icon: '◐' },
    { key: 'shadows', label: 'Shadows', min: -100, max: 100, icon: '◑' },
    { key: 'contrast', label: 'Contrast', min: -100, max: 100, icon: '◑' },
    { key: 'brightness', label: 'Brightness', min: -100, max: 100, icon: '☀' },
    { key: 'blackPoint', label: 'Black Point', min: -100, max: 100, icon: '●' },
    { key: 'saturation', label: 'Saturation', min: -100, max: 100, icon: '◈' },
    { key: 'vibrance', label: 'Vibrance', min: -100, max: 100, icon: '◇' },
    { key: 'warmth', label: 'Warmth', min: -100, max: 100, icon: '🌡' },
    { key: 'tint', label: 'Tint', min: -100, max: 100, icon: '◆' },
    { key: 'sharpness', label: 'Sharpness', min: 0, max: 100, icon: '△' },
    { key: 'definition', label: 'Definition', min: -100, max: 100, icon: '▲' },
    { key: 'noiseReduction', label: 'Noise Reduction', min: 0, max: 100, icon: '▽' },
    { key: 'vignette', label: 'Vignette', min: 0, max: 100, icon: '○' },
];
