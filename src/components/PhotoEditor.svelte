<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { icons } from "../lib/icons";
    import { selectedPhoto, showInfoPanel } from "../lib/store";
    import { convertFileSrc } from "@tauri-apps/api/core";
    import { invoke } from "@tauri-apps/api/core";
    import {
        type AdjustmentValues,
        type CropState,
        type DrawStroke,
        type FilterPreset,
        defaultAdjustments,
        filterPresets,
        adjustmentSliders,
        aspectRatios,
        applyAdjustments,
        renderStrokes,
        canvasToBase64,
    } from "../lib/imageProcessing";
    import { getThumbnail } from "../lib/store";

    export let onClose: () => void;

    type EditorMode = "adjust" | "filters" | "crop" | "markup";
    let activeMode: EditorMode = "adjust";

    // State
    let adjustments: AdjustmentValues = { ...defaultAdjustments };
    let activeFilter: string = "original";
    let cropState: CropState = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
        flipH: false,
        flipV: false,
        aspectRatio: null,
    };
    let strokes: DrawStroke[] = [];
    let isDrawing = false;
    let drawTool: "pen" | "highlighter" | "pencil" = "pen";
    let drawColor = "#ff3b30";
    let drawSize = 4;
    let saving = false;
    let hasChanges = false;

    // Canvas refs
    let canvasEl: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let sourceImg: HTMLImageElement;
    let sourceCanvas: HTMLCanvasElement;
    let imageLoaded = false;
    let imgW = 0;
    let imgH = 0;

    // Undo stack
    let undoStack: {
        adj: AdjustmentValues;
        filter: string;
        strokes: DrawStroke[];
    }[] = [];

    const drawColors = [
        "#ff3b30",
        "#ff9500",
        "#ffcc00",
        "#34c759",
        "#007aff",
        "#5856d6",
        "#af52de",
        "#000000",
        "#ffffff",
    ];

    onMount(async () => {
        if (!$selectedPhoto) return;

        // Load full-res image
        const thumbPath = await getThumbnail($selectedPhoto.path);
        if (!thumbPath) return;

        sourceImg = new Image();
        sourceImg.crossOrigin = "anonymous";
        sourceImg.onload = () => {
            imgW = sourceImg.naturalWidth;
            imgH = sourceImg.naturalHeight;
            cropState = { ...cropState, width: imgW, height: imgH };

            // Create source canvas
            sourceCanvas = document.createElement("canvas");
            sourceCanvas.width = imgW;
            sourceCanvas.height = imgH;
            const sctx = sourceCanvas.getContext("2d")!;
            sctx.drawImage(sourceImg, 0, 0);

            // Setup display canvas
            canvasEl.width = imgW;
            canvasEl.height = imgH;
            ctx = canvasEl.getContext("2d")!;
            imageLoaded = true;
            renderPreview();
        };
        sourceImg.src = convertFileSrc(thumbPath);
    });

    function renderPreview() {
        if (!ctx || !sourceCanvas) return;
        // Apply adjustments
        applyAdjustments(ctx, sourceCanvas, adjustments, imgW, imgH);
        // Render markup strokes
        if (strokes.length > 0) {
            renderStrokes(ctx, strokes);
        }
    }

    function pushUndo() {
        undoStack = [
            ...undoStack,
            {
                adj: { ...adjustments },
                filter: activeFilter,
                strokes: strokes.map((s) => ({ ...s, points: [...s.points] })),
            },
        ];
        hasChanges = true;
    }

    function undo() {
        if (undoStack.length === 0) return;
        const prev = undoStack[undoStack.length - 1];
        undoStack = undoStack.slice(0, -1);
        adjustments = { ...prev.adj };
        activeFilter = prev.filter;
        strokes = prev.strokes;
        renderPreview();
        if (undoStack.length === 0) hasChanges = false;
    }

    function resetAll() {
        pushUndo();
        adjustments = { ...defaultAdjustments };
        activeFilter = "original";
        strokes = [];
        renderPreview();
    }

    // ── Adjustment handlers ──

    function onSliderChange(key: keyof AdjustmentValues, value: number) {
        pushUndo();
        adjustments = { ...adjustments, [key]: value };
        renderPreview();
    }

    // ── Filter handlers ──

    function applyFilter(filter: FilterPreset) {
        pushUndo();
        activeFilter = filter.id;
        if (filter.id === "original") {
            adjustments = { ...defaultAdjustments };
        } else {
            adjustments = { ...defaultAdjustments, ...filter.adjustments };
        }
        renderPreview();
    }

    // ── Crop handlers ──

    function rotate90() {
        pushUndo();
        cropState = { ...cropState, rotation: (cropState.rotation + 90) % 360 };
        renderPreview();
    }

    function flipHorizontal() {
        pushUndo();
        cropState = { ...cropState, flipH: !cropState.flipH };
        renderPreview();
    }

    function flipVertical() {
        pushUndo();
        cropState = { ...cropState, flipV: !cropState.flipV };
        renderPreview();
    }

    function setAspectRatio(ratio: number | null) {
        cropState = { ...cropState, aspectRatio: ratio };
    }

    // ── Markup handlers ──

    function startDraw(e: MouseEvent) {
        if (activeMode !== "markup") return;
        isDrawing = true;
        const rect = canvasEl.getBoundingClientRect();
        const scaleX = imgW / rect.width;
        const scaleY = imgH / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        pushUndo();
        strokes = [
            ...strokes,
            {
                tool: drawTool,
                color: drawColor,
                size: drawSize,
                points: [{ x, y }],
            },
        ];
    }

    function moveDraw(e: MouseEvent) {
        if (!isDrawing || activeMode !== "markup") return;
        const rect = canvasEl.getBoundingClientRect();
        const scaleX = imgW / rect.width;
        const scaleY = imgH / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const last = strokes[strokes.length - 1];
        last.points.push({ x, y });
        strokes = [...strokes];
        renderPreview();
    }

    function endDraw() {
        isDrawing = false;
    }

    // ── Save ──

    async function handleSave() {
        if (!$selectedPhoto || !canvasEl) return;
        saving = true;
        try {
            const base64 = canvasToBase64(canvasEl, "image/jpeg", 0.95);
            // Strip the data:image/jpeg;base64, prefix
            const data = base64.split(",")[1];
            const originalPath = $selectedPhoto.path;
            // Save as _edited copy next to original
            const ext = originalPath.split(".").pop() || "jpg";
            const baseName = originalPath.replace(`.${ext}`, "");
            const savePath = `${baseName}_edited.${ext}`;
            await invoke("save_edited_photo", {
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
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="editor-overlay">
    <!-- Top bar -->
    <header class="editor-header">
        <button class="editor-btn cancel" on:click={onClose}>Cancel</button>
        <div class="editor-title">Edit Photo</div>
        <div class="editor-actions">
            <button
                class="editor-btn"
                on:click={undo}
                disabled={undoStack.length === 0}
                title="Undo (Ctrl+Z)"
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
            </button>
            <button
                class="editor-btn"
                on:click={resetAll}
                disabled={!hasChanges}>Reset</button
            >
            <button
                class="editor-btn save"
                on:click={handleSave}
                disabled={!hasChanges || saving}
            >
                {saving ? "Saving…" : "Save Copy"}
            </button>
        </div>
    </header>

    <!-- Main canvas area -->
    <div class="editor-canvas-area">
        {#if !imageLoaded}
            <div class="editor-loading">
                <div class="loading-spinner"></div>
                <span>Loading image…</span>
            </div>
        {/if}
        <canvas
            bind:this={canvasEl}
            class="editor-canvas"
            class:drawing={activeMode === "markup"}
            on:mousedown={startDraw}
            on:mousemove={moveDraw}
            on:mouseup={endDraw}
            on:mouseleave={endDraw}
        ></canvas>
    </div>

    <!-- Bottom panel -->
    <div class="editor-bottom">
        <!-- Mode tabs -->
        <nav class="mode-tabs">
            <button
                class="mode-tab"
                class:active={activeMode === "adjust"}
                on:click={() => (activeMode = "adjust")}
            >
                <span class="mode-icon">☀</span>
                <span>Adjust</span>
            </button>
            <button
                class="mode-tab"
                class:active={activeMode === "filters"}
                on:click={() => (activeMode = "filters")}
            >
                <span class="mode-icon">◈</span>
                <span>Filters</span>
            </button>
            <button
                class="mode-tab"
                class:active={activeMode === "crop"}
                on:click={() => (activeMode = "crop")}
            >
                <span class="mode-icon">⬔</span>
                <span>Crop</span>
            </button>
            <button
                class="mode-tab"
                class:active={activeMode === "markup"}
                on:click={() => (activeMode = "markup")}
            >
                <span class="mode-icon">✎</span>
                <span>Markup</span>
            </button>
        </nav>

        <!-- Controls panel -->
        <div class="controls-panel">
            {#if activeMode === "adjust"}
                <div class="adjustment-list no-scrollbar">
                    {#each adjustmentSliders as slider}
                        <div class="adj-row">
                            <div class="adj-info">
                                <span class="adj-icon">{slider.icon}</span>
                                <span class="adj-label">{slider.label}</span>
                            </div>
                            <div class="adj-control">
                                <input
                                    type="range"
                                    min={slider.min}
                                    max={slider.max}
                                    value={adjustments[slider.key]}
                                    on:input={(e) =>
                                        onSliderChange(
                                            slider.key,
                                            parseInt(e.currentTarget.value),
                                        )}
                                    class="adj-slider"
                                />
                                <span class="adj-value"
                                    >{adjustments[slider.key]}</span
                                >
                            </div>
                        </div>
                    {/each}
                </div>
            {:else if activeMode === "filters"}
                <div class="filter-grid no-scrollbar">
                    {#each filterPresets as filter}
                        <button
                            class="filter-card"
                            class:active={activeFilter === filter.id}
                            on:click={() => applyFilter(filter)}
                        >
                            <div class="filter-preview">
                                <span class="filter-icon">◈</span>
                            </div>
                            <span class="filter-name">{filter.name}</span>
                        </button>
                    {/each}
                </div>
            {:else if activeMode === "crop"}
                <div class="crop-controls">
                    <div class="crop-section">
                        <h4 class="crop-title">Aspect Ratio</h4>
                        <div class="ratio-grid">
                            {#each aspectRatios as ratio}
                                <button
                                    class="ratio-btn"
                                    class:active={cropState.aspectRatio ===
                                        ratio.value}
                                    on:click={() => setAspectRatio(ratio.value)}
                                >
                                    {ratio.label}
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div class="crop-section">
                        <h4 class="crop-title">Straighten</h4>
                        <input
                            type="range"
                            min="-45"
                            max="45"
                            value={cropState.rotation}
                            on:input={(e) => {
                                pushUndo();
                                cropState = {
                                    ...cropState,
                                    rotation: parseInt(e.currentTarget.value),
                                };
                                renderPreview();
                            }}
                            class="straighten-slider"
                        />
                        <span class="straighten-value"
                            >{cropState.rotation}°</span
                        >
                    </div>

                    <div class="crop-actions">
                        <button class="crop-action-btn" on:click={rotate90}>
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <polyline points="1 4 1 10 7 10"></polyline>
                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"
                                ></path>
                            </svg>
                            Rotate 90°
                        </button>
                        <button
                            class="crop-action-btn"
                            on:click={flipHorizontal}
                        >
                            ⇔ Flip H
                        </button>
                        <button class="crop-action-btn" on:click={flipVertical}>
                            ⇕ Flip V
                        </button>
                    </div>
                </div>
            {:else if activeMode === "markup"}
                <div class="markup-controls">
                    <div class="markup-section">
                        <h4 class="markup-title">Tool</h4>
                        <div class="tool-group">
                            <button
                                class="tool-btn"
                                class:active={drawTool === "pen"}
                                on:click={() => (drawTool = "pen")}>Pen</button
                            >
                            <button
                                class="tool-btn"
                                class:active={drawTool === "highlighter"}
                                on:click={() => (drawTool = "highlighter")}
                                >Highlight</button
                            >
                            <button
                                class="tool-btn"
                                class:active={drawTool === "pencil"}
                                on:click={() => (drawTool = "pencil")}
                                >Pencil</button
                            >
                        </div>
                    </div>

                    <div class="markup-section">
                        <h4 class="markup-title">Color</h4>
                        <div class="color-palette">
                            {#each drawColors as color}
                                <button
                                    class="color-dot"
                                    class:active={drawColor === color}
                                    style="background: {color}; {color ===
                                    '#ffffff'
                                        ? 'border: 1px solid rgba(255,255,255,0.3);'
                                        : ''}"
                                    on:click={() => (drawColor = color)}
                                ></button>
                            {/each}
                        </div>
                    </div>

                    <div class="markup-section">
                        <h4 class="markup-title">Size</h4>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            bind:value={drawSize}
                            class="size-slider"
                        />
                    </div>
                </div>
            {/if}
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
        background: #0a0a0a;
        animation: fadeIn var(--duration-fast) var(--ease-out);
    }

    /* ── Header ── */
    .editor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--sp-2) var(--sp-4);
        height: 48px;
        flex-shrink: 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .editor-title {
        font-size: var(--text-sm);
        font-weight: 600;
        color: rgba(255, 255, 255, 0.85);
    }

    .editor-actions {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
    }

    .editor-btn {
        padding: 6px 14px;
        border-radius: var(--radius-md);
        font-size: var(--text-sm);
        font-weight: 500;
        color: rgba(255, 255, 255, 0.7);
        transition: var(--transition-fast);
    }

    .editor-btn :global(svg) {
        display: block;
    }

    .editor-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }

    .editor-btn:disabled {
        opacity: 0.35;
        cursor: default;
    }

    .editor-btn.cancel {
        color: rgba(255, 255, 255, 0.5);
    }

    .editor-btn.save {
        background: var(--accent);
        color: white;
        font-weight: 600;
    }

    .editor-btn.save:hover {
        background: var(--accent-hover);
    }

    .editor-btn.save:disabled {
        opacity: 0.5;
    }

    /* ── Canvas Area ── */
    .editor-canvas-area {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        padding: var(--sp-3);
    }

    .editor-canvas {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: var(--radius-sm);
    }

    .editor-canvas.drawing {
        cursor: crosshair;
    }

    .editor-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--sp-2);
        color: rgba(255, 255, 255, 0.5);
        font-size: var(--text-sm);
    }

    .loading-spinner {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.08);
        border-top-color: rgba(255, 255, 255, 0.5);
        animation: spin 0.7s linear infinite;
    }

    /* ── Bottom Panel ── */
    .editor-bottom {
        flex-shrink: 0;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        background: rgba(15, 15, 15, 0.95);
        backdrop-filter: blur(20px);
    }

    .mode-tabs {
        display: flex;
        justify-content: center;
        gap: 2px;
        padding: var(--sp-2) var(--sp-4);
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .mode-tab {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 6px 20px;
        border-radius: var(--radius-md);
        color: rgba(255, 255, 255, 0.4);
        font-size: 11px;
        font-weight: 500;
        transition: var(--transition-fast);
    }

    .mode-tab:hover {
        color: rgba(255, 255, 255, 0.6);
    }

    .mode-tab.active {
        color: var(--accent);
        background: var(--accent-subtle);
    }

    .mode-icon {
        font-size: 16px;
        line-height: 1;
    }

    /* ── Controls Panel ── */
    .controls-panel {
        padding: var(--sp-3) var(--sp-4);
        max-height: 200px;
        overflow-y: auto;
    }

    /* Adjustments */
    .adjustment-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .adj-row {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        padding: 4px var(--sp-2);
        border-radius: var(--radius-sm);
    }

    .adj-row:hover {
        background: rgba(255, 255, 255, 0.03);
    }

    .adj-info {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        width: 120px;
        flex-shrink: 0;
    }

    .adj-icon {
        font-size: 14px;
        width: 20px;
        text-align: center;
        color: rgba(255, 255, 255, 0.4);
    }

    .adj-label {
        font-size: var(--text-xs);
        color: rgba(255, 255, 255, 0.65);
        font-weight: 450;
    }

    .adj-control {
        flex: 1;
        display: flex;
        align-items: center;
        gap: var(--sp-2);
    }

    .adj-slider {
        -webkit-appearance: none;
        appearance: none;
        flex: 1;
        height: 3px;
        background: rgba(255, 255, 255, 0.12);
        border-radius: var(--radius-full);
        outline: none;
    }

    .adj-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    }

    .adj-value {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        font-weight: 500;
        width: 30px;
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    /* Filters */
    .filter-grid {
        display: flex;
        gap: var(--sp-2);
        overflow-x: auto;
        padding: var(--sp-1) 0;
    }

    .filter-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
        transition: var(--transition-fast);
    }

    .filter-preview {
        width: 64px;
        height: 64px;
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid transparent;
        transition: var(--transition-fast);
    }

    .filter-card.active .filter-preview {
        border-color: var(--accent);
    }

    .filter-icon {
        font-size: 20px;
        color: rgba(255, 255, 255, 0.3);
    }

    .filter-name {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.5);
        font-weight: 500;
    }

    .filter-card.active .filter-name {
        color: var(--accent);
    }

    /* Crop */
    .crop-controls {
        display: flex;
        flex-direction: column;
        gap: var(--sp-4);
    }

    .crop-title,
    .markup-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: rgba(255, 255, 255, 0.3);
        margin-bottom: var(--sp-2);
    }

    .ratio-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }

    .ratio-btn {
        padding: 5px 12px;
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
        font-weight: 500;
        color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid transparent;
        transition: var(--transition-fast);
    }

    .ratio-btn:hover {
        background: rgba(255, 255, 255, 0.08);
    }

    .ratio-btn.active {
        border-color: var(--accent);
        color: var(--accent);
        background: var(--accent-subtle);
    }

    .straighten-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 200px;
        height: 3px;
        background: rgba(255, 255, 255, 0.12);
        border-radius: var(--radius-full);
        outline: none;
    }

    .straighten-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
    }

    .straighten-value {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        font-weight: 500;
        margin-left: var(--sp-2);
    }

    .crop-actions {
        display: flex;
        gap: var(--sp-2);
    }

    .crop-action-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border-radius: var(--radius-md);
        font-size: var(--text-xs);
        font-weight: 500;
        color: rgba(255, 255, 255, 0.6);
        background: rgba(255, 255, 255, 0.06);
        transition: var(--transition-fast);
    }

    .crop-action-btn :global(svg) {
        width: 14px;
        height: 14px;
    }

    .crop-action-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }

    /* Markup */
    .markup-controls {
        display: flex;
        gap: var(--sp-6);
        align-items: flex-start;
    }

    .tool-group {
        display: flex;
        gap: 2px;
        background: rgba(255, 255, 255, 0.04);
        border-radius: var(--radius-md);
        padding: 2px;
    }

    .tool-btn {
        padding: 5px 12px;
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
        font-weight: 500;
        color: rgba(255, 255, 255, 0.5);
        transition: var(--transition-fast);
    }

    .tool-btn.active {
        background: var(--accent);
        color: white;
    }

    .color-palette {
        display: flex;
        gap: 4px;
    }

    .color-dot {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        cursor: pointer;
        transition: transform var(--duration-fast) var(--ease-spring);
    }

    .color-dot:hover {
        transform: scale(1.15);
    }

    .color-dot.active {
        transform: scale(1.2);
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
    }

    .size-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100px;
        height: 3px;
        background: rgba(255, 255, 255, 0.12);
        border-radius: var(--radius-full);
        outline: none;
    }

    .size-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
    }
</style>
