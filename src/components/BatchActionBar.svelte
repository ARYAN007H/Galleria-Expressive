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
                <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="currentColor"
                    ><path
                        d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"
                    /></svg
                >
            </button>
            <button
                class="batch-btn"
                on:click={handleAlbumMenu}
                title="Add to Album"
            >
                <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="currentColor"
                    ><path
                        d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"
                    /></svg
                >
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
                        📁 {album.name}
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
                        placeholder="New album name..."
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
        gap: 12px;
        padding: 10px 20px;
        background: var(--bg-glass);
        backdrop-filter: blur(24px) saturate(1.6);
        -webkit-backdrop-filter: blur(24px) saturate(1.6);
        border-radius: 20px;
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.18),
            0 0 0 1px var(--border-subtle);
        z-index: 1000;
        animation: slideUp 0.25s var(--ease-out);
    }

    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(60px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }

    .batch-info {
        font-size: 13px;
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
        border: none;
        background: var(--bg-secondary);
        color: var(--text-primary);
        border-radius: 10px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        gap: 4px;
    }

    .batch-btn:hover {
        background: var(--bg-tertiary);
    }

    .batch-btn.danger:hover {
        background: rgba(255, 59, 48, 0.15);
        color: #ff3b30;
    }

    .batch-divider {
        width: 1px;
        height: 20px;
        background: var(--border-subtle);
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
        background: var(--bg-glass);
        backdrop-filter: blur(20px);
        border-radius: 12px;
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.25),
            0 0 0 1px var(--border-subtle);
        padding: 8px;
        animation: fadeIn 0.15s ease;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(8px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }

    .dropdown-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-tertiary);
        padding: 4px 8px 8px;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px;
        border: none;
        background: none;
        color: var(--text-primary);
        font-size: 13px;
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
    }

    .dropdown-item:hover {
        background: var(--bg-secondary);
    }

    .tag-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .album-count {
        color: var(--text-tertiary);
        font-size: 11px;
        margin-left: auto;
    }

    .dropdown-divider {
        height: 1px;
        background: var(--border-subtle);
        margin: 4px 0;
    }

    .dropdown-empty {
        padding: 12px 8px;
        color: var(--text-tertiary);
        font-size: 12px;
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
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 12px;
        outline: none;
    }

    .new-album-input:focus {
        border-color: var(--accent);
    }

    .new-album-btn {
        padding: 6px 10px;
        border: none;
        background: var(--accent);
        color: white;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
    }
</style>
