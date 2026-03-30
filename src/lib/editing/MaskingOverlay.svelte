<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { MaskLayer } from './adjustments';

    export let masks: MaskLayer[] = [];
    export let activeMaskId: string | null = null;
    export let previewWidth: number = 0;
    export let previewHeight: number = 0;
    export let activeNewType: string | null = null;

    const dispatch = createEventDispatcher();

    let isInteraction = false;
    let dragAction: string | null = null;
    let dragMaskId: string | null = null;
    
    function startDrag(action: string, maskId: string, e: MouseEvent | PointerEvent) {
        e.preventDefault();
        e.stopPropagation();
        
        isInteraction = true;
        dragAction = action;
        dragMaskId = maskId;
        
        if (activeMaskId !== maskId) {
            dispatch('select', maskId);
        }

        window.addEventListener('pointermove', onDrag);
        window.addEventListener('pointerup', endDrag);
    }

    function onDrag(e: PointerEvent) {
        if (!isInteraction || !dragMaskId) return;

        // Container client bounds
        const container = e.target instanceof Element ? e.target.closest('.masking-overlay-container') : null;
        if (!container && dragAction === 'new') return;

        // Calculate normalized coordinates based on the pointer event within the preview region
        // We know clientX/Y. We assume preview bounds match container bounds here via CSS `inset: 0`
        let rect: DOMRect;
        if (container) rect = container.getBoundingClientRect();
        else {
            const currentEl = document.querySelector('.masking-overlay-container');
            if (currentEl) rect = currentEl.getBoundingClientRect();
            else return;
        }

        const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / previewWidth));
        const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / previewHeight));

        const mi = masks.findIndex(m => m.id === dragMaskId);
        if (mi < 0) return;
        const mask = masks[mi];

        if (dragAction === 'p1') {
            mask.x1 = nx;
            mask.y1 = ny;
        } else if (dragAction === 'p2') {
            mask.x2 = nx;
            mask.y2 = ny;
        } else if (dragAction === 'center') {
            const dx = nx - mask.x1;
            const dy = ny - mask.y1;
            mask.x1 = nx; mask.y1 = ny;
            mask.x2 += dx; mask.y2 += dy;
        } else if (dragAction === 'radius') {
            // Distance from center to nx, ny
            // We use longest edge to normalize radius (like the rust backend)
            const w = previewWidth;
            const h = previewHeight;
            const maxEdge = Math.max(w, h);
            
            const realDx = (nx - mask.x1) * w;
            const realDy = (ny - mask.y1) * h;
            const dist = Math.sqrt(realDx*realDx + realDy*realDy) / maxEdge;
            mask.radius = Math.max(0.01, dist);
            // Ensure feather is smaller than radius
            mask.feather = Math.min(mask.feather, mask.radius);
        } else if (dragAction === 'feather') {
            const w = previewWidth;
            const h = previewHeight;
            const maxEdge = Math.max(w, h);
            
            const realDx = (nx - mask.x1) * w;
            const realDy = (ny - mask.y1) * h;
            const dist = Math.sqrt(realDx*realDx + realDy*realDy) / maxEdge;
            // dist is the inner feather distance, meaning feather = radius - dist
            const rad = mask.radius;
            let featherDist = rad - dist;
            mask.feather = Math.max(0, Math.min(rad, featherDist));
        }

        masks[mi] = { ...mask };
        dispatch('change');
    }

    function endDrag() {
        if (!isInteraction) return;
        isInteraction = false;
        dragAction = null;
        dragMaskId = null;
        window.removeEventListener('pointermove', onDrag);
        window.removeEventListener('pointerup', endDrag);
        dispatch('changeEnd'); // Commits to history
    }

    // Creating new masks by dragging on the container
    function onContainerPointerDown(e: PointerEvent) {
        if (isInteraction) return;
        if (!activeNewType) return;
        
        e.preventDefault();
        
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / previewWidth));
        const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / previewHeight));

        const newId = 'mask_' + Date.now();
        const newMask: MaskLayer = {
            id: newId,
            name: `${activeNewType === 'linear_gradient' ? 'Linear' : 'Radial'} ${masks.length + 1}`,
            type: activeNewType as any,
            active: true,
            inverted: false,
            x1: nx,
            y1: ny,
            x2: nx + 0.01, // give tiny length immediately to avoid singularity
            y2: ny + 0.01,
            radius: 0.1,
            feather: 0.05,
            adjustments: {}
        };

        dispatch('addMask', newMask);
        
        // Start dragging the end node dynamically 
        isInteraction = true;
        dragMaskId = newId;
        dragAction = activeNewType === 'linear_gradient' ? 'p2' : 'radius';
        
        window.addEventListener('pointermove', onDrag);
        window.addEventListener('pointerup', endDrag);
    }
