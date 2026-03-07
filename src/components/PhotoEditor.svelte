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
    let sidebarWidth = 320;
    let isResizing = false;
    const MIN_SIDEBAR = 260;
    const MAX_SIDEBAR = 480;

    // Zoom
    let zoomLevel = 1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let panStartPanX = 0;
    let panStartPanY = 0;

    function zoomIn() {
        zoomLevel = Math.min(zoomLevel * 1.25, 8);
    }
    function zoomOut() {
        zoomLevel = Math.max(zoomLevel / 1.25, 0.25);
    }
    function zoomFit() {
        zoomLevel = 1;
        panX = 0;
        panY = 0;
    }
    function zoom100() {
        zoomLevel = 1;
        panX = 0;
        panY = 0;
        // Calculate 100% zoom relative to fit
        if (canvasEl) {
            const area = canvasEl.parentElement?.parentElement;
            if (area) {
                const areaW = area.clientWidth - 48;
                const areaH = area.clientHeight - 48;
                const fitScale = Math.min(areaW / imgW, areaH / imgH, 1);
                zoomLevel = 1 / fitScale;
            }
        }
    }

    function handleWheel(e: WheelEvent) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        zoomLevel = Math.max(0.25, Math.min(8, zoomLevel * delta));
    }

    function handleCanvasPointerDown(e: MouseEvent) {
        if (zoomLevel > 1) {
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            panStartPanX = panX;
            panStartPanY = panY;
        }
    }

    function handleCanvasPointerMove(e: MouseEvent) {
        if (!isPanning) return;
        panX = panStartPanX + (e.clientX - panStartX);
        panY = panStartPanY + (e.clientY - panStartY);
    }

    function handleCanvasPointerUp() {
        isPanning = false;
    }

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

            // Setup display canvas
            initCanvas();
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

    function initCanvas() {
        const tryInit = () => {
            if (canvasEl) {
                canvasEl.width = imgW;
                canvasEl.height = imgH;
                ctx = canvasEl.getContext("2d")!;
                imageLoaded = true;
                ctx.drawImage(sourceCanvas, 0, 0);
                triggerProcess(true);
            } else {
                requestAnimationFrame(tryInit);
            }
        };
        tryInit();
    }

    async function triggerProcess(preview: boolean = true) {
        if (!imagePath || !canvasEl || !ctx) return;

        const result = await processImage(imagePath, adjustments, preview, preview ? 80 : 0);
        if (result && ctx && canvasEl) {
            if (result.width !== canvasEl.width || result.height !== canvasEl.height) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = result.width;
                tempCanvas.height = result.height;
                const tempCtx = tempCanvas.getContext('2d')!;
                tempCtx.putImageData(result, 0, 0);
                ctx.drawImage(tempCanvas, 0, 0, canvasEl.width, canvasEl.height);
            } else {
                ctx.putImageData(result, 0, 0);
            }
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

    async function handleSave() {
        if (!$selectedPhoto || !canvasEl) return;
        saving = true;
        try {
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
        if (e.key === "=" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); zoomIn(); }
        if (e.key === "-" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); zoomOut(); }
        if (e.key === "0" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); zoomFit(); }
    }

    function handlePointerUp() {
        if (hasChanges) {
            triggerFullRes();
        }
    }

    $: zoomPercent = Math.round(zoomLevel * 100);
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
            <!-- Zoom controls -->
            <div class="zoom-controls">
                <button class="zoom-btn" on:click={zoomOut} title="Zoom out (Ctrl+-)">−</button>
                <button class="zoom-label" on:click={zoomFit} title="Fit to view (Ctrl+0)">{zoomPercent}%</button>
                <button class="zoom-btn" on:click={zoomIn} title="Zoom in (Ctrl+=)">+</button>
                <button class="zoom-btn text" on:click={zoom100} title="100%">1:1</button>
            </div>
            <div class="header-divider"></div>
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
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
            class="editor-canvas-area"
            on:wheel={handleWheel}
            on:mousedown={handleCanvasPointerDown}
            on:mousemove={handleCanvasPointerMove}
            on:mouseup={handleCanvasPointerUp}
            on:mouseleave={handleCanvasPointerUp}
            class:panning={isPanning}
            class:zoomable={zoomLevel > 1}
        >
            {#if !imageLoaded}
                <div class="editor-loading">
                    <div class="loading-spinner"></div>
                    <span>Loading image…</span>
                </div>
            {/if}
            <div
                class="canvas-wrapper"
                style="transform: scale({zoomLevel}) translate({panX / zoomLevel}px, {panY / zoomLevel}px);"
            >
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
    .editor-overlay {
        position: fixed;
        inset: 0;
        z-index: 600;
        display: flex;
        flex-direction: column;
        background: var(--md-sys-color-surface, #1a1a1f);
        animation: editorFadeIn 200ms cubic-bezier(0.2, 0, 0, 1);
    }

    @keyframes editorFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    /* ── Header ── */
    .editor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 12px;
        height: 48px;
        flex-shrink: 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        background: var(--md-sys-color-surface-container, #22222a);
    }

    .editor-title {
        font-family: 'Outfit', 'Instrument Sans', sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: var(--md-sys-color-on-surface, rgba(255, 255, 255, 0.85));
    }

    .editor-actions {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .header-divider {
        width: 1px;
        height: 20px;
        background: rgba(255,255,255,0.08);
        margin: 0 4px;
    }

    .editor-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 5px 12px;
        border-radius: 10px;
        font-family: 'Outfit', sans-serif;
        font-size: 12px;
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
        font-size: 13px;
    }

    .editor-btn.save {
        background: var(--md-sys-color-primary, #a0c4ff);
        color: var(--md-sys-color-on-primary, #003258);
        font-weight: 600;
    }

    .editor-btn.save:hover {
        filter: brightness(1.1);
    }

    .editor-btn.save:disabled {
        opacity: 0.5;
    }

    /* ── Zoom Controls ── */
    .zoom-controls {
        display: flex;
        align-items: center;
        background: var(--md-sys-color-surface-container-high, rgba(255,255,255,0.06));
        border-radius: 10px;
        overflow: hidden;
    }

    .zoom-btn {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        color: rgba(255,255,255,0.6);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 100ms ease;
    }

    .zoom-btn.text {
        font-size: 10px;
        width: auto;
        padding: 0 8px;
        font-family: 'Outfit', sans-serif;
        font-weight: 600;
        letter-spacing: 0.5px;
    }

    .zoom-btn:hover {
        background: rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.9);
    }

    .zoom-label {
        padding: 0 6px;
        height: 28px;
        display: flex;
        align-items: center;
        background: none;
        border: none;
        color: rgba(255,255,255,0.5);
        font-family: 'Outfit', monospace;
        font-size: 10px;
        cursor: pointer;
        min-width: 40px;
        justify-content: center;
    }

    .zoom-label:hover {
        color: rgba(255,255,255,0.8);
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
        background: #0c0c10;
        padding: 16px;
        min-width: 0;
    }

    .editor-canvas-area.zoomable {
        cursor: grab;
    }

    .editor-canvas-area.panning {
        cursor: grabbing;
    }

    .canvas-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 100%;
        max-height: 100%;
        position: relative;
        transform-origin: center center;
        transition: transform 50ms ease-out;
    }

    .editor-canvas {
        max-width: 100%;
        max-height: calc(100vh - 48px - 32px);
        object-fit: contain;
        border-radius: 4px;
        box-shadow: 0 4px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.03);
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
        font-family: 'Outfit', sans-serif;
        font-size: 13px;
        z-index: 2;
    }

    .loading-spinner {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.08);
        border-top-color: var(--md-sys-color-primary, #a0c4ff);
        animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* ── Resize Handle ── */
    .resize-handle {
        width: 5px;
        flex-shrink: 0;
        cursor: col-resize;
        position: relative;
        background: transparent;
        transition: background 150ms ease;
        z-index: 10;
    }

    .resize-handle:hover,
    .resize-handle.active {
        background: rgba(255, 255, 255, 0.04);
    }

    .resize-grip {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 3px;
        height: 28px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.1);
        transition: all 150ms ease;
    }

    .resize-handle:hover .resize-grip,
    .resize-handle.active .resize-grip {
        background: var(--md-sys-color-primary, #a0c4ff);
        height: 40px;
    }

    /* ── Sidebar Wrapper ── */
    .sidebar-wrapper {
        flex-shrink: 0;
        height: 100%;
        min-width: 260px;
        max-width: 480px;
        overflow: hidden;
    }
</style>
