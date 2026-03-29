<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import {
        historyEntries,
        currentHistoryIndex,
        type HistoryEntry,
    } from '../../editor/historyStore';
    import type { AdjustmentState } from '../adjustments';

    export let expanded: boolean = false;

    const dispatch = createEventDispatcher<{ restore: AdjustmentState }>();

    function toggle() { expanded = !expanded; }

    function restoreEntry(entry: HistoryEntry, index: number) {
        currentHistoryIndex.set(index);
        dispatch('restore', entry.adjustments);
    }

    function restoreToOriginal() {
        currentHistoryIndex.set(-1);
        dispatch('restore', {} as AdjustmentState);
    }

    function formatTime(ts: number): string {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function formatLabel(label: string): string {
        // Convert camelCase to readable
        return label.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
    }
</script>

<script context="module">
    import { slide } from 'svelte/transition';
</script>

<div class="panel-card">
    <button class="panel-header" on:click={toggle}>
        <span class="panel-icon">🕐</span>
        <span class="panel-title">History</span>
        <span class="entry-count">{$historyEntries.length}</span>
        <span class="expand-icon" class:rotated={expanded}>▾</span>
    </button>
    {#if expanded}
        <div class="panel-body" transition:slide|local={{ duration: 250 }}>
            {#if $historyEntries.length === 0}
                <div class="empty-state">No edits yet</div>
            {:else}
                <div class="history-list">
                    <!-- Default state at top -->
                    <button
                        class="history-item"
                        class:active={$currentHistoryIndex === -1}
                        on:click={() => restoreToOriginal()}
                    >
                        <span class="history-dot original"></span>
                        <span class="history-label">Original</span>
                    </button>
                    {#each $historyEntries as entry, i}
                        <button
                            class="history-item"
                            class:active={$currentHistoryIndex === i}
                            class:future={$currentHistoryIndex !== -1 && i > $currentHistoryIndex}
                            on:click={() => restoreEntry(entry, i)}
                        >
                            <span class="history-dot" class:active={$currentHistoryIndex === i}></span>
                            <span class="history-label">{formatLabel(entry.label)}</span>
                            <span class="history-time">{formatTime(entry.timestamp)}</span>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .panel-card {
        background: var(--md-sys-color-surface-container, #22222a);
        border-radius: 16px;
        overflow: hidden;
        margin-bottom: 8px;
    }
    .panel-header {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 12px 14px;
        background: none;
        border: none;
        color: var(--md-sys-color-on-surface, rgba(255,255,255,0.85));
        cursor: pointer;
        transition: background 150ms ease;
    }
    .panel-header:hover { background: rgba(255,255,255,0.04); }
    .panel-icon { font-size: 16px; width: 20px; text-align: center; }
    .panel-title {
        flex: 1;
        text-align: left;
        font-family: 'Instrument Sans', sans-serif;
        font-size: 14px;
        font-weight: 600;
    }
    .entry-count {
        font-family: 'DM Mono', monospace;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 8px;
        background: rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.5);
    }
    .expand-icon {
        font-size: 12px;
        color: rgba(255,255,255,0.4);
        transition: transform 250ms cubic-bezier(0.2, 0, 0, 1);
    }
    .expand-icon.rotated { transform: rotate(0deg); }
    .expand-icon:not(.rotated) { transform: rotate(-90deg); }
    .panel-body { padding: 0 8px 10px; }
    .empty-state {
        text-align: center;
        padding: 16px 0;
        font-family: 'Instrument Sans', sans-serif;
        font-size: 12px;
        color: rgba(255,255,255,0.3);
    }
    .history-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        max-height: 240px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.08) transparent;
    }
    .history-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 10px;
        background: none;
        border: none;
        color: var(--md-sys-color-on-surface, rgba(255,255,255,0.7));
        cursor: pointer;
        transition: all 150ms ease;
        text-align: left;
    }
    .history-item:hover { background: rgba(255,255,255,0.06); }
    .history-item.active {
        background: rgba(160, 196, 255, 0.12);
        color: var(--md-sys-color-primary, #a0c4ff);
    }
    .history-item.future { opacity: 0.35; }
    .history-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        flex-shrink: 0;
        transition: all 150ms ease;
    }
    .history-dot.active {
        background: var(--md-sys-color-primary, #a0c4ff);
        box-shadow: 0 0 6px rgba(160, 196, 255, 0.4);
    }
    .history-dot.original { background: rgba(255,255,255,0.4); }
    .history-label {
        flex: 1;
        font-family: 'Instrument Sans', sans-serif;
        font-size: 12px;
        font-weight: 450;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .history-time {
        font-family: 'DM Mono', monospace;
        font-size: 10px;
        color: rgba(255,255,255,0.3);
        flex-shrink: 0;
    }
</style>
