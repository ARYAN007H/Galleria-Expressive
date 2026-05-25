<script lang="ts">
    import { onMount } from "svelte";
    import {
        photos,
        invokeCommand,
        deletePhotos,
        convertFileSource,
    } from "../lib/store";

    export let onClose: () => void = () => {};

    let groups: number[][] = [];
    let indexing = false;
    let message = "";

    onMount(() => loadGroups());

    async function loadGroups() {
        try {
            groups = await invokeCommand<number[][]>("get_duplicate_groups", {
                threshold: 8,
            });
        } catch (e) {
            console.warn(e);
        }
    }

    async function runIndex() {
        indexing = true;
        message = "Computing perceptual hashes…";
        try {
            const n = await invokeCommand<number>("run_phash_indexing");
            message = `Indexed ${n} photos. Finding stacks…`;
            await loadGroups();
        } catch (e) {
            message = String(e);
        } finally {
            indexing = false;
        }
    }

    async function keepBest(group: number[]) {
        if (group.length < 2) return;
        const toRemove = group.slice(1);
        if (confirm(`Move ${toRemove.length} similar photos to trash?`)) {
            await deletePhotos(toRemove);
            groups = groups.filter((g) => g !== group);
        }
    }

    function photoById(id: number) {
        return $photos.find((p) => p.id === id);
    }
</script>

<div class="curator-overlay" role="dialog" aria-label="Curator's Desk">
    <header class="curator-header">
        <h2>Curator's Desk</h2>
        <div class="header-actions">
            <button class="btn" on:click={runIndex} disabled={indexing}>
                {indexing ? "Working…" : "Scan for duplicates"}
            </button>
            <button class="close-btn" on:click={onClose} aria-label="Close">×</button>
        </div>
    </header>
    {#if message}
        <p class="status">{message}</p>
    {/if}
    <div class="stacks">
        {#if groups.length === 0}
            <p class="empty">No duplicate stacks yet. Run a scan when idle.</p>
        {:else}
            {#each groups as group, i}
                <div class="stack-card">
                    <div class="stack-header">
                        <span>Stack {i + 1} · {group.length} similar</span>
                        <button class="btn small" on:click={() => keepBest(group)}
                            >Keep first, trash rest</button
                        >
                    </div>
                    <div class="stack-fan">
                        {#each group.slice(0, 8) as id}
                            {@const p = photoById(id)}
                            {#if p}
                                <img
                                    src={convertFileSource(
                                        p.path,
                                    )}
                                    alt={p.filename}
                                    loading="lazy"
                                />
                            {/if}
                        {/each}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>

<style>
    .curator-overlay {
        position: absolute;
        inset: 0;
        z-index: 30;
        background: var(--md-sys-color-surface);
        display: flex;
        flex-direction: column;
        padding: var(--sp-4);
        overflow: hidden;
    }

    .curator-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
    }

    .header-actions {
        display: flex;
        gap: var(--sp-2);
        align-items: center;
    }

    .btn {
        padding: var(--sp-2) var(--sp-4);
        border-radius: var(--radius-full);
        background: var(--accent);
        color: var(--text-on-accent);
        font-weight: 600;
        font-size: var(--text-sm);
    }

    .btn.small {
        background: var(--md-sys-color-surface-container-high);
        color: var(--text-primary);
    }

    .btn:disabled {
        opacity: 0.6;
    }

    .close-btn {
        width: 40px;
        height: 40px;
        font-size: 24px;
        border-radius: var(--radius-full);
    }

    .status {
        font-size: var(--text-sm);
        color: var(--text-secondary);
        margin: var(--sp-2) 0;
    }

    .stacks {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: var(--sp-4);
    }

    .stack-card {
        padding: var(--sp-4);
        border-radius: var(--radius-lg);
        background: var(--md-sys-color-surface-container-low);
        border: 1px solid var(--md-sys-color-outline-variant);
    }

    .stack-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--sp-3);
        font-weight: 600;
    }

    .stack-fan {
        display: flex;
        gap: var(--sp-2);
        overflow-x: auto;
    }

    .stack-fan img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: var(--radius-md);
        flex-shrink: 0;
    }

    .empty {
        color: var(--text-secondary);
        text-align: center;
        padding: var(--sp-8);
    }
</style>
