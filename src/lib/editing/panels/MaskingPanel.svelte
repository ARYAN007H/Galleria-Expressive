<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import { type AdjustmentState, type MaskLayer, type MaskType, defaultAdjustments } from '../adjustments';
    import BasicPanel from './BasicPanel.svelte';
    import DetailPanel from './DetailPanel.svelte';

    export let adjustments: AdjustmentState;
    export let activeMaskId: string | null = null;
    export let activeNewType: string | null = null;

    const dispatch = createEventDispatcher();

    $: masks = adjustments.masks || [];
    $: activeMask = activeMaskId ? masks.find(m => m.id === activeMaskId) : null;

    // Create a fully-populated AdjustmentState object for the child panels
    // filling missing localized keys with their natural defaults 
    $: mockState = activeMask 
        ? { ...defaultAdjustments, ...activeMask.adjustments } 
        : defaultAdjustments;

    function startAdd(type: MaskType) {
        activeNewType = activeNewType === type ? null : type;
        dispatch('activeNewType', activeNewType);
    }

    function removeMask(id: string, e: Event) {
        e.stopPropagation();
        if (activeMaskId === id) activeMaskId = null;
        adjustments.masks = masks.filter(m => m.id !== id);
        dispatch('change', { masks: adjustments.masks });
    }

    function selectMask(id: string) {
        activeMaskId = activeMaskId === id ? null : id;
        if (activeNewType) {
            activeNewType = null;
            dispatch('activeNewType', null);
        }
        dispatch('select', activeMaskId);
    }

    function toggleActive(m: MaskLayer, e: Event) {
        e.stopPropagation();
        const i = masks.findIndex(x => x.id === m.id);
        if (i < 0) return;
        masks[i].active = !masks[i].active;
        dispatch('change', { masks });
    }

    function toggleInverted(m: MaskLayer, e: Event) {
        e.stopPropagation();
        const i = masks.findIndex(x => x.id === m.id);
        if (i < 0) return;
        masks[i].inverted = !masks[i].inverted;
        dispatch('change', { masks });
    }

    function onPanelChange(e: CustomEvent<Partial<AdjustmentState>>) {
        if (!activeMask) return;
        const i = masks.findIndex(m => m.id === activeMaskId);
        if (i < 0) return;
        
        masks[i].adjustments = { ...masks[i].adjustments, ...e.detail };
        dispatch('change', { masks });
    }
</script>

<div class="masking-panel-root">
    <div class="mask-header">
        <div class="panel-title">Masking</div>
        <div class="add-buttons">
            <button class="add-btn" class:active={activeNewType === 'linear_gradient'} on:click={() => startAdd('linear_gradient')} title="Linear Gradient">
                <span class="icon">█</span> Line
            </button>
            <button class="add-btn" class:active={activeNewType === 'radial_gradient'} on:click={() => startAdd('radial_gradient')} title="Radial Gradient">
                <span class="icon">●</span> Radial
            </button>
        </div>
        {#if activeNewType}
            <div class="help-text" transition:slide|local>
                Click and drag on the image to draw your new mask.
            </div>
        {/if}
    </div>

    <!-- List of active masks -->
    <div class="mask-list">
        {#each masks as m}
            <button 
                class="mask-item" 
                class:selected={activeMaskId === m.id}
                on:click={() => selectMask(m.id)}
            >
                <div class="mask-info">
                    <span class="mask-icon">{m.type === 'linear_gradient' ? '█' : '●'}</span>
                    <span class="mask-name" class:disabled={!m.active}>{m.name}</span>
                </div>
                
                <div class="mask-actions">
                    <button class="action-icon" class:active={m.inverted} on:click={(e) => toggleInverted(m, e)} title="Invert Mask">◪</button>
                    <button class="action-icon" class:active={m.active} on:click={(e) => toggleActive(m, e)} title="Toggle Visibility">👁</button>
                    <button class="action-icon destruct" on:click={(e) => removeMask(m.id, e)} title="Delete Mask">⨉</button>
                </div>
            </button>
        {/each}

        {#if masks.length === 0}
            <div class="empty-state">
                No masks created. Select a tool above to begin.
            </div>
        {/if}
    </div>

    {#if activeMask}
        <div class="local-adjustments" transition:slide|local>
            <div class="local-header">
                Local Adjustments for {activeMask.name}
            </div>
            <!-- Embedded standard panels acting on the mockState -->
            <BasicPanel adjustments={mockState} expanded={true} on:change={onPanelChange} />
            <DetailPanel adjustments={mockState} expanded={false} on:change={onPanelChange} />
        </div>
    {/if}
</div>

<style>
    .masking-panel-root {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .mask-header {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .panel-title {
        font-family: 'Instrument Sans', sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: var(--md-sys-color-on-surface);
    }

    .add-buttons {
        display: flex;
        gap: 8px;
    }

    .add-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.1);
        background: rgba(255,255,255,0.05);
        color: rgba(255,255,255,0.8);
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        cursor: pointer;
        transition: all 150ms ease;
    }

    .add-btn:hover {
        background: rgba(255,255,255,0.1);
    }

    .add-btn.active {
        background: var(--md-sys-color-primary, #60a5fa);
        color: var(--md-sys-color-on-primary, #003258);
        border-color: transparent;
    }

    .help-text {
        font-size: 11px;
        color: var(--md-sys-color-primary, #60a5fa);
        background: rgba(96, 165, 250, 0.1);
        padding: 6px 10px;
        border-radius: 6px;
        text-align: center;
    }

    .mask-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        background: rgba(0,0,0,0.2);
        padding: 6px;
        border-radius: 12px;
    }

    .empty-state {
        text-align: center;
        font-size: 11px;
        color: rgba(255,255,255,0.4);
        padding: 12px;
    }

    .mask-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 10px;
        border-radius: 8px;
        background: transparent;
        border: 1px solid transparent;
        color: rgba(255,255,255,0.8);
        cursor: pointer;
        transition: all 150ms ease;
    }

    .mask-item:hover {
        background: rgba(255,255,255,0.05);
    }

    .mask-item.selected {
        background: rgba(255,255,255,0.1);
        border-color: rgba(255,255,255,0.2);
    }

    .mask-info {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 500;
    }

    .mask-name.disabled {
        opacity: 0.4;
        text-decoration: line-through;
    }

    .mask-actions {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .action-icon {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        border: none;
        background: transparent;
        color: rgba(255,255,255,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .action-icon:hover {
        background: rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.9);
    }

    .action-icon.active {
        color: var(--md-sys-color-primary, #60a5fa);
    }

    .action-icon.destruct:hover {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
    }

    .local-adjustments {
        margin-top: 8px;
        border-top: 1px solid rgba(255,255,255,0.06);
        padding-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .local-header {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: rgba(255,255,255,0.5);
        margin-bottom: 4px;
        padding-left: 4px;
    }
</style>
