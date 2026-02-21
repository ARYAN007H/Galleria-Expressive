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
    .batch-bar {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        padding: 10px 20px;
        background: var(--glass-thick);
        backdrop-filter: blur(30px) saturate(1.8);
        -webkit-backdrop-filter: blur(30px) saturate(1.8);
        border: 1px solid var(--glass-border-strong);
        border-radius: var(--radius-xl);
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

    .batch-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px 10px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        border-radius: var(--radius-md);
        font-size: var(--text-xs);
        font-weight: 500;
        transition: var(--transition-fast);
        gap: 4px;
    }

    .batch-btn :global(svg) {
        width: 14px;
        height: 14px;
    }

    .batch-btn:hover {
        background: var(--bg-tertiary);
    }

    .batch-btn.danger:hover {
        background: var(--color-danger-subtle);
        color: var(--color-danger);
    }

    .batch-divider {
        width: 1px;
        height: 20px;
        background: var(--glass-border-strong);
        margin: 0 4px;
    }

    .dropdown {
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        min-width: 200px;
        max-height: 240px;
        overflow-y: auto;
        background: var(--glass-ultra);
        backdrop-filter: blur(40px) saturate(2);
        -webkit-backdrop-filter: blur(40px) saturate(2);
        border: 1px solid var(--glass-border-strong);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-float);
        padding: var(--sp-2);
        animation: fadeInScale var(--duration-fast) var(--ease-spring);
        transform-origin: bottom center;
    }

    .dropdown-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-quaternary);
        padding: 4px 8px 8px;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 7px 8px;
        color: var(--text-primary);
        font-size: var(--text-sm);
        border-radius: var(--radius-sm);
        text-align: left;
        transition: var(--transition-fast);
    }

    .dropdown-item:hover {
        background: var(--accent-subtle);
    }

    .album-icon {
        display: flex;
        color: var(--accent-text);
    }

    .album-icon :global(svg) {
        width: 14px;
        height: 14px;
    }

    .tag-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .album-count {
        color: var(--text-quaternary);
        font-size: 11px;
        margin-left: auto;
    }

    .dropdown-divider {
        height: 1px;
        background: var(--glass-border);
        margin: 4px 0;
    }

    .dropdown-empty {
        padding: 12px 8px;
        color: var(--text-quaternary);
        font-size: var(--text-xs);
        text-align: center;
    }

    .new-album-form {
        display: flex;
        gap: 4px;
        padding-top: 4px;
    }

    .new-album-input {
        flex: 1;
        padding: 6px 8px;
        border: 1px solid var(--glass-border-strong);
        border-radius: var(--radius-sm);
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-size: var(--text-xs);
        outline: none;
        transition: border-color var(--duration-fast) var(--ease-out);
    }

    .new-album-input:focus {
        border-color: var(--accent);
    }

    .new-album-btn {
        padding: 6px 10px;
        background: var(--accent);
        color: white;
        border-radius: var(--radius-sm);
        font-size: var(--text-sm);
        font-weight: 600;
        transition: var(--transition-fast);
    }

    .new-album-btn:hover {
        background: var(--accent-hover);
    }
</style>
