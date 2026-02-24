<script lang="ts">
    import { icons } from "../lib/icons";
    import {
        selectedPhotoIds,
        isMultiSelectMode,
        clearSelection,
        selectAllPhotos,
        deletePhotos,
        toggleFavorite,
        tags,
        loadTags,
        tagPhotos,
        albums,
        loadAlbums,
        addToAlbum,
        createAlbum,
    } from "../lib/store";

    let showTagMenu = false;
    let showAlbumMenu = false;
    let newAlbumName = "";

    $: count = $selectedPhotoIds.size;
    $: ids = Array.from($selectedPhotoIds);

    function handleDelete() {
        if (count === 0) return;
        deletePhotos(ids);
        clearSelection();
    }

    function handleFavorite() {
        ids.forEach((id) => toggleFavorite(id));
    }

    function handleTagMenu() {
        loadTags();
        showTagMenu = !showTagMenu;
        showAlbumMenu = false;
    }

    function handleAlbumMenu() {
        loadAlbums();
        showAlbumMenu = !showAlbumMenu;
        showTagMenu = false;
    }

    function applyTag(tagId: number) {
        tagPhotos(ids, tagId);
        showTagMenu = false;
    }

    function applyAlbum(albumId: number) {
        addToAlbum(albumId, ids);
        showAlbumMenu = false;
    }

    async function handleNewAlbum() {
        if (!newAlbumName.trim()) return;
        const album = await createAlbum(newAlbumName.trim());
        if (album) {
            addToAlbum(album.id, ids);
        }
        newAlbumName = "";
        showAlbumMenu = false;
    }
</script>

{#if $isMultiSelectMode && count > 0}
    <div class="batch-bar">
        <div class="batch-info">
            <span class="batch-count">{count}</span> selected
        </div>
        <div class="batch-actions">
            <button
                class="batch-btn"
                on:click={handleFavorite}
                title="Favorite"
            >
                {@html icons.heart || "♥"}
            </button>
            <button class="batch-btn" on:click={handleTagMenu} title="Tag">
                {@html icons.tag}
            </button>
            <button
                class="batch-btn"
                on:click={handleAlbumMenu}
                title="Add to Album"
            >
                {@html icons.folder}
            </button>
            <button
                class="batch-btn danger"
                on:click={handleDelete}
                title="Delete"
            >
                {@html icons.trash || "🗑"}
            </button>
            <div class="batch-divider"></div>
            <button
                class="batch-btn"
                on:click={selectAllPhotos}
                title="Select All">All</button
            >
            <button class="batch-btn" on:click={clearSelection} title="Clear"
                >✕</button
            >
        </div>

        {#if showTagMenu}
            <div class="dropdown tag-dropdown">
                <div class="dropdown-title">Apply Tag</div>
                {#each $tags as tag}
                    <button
                        class="dropdown-item"
                        on:click={() => applyTag(tag.id)}
                    >
                        <span class="tag-dot" style="background: {tag.color}"
                        ></span>
                        {tag.name}
                    </button>
                {/each}
                {#if $tags.length === 0}
                    <div class="dropdown-empty">No tags yet</div>
                {/if}
            </div>
        {/if}

        {#if showAlbumMenu}
            <div class="dropdown album-dropdown">
                <div class="dropdown-title">Add to Album</div>
                {#each $albums as album}
                    <button
                        class="dropdown-item"
                        on:click={() => applyAlbum(album.id)}
                    >
                        <span class="album-icon">{@html icons.folder}</span>
                        {album.name}
                        <span class="album-count">({album.photoCount})</span>
                    </button>
                {/each}
                <div class="dropdown-divider"></div>
                <form
                    class="new-album-form"
                    on:submit|preventDefault={handleNewAlbum}
                >
                    <input
                        type="text"
                        bind:value={newAlbumName}
                        placeholder="New album name…"
                        class="new-album-input"
                    />
                    <button type="submit" class="new-album-btn">+</button>
                </form>
            </div>
        {/if}
    </div>
{/if}

<style>
    /* ── M3 Bottom Action Bar ── */
    .batch-bar {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        padding: 10px 24px;
        background: var(--md-sys-color-surface-container-high);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: var(--radius-full);
        box-shadow: var(--shadow-float);
        z-index: 1000;
        animation: slideInUp var(--duration-base) var(--ease-spring);
    }

    .batch-info {
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
    }

    .batch-count {
        color: var(--accent);
        font-variant-numeric: tabular-nums;
    }

    .batch-actions {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    /* ── M3 Icon Button (Batch) ── */
    .batch-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px 12px;
        background: var(--md-sys-color-surface-container-highest);
        color: var(--text-primary);
        border-radius: var(--radius-full);
        font-size: var(--text-sm);
        font-weight: 500;
        transition: var(--transition-fast);
        gap: var(--sp-1);
    }

    .batch-btn :global(svg) {
        width: 16px;
        height: 16px;
    }

    .batch-btn:hover {
        background: var(--accent-subtle);
        color: var(--accent);
    }

    .batch-btn.danger:hover {
        background: var(--color-danger-subtle);
        color: var(--color-danger);
    }

    .batch-divider {
        width: 1px;
        height: 20px;
        background: var(--md-sys-color-outline-variant);
        margin: 0 4px;
    }

    /* ── M3 Dropdown Menu ── */
    .dropdown {
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        min-width: 220px;
        max-height: 260px;
        overflow-y: auto;
        background: var(--md-sys-color-surface-container-high);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-float);
        padding: var(--sp-1);
        animation: fadeInScale var(--duration-fast) var(--ease-spring);
        transform-origin: bottom center;
    }

    .dropdown-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: var(--letter-prominent);
        color: var(--text-tertiary);
        padding: var(--sp-2) var(--sp-3) var(--sp-2);
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        width: 100%;
        padding: 10px var(--sp-3);
        color: var(--text-primary);
        font-size: var(--text-base);
        border-radius: var(--radius-full);
        text-align: left;
        transition: var(--transition-fast);
    }

    .dropdown-item:hover {
        background: var(--accent-subtle);
    }

    .album-icon {
        display: flex;
        color: var(--accent);
    }

    .album-icon :global(svg) {
        width: 16px;
        height: 16px;
    }

    .tag-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .album-count {
        color: var(--text-tertiary);
        font-size: var(--text-xs);
        margin-left: auto;
    }

    .dropdown-divider {
        height: 1px;
        background: var(--md-sys-color-outline-variant);
        margin: var(--sp-1) 0;
    }

    .dropdown-empty {
        padding: var(--sp-4) var(--sp-3);
        color: var(--text-tertiary);
        font-size: var(--text-sm);
        text-align: center;
    }

    .new-album-form {
        display: flex;
        gap: var(--sp-1);
        padding: var(--sp-2) var(--sp-1);
    }

    .new-album-input {
        flex: 1;
        padding: 8px var(--sp-3);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: var(--radius-full);
        background: var(--md-sys-color-surface-container);
        color: var(--text-primary);
        font-size: var(--text-sm);
        outline: none;
        transition: border-color var(--duration-fast) var(--ease-standard);
    }

    .new-album-input:focus {
        border-color: var(--accent);
    }

    .new-album-btn {
        padding: 8px 14px;
        background: var(--accent-container);
        color: var(--accent-on-container);
        border-radius: var(--radius-full);
        font-size: var(--text-sm);
        font-weight: 600;
        transition: var(--transition-fast);
    }

    .new-album-btn:hover {
        box-shadow: var(--shadow-sm);
    }
</style>
