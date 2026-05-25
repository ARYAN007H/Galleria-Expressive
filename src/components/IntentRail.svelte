<script lang="ts">
    import {
        focusedPhotoId,
        photos,
        selectedPhotoIds,
        isMultiSelectMode,
        selectedPhoto,
        activeSection,
        libraryPath,
        toggleFavorite,
        deletePhotos,
        restorePhotos,
        hardDeletePhotos,
        clearSelection,
        selectLibrary,
        showEditor,
    } from "../lib/store";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher<{ open: number }>();

    $: focused = $focusedPhotoId
        ? $photos.find((p) => p.id === $focusedPhotoId)
        : null;
    $: multiCount = $selectedPhotoIds.size;
    $: inTrash = $activeSection === "trash";
    $: visible =
        !!focused ||
        multiCount > 0 ||
        (!$libraryPath && $photos.length === 0);

    async function onFavorite() {
        if (!focused) return;
        await toggleFavorite(focused.id);
    }

    async function onDelete() {
        if (multiCount > 0) {
            const ids = Array.from($selectedPhotoIds);
            if (inTrash) {
                if (confirm(`Permanently delete ${ids.length} item(s)?`)) {
                    await hardDeletePhotos(ids, false);
                }
            } else {
                if (confirm(`Move ${ids.length} item(s) to trash?`)) {
                    await deletePhotos(ids);
                }
            }
            return;
        }
        if (!focused) return;
        if (inTrash) {
            if (confirm("Permanently delete this photo?")) {
                await hardDeletePhotos([focused.id], false);
            }
        } else {
            if (confirm("Move to trash?")) {
                await deletePhotos([focused.id]);
            }
        }
    }

    async function onRestore() {
        const ids =
            multiCount > 0
                ? Array.from($selectedPhotoIds)
                : focused
                  ? [focused.id]
                  : [];
        if (ids.length) await restorePhotos(ids);
    }

    function onOpen() {
        if (!focused) return;
        const p = $photos.find((x) => x.id === focused.id);
        if (p) {
            selectedPhoto.set(p);
            dispatch("open", focused.id);
        }
    }

    function onEdit() {
        if (!focused) return;
        const p = $photos.find((x) => x.id === focused.id);
        if (p) {
            selectedPhoto.set(p);
            showEditor.set(true);
        }
    }
</script>

{#if visible}
    <div class="intent-rail" role="toolbar" aria-label="Quick actions">
        {#if !$libraryPath}
            <button class="rail-btn primary" on:click={selectLibrary}>Import photos</button>
        {:else if multiCount > 0}
            <span class="rail-label">{multiCount} selected</span>
            {#if inTrash}
                <button class="rail-btn" on:click={onRestore}>Restore</button>
                <button class="rail-btn danger" on:click={onDelete}>Delete forever</button>
            {:else}
                <button class="rail-btn danger" on:click={onDelete}>Trash</button>
            {/if}
            <button class="rail-btn ghost" on:click={clearSelection}>Clear</button>
        {:else if focused}
            <button class="rail-btn primary" on:click={onOpen}>Open</button>
            <button class="rail-btn" on:click={onEdit}>Edit</button>
            <button class="rail-btn" on:click={onFavorite}>
                {focused.isFavorite ? "Unfavorite" : "Favorite"}
            </button>
            {#if inTrash}
                <button class="rail-btn" on:click={onRestore}>Restore</button>
                <button class="rail-btn danger" on:click={onDelete}>Delete</button>
            {:else}
                <button class="rail-btn danger" on:click={onDelete}>Trash</button>
            {/if}
        {/if}
    </div>
{/if}

<style>
    .intent-rail {
        position: fixed;
        bottom: calc(var(--sp-6) + env(safe-area-inset-bottom, 0px));
        left: 50%;
        transform: translateX(-50%);
        z-index: 45;
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        padding: var(--sp-2) var(--sp-4);
        background: var(--md-sys-color-surface-container-high);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: var(--radius-full);
        box-shadow: var(--shadow-lg);
        max-width: min(96vw, 480px);
    }

    :global(body[data-expressive-tier="balanced"]) .intent-rail,
    :global(body[data-expressive-tier="essential"]) .intent-rail {
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
    }

    :global(.has-pill) .intent-rail {
        bottom: calc(72px + env(safe-area-inset-bottom, 0px));
    }

    .rail-label {
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--text-secondary);
        padding: 0 var(--sp-2);
    }

    .rail-btn {
        padding: var(--sp-2) var(--sp-4);
        border-radius: var(--radius-full);
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--text-primary);
        background: var(--md-sys-color-surface-container);
        transition: transform 0.12s var(--ease-standard), background 0.12s;
    }

    .rail-btn:hover {
        background: var(--accent-subtle);
    }

    .rail-btn.primary {
        background: var(--accent);
        color: var(--text-on-accent);
    }

    .rail-btn.danger {
        color: var(--md-sys-color-error, #b3261e);
    }

    .rail-btn.ghost {
        background: transparent;
        color: var(--text-secondary);
    }
</style>
