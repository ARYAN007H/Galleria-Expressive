<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import {
        selectedPhoto,
        convertFileSource,
        invokeCommand,
    } from "../lib/store";
    import EditingSidebar from "../lib/editing/EditingSidebar.svelte";
    import {
        type AdjustmentState,
        defaultAdjustments,
        cloneAdjustments,
    } from "../lib/editing/adjustments";
    import {
        processImage,
        processImageFull,
        computeHistogram,
        type HistogramData,
    } from "../lib/editing/imageProcessor";
    import {
        type CropState,
        type DrawStroke,
        renderStrokes,
        canvasToBase64,
    } from "../lib/imageProcessing";

    export let onClose: () => void;

    // State
    let adjustments: AdjustmentState = cloneAdjustments(defaultAdjustments);
    let histogramData: HistogramData | null = null;
    let showOriginal = false;
    let saving = false;
    let hasChanges = false;
    let imagePath = '';

    // Canvas refs
    let canvasEl: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let sourceImg: HTMLImageElement;
    let sourceCanvas: HTMLCanvasElement;
    let imageLoaded = false;
    let imgW = 0;
    let imgH = 0;

    // Original image data for before/after
    let originalImageData: ImageData | null = null;

    // Undo
    let undoStack: AdjustmentState[] = [];

    // Resizable sidebar
    let sidebarWidth = 340;
    let isResizing = false;
    const MIN_SIDEBAR = 280;
    const MAX_SIDEBAR = 500;

    function startResize(e: MouseEvent) {
        e.preventDefault();
        isResizing = true;
        const startX = e.clientX;
        const startWidth = sidebarWidth;

        function onMove(ev: MouseEvent) {
            const delta = startX - ev.clientX;
            sidebarWidth = Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, startWidth + delta));
        }

        function onUp() {
            isResizing = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        }

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }

    onMount(async () => {
        if (!$selectedPhoto) return;

        imagePath = $selectedPhoto.path;
        sourceImg = new Image();
        sourceImg.crossOrigin = "anonymous";
        sourceImg.onload = () => {
            imgW = sourceImg.naturalWidth;
            imgH = sourceImg.naturalHeight;

            // Create source canvas
            sourceCanvas = document.createElement("canvas");
            sourceCanvas.width = imgW;
            sourceCanvas.height = imgH;
            const sctx = sourceCanvas.getContext("2d")!;
            sctx.drawImage(sourceImg, 0, 0);

            // Get original image data for before/after & initial histogram
            originalImageData = sctx.getImageData(0, 0, imgW, imgH);
            histogramData = computeHistogram(originalImageData);

            // Setup display canvas — guard against null binding
            if (canvasEl) {
                canvasEl.width = imgW;
                canvasEl.height = imgH;
                ctx = canvasEl.getContext("2d")!;
                imageLoaded = true;

                // Initial render: show the unprocessed image first
                ctx.drawImage(sourceCanvas, 0, 0);

                // Then trigger the Rust pipeline for initial view
                triggerProcess(true);
            } else {
                // Canvas not yet bound — wait a tick for Svelte to bind it
                requestAnimationFrame(() => {
                    if (canvasEl) {
                        canvasEl.width = imgW;
                        canvasEl.height = imgH;
                        ctx = canvasEl.getContext("2d")!;
                        imageLoaded = true;
                        ctx.drawImage(sourceCanvas, 0, 0);
                        triggerProcess(true);
                    } else {
                        console.error("Canvas element still not available after rAF");
                        imageLoaded = true;
                    }
                });
            }
        };
        sourceImg.onerror = () => {
            console.error("Failed to load image for editor");
            imageLoaded = true;
        };

        sourceImg.src = convertFileSource($selectedPhoto.path);

        setTimeout(() => {
            if (!imageLoaded) {
                console.warn("Editor image load timed out");
                imageLoaded = true;
            }
        }, 10000);
    });

    async function triggerProcess(preview: boolean = true) {
        if (!imagePath || !canvasEl || !ctx) return;

        const result = await processImage(imagePath, adjustments, preview, preview ? 80 : 0);
        if (result && ctx && canvasEl) {
            // If preview resolution differs from canvas, we need to scale
            if (result.width !== canvasEl.width || result.height !== canvasEl.height) {
                // Draw preview scaled to full canvas
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = result.width;
                tempCanvas.height = result.height;
                const tempCtx = tempCanvas.getContext('2d')!;
                tempCtx.putImageData(result, 0, 0);
                ctx.drawImage(tempCanvas, 0, 0, canvasEl.width, canvasEl.height);
            } else {
                ctx.putImageData(result, 0, 0);
            }

            // Update histogram
            histogramData = computeHistogram(result);
        }
    }

    async function triggerFullRes() {
        if (!imagePath || !canvasEl || !ctx) return;
        const result = await processImageFull(imagePath, adjustments);
        if (result && ctx && canvasEl) {
            if (result.width !== canvasEl.width || result.height !== canvasEl.height) {
                canvasEl.width = result.width;
                canvasEl.height = result.height;
            }
            ctx.putImageData(result, 0, 0);
            histogramData = computeHistogram(result);
        }
    }

    function onAdjustmentChange(e: CustomEvent<Partial<AdjustmentState>>) {
        undoStack = [...undoStack, cloneAdjustments(adjustments)];
        adjustments = { ...adjustments, ...e.detail };
        hasChanges = true;
        triggerProcess(true);
    }

    function onResetAll() {
        undoStack = [...undoStack, cloneAdjustments(adjustments)];
        adjustments = cloneAdjustments(defaultAdjustments);
        hasChanges = false;
        triggerProcess(true);
    }

    function onBeforeAfter(e: CustomEvent<boolean>) {
        showOriginal = e.detail;
        if (showOriginal && originalImageData && ctx) {
            ctx.putImageData(originalImageData, 0, 0);
        } else {
            triggerProcess(true);
        }
    }

    function undo() {
        if (undoStack.length === 0) return;
        adjustments = undoStack[undoStack.length - 1];
        undoStack = undoStack.slice(0, -1);
        triggerProcess(true);
        if (undoStack.length === 0) hasChanges = false;
    }

    function resetAll() {
        onResetAll();
    }

    // Save
    async function handleSave() {
        if (!$selectedPhoto || !canvasEl) return;
        saving = true;
        try {
            // Process at full resolution before saving
            await triggerFullRes();

            const base64 = canvasToBase64(canvasEl, "image/jpeg", 0.95);
            const data = base64.split(",")[1];
            const originalPath = $selectedPhoto.path;
            const ext = originalPath.split(".").pop() || "jpg";
            const baseName = originalPath.replace(`.${ext}`, "");
            const savePath = `${baseName}_edited.${ext}`;
            await invokeCommand("save_edited_photo", {
                imageData: data,
                targetPath: savePath,
            });
            onClose();
        } catch (err) {
            console.error("Save failed:", err);
        }
        saving = false;
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") onClose();
        if (e.key === "z" && (e.ctrlKey || e.metaKey)) undo();
    }

    // Handle pointer release for full-res processing
    function handlePointerUp() {
        if (hasChanges) {
            triggerFullRes();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} on:pointerup={handlePointerUp} />

<div class="editor-overlay">
    <!-- Top bar -->
    <header class="editor-header">
        <button class="editor-btn cancel" on:click={onClose}>
            <span class="btn-icon">✕</span>
            <span>Cancel</span>
        </button>
        <div class="editor-title">Edit Photo</div>
        <div class="editor-actions">
            <button
                class="editor-btn"
                on:click={undo}
                disabled={undoStack.length === 0}
                title="Undo (Ctrl+Z)"
            >
                ↩ Undo
            </button>
            <button
                class="editor-btn save"
                on:click={handleSave}
                disabled={!hasChanges || saving}
            >
                {saving ? "Saving…" : "Save Copy"}
            </button>
        </div>
    </header>

    <!-- Main content: Canvas + Sidebar -->
    <div class="editor-body">
        <!-- Canvas area -->
        <div class="editor-canvas-area">
            {#if !imageLoaded}
                <div class="editor-loading">
                    <div class="loading-spinner"></div>
                    <span>Loading image…</span>
                </div>
            {/if}
            <div class="canvas-wrapper">
                <canvas
                    bind:this={canvasEl}
                    class="editor-canvas"
                ></canvas>
            </div>
        </div>

        <!-- Resize handle -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
            class="resize-handle"
            class:active={isResizing}
            on:mousedown={startResize}
        >
            <div class="resize-grip"></div>
        </div>

        <!-- Editing Sidebar -->
        <div class="sidebar-wrapper" style="width: {sidebarWidth}px;">
            <EditingSidebar
                {adjustments}
                {histogramData}
                {showOriginal}
                on:change={onAdjustmentChange}
                on:resetAll={onResetAll}
                on:beforeAfter={onBeforeAfter}
            />
        </div>
    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

    .editor-overlay {
        position: fixed;
        inset: 0;
        z-index: 600;
        display: flex;
        flex-direction: column;
        background: var(--md-sys-color-surface, #1a1a1f);
        animation: fadeIn 250ms cubic-bezier(0.2, 0, 0, 1);
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    /* ── Header ── */
    .editor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;
        height: 52px;
        flex-shrink: 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        background: var(--md-sys-color-surface-container, #22222a);
    }

    .editor-title {
        font-family: 'Instrument Sans', sans-serif;
        font-size: 15px;
        font-weight: 600;
        color: var(--md-sys-color-on-surface, rgba(255, 255, 255, 0.85));
    }

    .editor-actions {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .editor-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 14px;
        border-radius: 12px;
        font-family: 'Instrument Sans', sans-serif;
        font-size: 13px;
        font-weight: 500;
        color: var(--md-sys-color-on-surface-variant, rgba(255, 255, 255, 0.65));
        background: var(--md-sys-color-surface-container-high, rgba(255,255,255,0.06));
        border: none;
        cursor: pointer;
        transition: all 150ms cubic-bezier(0.2, 0, 0, 1);
    }

    .editor-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.9);
    }

    .editor-btn:disabled {
        opacity: 0.35;
        cursor: default;
    }

    .editor-btn.cancel {
        color: rgba(255, 255, 255, 0.5);
        background: transparent;
    }

    .editor-btn.cancel:hover {
        color: rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.06);
    }

    .btn-icon {
        font-size: 14px;
    }

    .editor-btn.save {
        background: var(--md-sys-color-primary, #a0c4ff);
        color: var(--md-sys-color-on-primary, #003258);
        font-weight: 600;
    }

    .editor-btn.save:hover {
        filter: brightness(1.1);
        transform: scale(1.02);
    }

    .editor-btn.save:disabled {
        opacity: 0.5;
        transform: none;
    }

    /* ── Body: Canvas + Sidebar ── */
    .editor-body {
        flex: 1;
        display: flex;
        min-height: 0;
    }

    .editor-canvas-area {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        background: #0e0e12;
        padding: 24px;
        min-width: 0;
    }

    .canvas-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 100%;
        max-height: 100%;
        position: relative;
    }

    .editor-canvas {
        max-width: 100%;
        max-height: calc(100vh - 52px);
        object-fit: contain;
        border-radius: 6px;
        box-shadow: 0 4px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.04);
    }

    .editor-loading {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: rgba(255, 255, 255, 0.5);
        font-family: 'Instrument Sans', sans-serif;
        font-size: 14px;
        z-index: 2;
    }

    .loading-spinner {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.08);
        border-top-color: var(--md-sys-color-primary, #a0c4ff);
        animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* ── Resize Handle ── */
    .resize-handle {
        width: 6px;
        flex-shrink: 0;
        cursor: col-resize;
        position: relative;
        background: transparent;
        transition: background 150ms ease;
        z-index: 10;
    }

    .resize-handle:hover,
    .resize-handle.active {
        background: rgba(255, 255, 255, 0.06);
    }

    .resize-grip {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 3px;
        height: 32px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.12);
        transition: all 150ms ease;
    }

    .resize-handle:hover .resize-grip,
    .resize-handle.active .resize-grip {
        background: var(--md-sys-color-primary, #a0c4ff);
        height: 48px;
        width: 3px;
    }

    /* ── Sidebar Wrapper ── */
    .sidebar-wrapper {
        flex-shrink: 0;
        height: 100%;
        min-width: 280px;
        max-width: 500px;
        overflow: hidden;
    }

    .sidebar-wrapper :global(.editing-sidebar) {
        width: 100% !important;
    }
</style>
