<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import {
        snapshots,
        takeSnapshot,
        restoreSnapshot,
        deleteSnapshot,
    } from '../../editor/historyStore';
    import type { AdjustmentState } from '../adjustments';

    export let adjustments: AdjustmentState;
    export let expanded: boolean = false;

    const dispatch = createEventDispatcher<{ restore: AdjustmentState }>();

    let newSnapshotName = '';
    let showInput = false;

    function toggle() { expanded = !expanded; }

    function handleTake() {
        if (showInput && newSnapshotName.trim()) {
            takeSnapshot(newSnapshotName.trim(), adjustments);
            newSnapshotName = '';
            showInput = false;
        } else {
            showInput = true;
            setTimeout(() => {
                const input = document.querySelector('.snapshot-input') as HTMLInputElement;
                if (input) input.focus();
            }, 50);
        }
    }

    function handleRestore(id: number) {
        const adj = restoreSnapshot(id);
        if (adj) dispatch('restore', adj);
    }

    function handleDelete(e: MouseEvent, id: number) {
        e.stopPropagation();
        deleteSnapshot(id);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') handleTake();
        if (e.key === 'Escape') { showInput = false; newSnapshotName = ''; }
    }

    function formatTime(ts: number): string {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
</script>

<script context="module">
    import { slide } from 'svelte/transition';
</script>

<div class="panel-card">
    <button class="panel-header" on:click={toggle}>
        <span class="panel-icon">📷</span>
        <span class="panel-title">Snapshots</span>
        <span class="entry-count">{$snapshots.length}</span>
        <span class="expand-icon" class:rotated={expanded}>▾</span>
    </button>
    {#if expanded}
        <div class="panel-body" transition:slide|local={{ duration: 250 }}>
            <!-- Take snapshot -->
            <div class="take-row">
                {#if showInput}
                    <input
                        class="snapshot-input"
                        type="text"
                        placeholder="Snapshot name..."
                        bind:value={newSnapshotName}
                        on:keydown={handleKeydown}
                        on:blur={() => { if (!newSnapshotName.trim()) showInput = false; }}
                    />
                {/if}
                <button class="take-btn" on:click={handleTake}>
                    <span>+</span>
                    <span>{showInput ? 'Save' : 'New Snapshot'}</span>
                </button>
            </div>

            {#if $snapshots.length === 0}
                <div class="empty-state">Save editing checkpoints</div>
            {:else}
                <div class="snapshot-list">
                    {#each $snapshots as snap}
                        <button class="snapshot-item" on:click={() => handleRestore(snap.id)}>
                            <span class="snap-icon">📌</span>
                            <div class="snap-info">
                                <span class="snap-name">{snap.name}</span>
                                <span class="snap-time">{formatTime(snap.timestamp)}</span>
                            </div>
                            <button class="snap-delete" on:click={(e) => handleDelete(e, snap.id)} title="Delete">✕</button>
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
    .take-row {
        display: flex;
        gap: 6px;
        margin-bottom: 8px;
    }
    .snapshot-input {
        flex: 1;
        padding: 6px 10px;
        background: var(--md-sys-color-surface-container-high, rgba(255,255,255,0.08));
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 10px;
        color: var(--md-sys-color-on-surface, rgba(255,255,255,0.9));
        font-family: 'Instrument Sans', sans-serif;
        font-size: 12px;
        outline: none;
    }
    .snapshot-input:focus { border-color: var(--md-sys-color-primary, #a0c4ff); }
    .take-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border-radius: 10px;
        background: var(--md-sys-color-primary, #a0c4ff);
        border: none;
        color: var(--md-sys-color-on-primary, #003258);
        font-family: 'Instrument Sans', sans-serif;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 150ms ease;
        white-space: nowrap;
    }
    .take-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
    .take-btn span:first-child { font-size: 14px; font-weight: 700; }
    .empty-state {
        text-align: center;
        padding: 12px 0;
        font-family: 'Instrument Sans', sans-serif;
        font-size: 12px;
        color: rgba(255,255,255,0.3);
    }
    .snapshot-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-height: 200px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.08) transparent;
    }
    .snapshot-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 10px;
        background: rgba(255,255,255,0.04);
        border: none;
        color: var(--md-sys-color-on-surface, rgba(255,255,255,0.8));
        cursor: pointer;
        transition: all 150ms ease;
        text-align: left;
    }
    .snapshot-item:hover { background: rgba(160,196,255,0.1); }
    .snap-icon { font-size: 14px; flex-shrink: 0; }
    .snap-info { flex: 1; display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
    .snap-name {
        font-family: 'Instrument Sans', sans-serif;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .snap-time {
        font-family: 'DM Mono', monospace;
        font-size: 10px;
        color: rgba(255,255,255,0.35);
    }
    .snap-delete {
        width: 20px;
        height: 20px;
        border-radius: 6px;
        background: none;
        border: none;
        color: rgba(255,255,255,0.3);
        font-size: 10px;
        cursor: pointer;
        opacity: 0;
        transition: all 150ms ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .snapshot-item:hover .snap-delete { opacity: 1; }
    .snap-delete:hover { background: rgba(220,38,38,0.2); color: #f87171; }
</style>