</script>

<div 
    class="masking-overlay-container" 
    class:creating={!!activeNewType}
    on:pointerdown={onContainerPointerDown}
>
    <!-- SVG overlay for rendering mask lines, dots, radii -->
    <svg width="100%" height="100%" pointer-events="none">
        {#each masks as m}
            {#if m.active && (m.id === activeMaskId || activeMaskId === null)}
                
                {#if m.type === 'linear_gradient'}
                    <!-- Center Line -->
                    <line 
                        x1="{m.x1 * 100}%" 
                        y1="{m.y1 * 100}%" 
                        x2="{m.x2 * 100}%" 
                        y2="{m.y2 * 100}%" 
                        stroke="rgba(255,255,255,0.7)" 
                        stroke-width="1"
                        stroke-dasharray="4"
                    />
                    
                    <!-- Center Node (draggable to pan) -->
                    <circle 
                        cx="{m.x1 * 100}%" 
                        cy="{m.y1 * 100}%" 
                        r="6" 
                        fill="white" 
                        stroke="black"
                        stroke-width="2"
                        class="handle-node"
                        pointer-events="auto"
                        on:pointerdown={(e) => startDrag('center', m.id, e)}
                    />

                    <!-- End Node (draggable to angle/dist) -->
                    <circle 
                        cx="{m.x2 * 100}%" 
                        cy="{m.y2 * 100}%" 
                        r="6" 
                        fill="white" 
                        stroke="black"
                        stroke-width="2"
                        class="handle-node"
                        pointer-events="auto"
                        on:pointerdown={(e) => startDrag('p2', m.id, e)}
                    />
                {/if}

                {#if m.type === 'radial_gradient'}
                    <!-- Center Node -->
                    <circle 
                        cx="{m.x1 * 100}%" 
                        cy="{m.y1 * 100}%" 
                        r="6" 
                        fill="white" 
                        stroke="black"
                        stroke-width="2"
                        class="handle-node"
                        pointer-events="auto"
                        on:pointerdown={(e) => startDrag('center', m.id, e)}
                    />
                    
                    <!-- Outer Radius Circle -->
                    <circle 
                        cx="{m.x1 * previewWidth}" 
                        cy="{m.y1 * previewHeight}" 
                        r="{m.radius * Math.max(previewWidth, previewHeight)}" 
                        fill="none" 
                        stroke="rgba(255,255,255,0.8)"
                        stroke-width="1.5"
                    />

                    <!-- Outer Radius Handle -->
                    <circle 
                        cx="{m.x1 * previewWidth + m.radius * Math.max(previewWidth, previewHeight)}" 
                        cy="{m.y1 * previewHeight}" 
                        r="5" 
                        fill="white" 
                        stroke="black"
                        class="handle-node"
                        pointer-events="auto"
                        on:pointerdown={(e) => startDrag('radius', m.id, e)}
                    />

                    <!-- Inner Feather Circle -->
                    <circle 
                        cx="{m.x1 * previewWidth}" 
                        cy="{m.y1 * previewHeight}" 
                        r="{(m.radius - m.feather) * Math.max(previewWidth, previewHeight)}" 
                        fill="none" 
                        stroke="rgba(255,255,255,0.4)"
                        stroke-width="1"
                        stroke-dasharray="4"
                    />

                    <!-- Inner Feather Handle -->
                    <circle 
                        cx="{m.x1 * previewWidth + (m.radius - m.feather) * Math.max(previewWidth, previewHeight)}" 
                        cy="{m.y1 * previewHeight}" 
                        r="5" 
                        fill="#ccc" 
                        stroke="black"
                        class="handle-node"
                        pointer-events="auto"
                        on:pointerdown={(e) => startDrag('feather', m.id, e)}
                    />
                {/if}

            {/if}
        {/each}
    </svg>
</div>

<style>
    .masking-overlay-container {
        position: absolute;
        inset: 0;
        z-index: 50;
        pointer-events: none; /* Let empty clicks flow under */
    }

    /* When the user clicks the "Add Gradient" button, the canvas itself becomes clickable */
    .masking-overlay-container.creating {
        pointer-events: auto;
        cursor: crosshair;
    }

    .handle-node {
        cursor: pointer;
        transition: transform 100ms ease;
    }

    .handle-node:hover {
        transform: scale(1.3);
    }
</style>
