// ── Image Processing Utilities ──
// Kept: CropState, DrawStroke, TextOverlay, rendering helpers, canvasToBase64
// Removed: Dead JS canvas-based pixel processing (replaced by Rust backend)

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

// ── Crop & Rotation ──

export function applyCropAndRotation(
    sourceCanvas: HTMLCanvasElement,
    crop: CropState
): HTMLCanvasElement {
    const result = document.createElement('canvas');
    const ctx = result.getContext('2d')!;

    const radians = (crop.rotation * Math.PI) / 180;
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
