<script lang="ts">
    import { icons } from "../lib/icons";
    import {
        activeSection,
        folders,
        filters,
        selectLibrary,
        photoCount,
        photos,
        sourceDirectories,
        activeSource,
        favoritesCount,
        activeResourceId,
        tags,
        albums,
        loadAlbumPhotos,
        loadTagPhotos,
        indexLibrary,
        showSettings,
    } from "../lib/store";
    import type { SidebarSection, Album, Tag } from "../lib/store";

    let expandedFolders = true;
    let expandedAlbums = true;
    let expandedTags = true;

    const sections: { id: SidebarSection; icon: string; label: string }[] = [
        { id: "all", icon: icons.photos, label: "All Photos" },
        { id: "recents", icon: icons.clock, label: "Recents" },
        { id: "favorites", icon: icons.heart, label: "Favorites" },
        { id: "videos", icon: icons.video, label: "Videos" },
    ];

    async function selectSection(id: SidebarSection) {
        activeSection.set(id);
        activeResourceId.set(null);
        filters.update((f) => ({
            ...f,
            selectedFolder: null,
            selectedYear: null,
            selectedMonth: null,
        }));

        if (id === "all") {
            await indexLibrary();
        }
    }

    function selectFolder(folder: string) {
        activeSection.set("all");
        activeSource.set(null);
        filters.update((f) => ({
            ...f,
            selectedFolder: f.selectedFolder === folder ? null : folder,
        }));
        activeResourceId.set(null);
    }

    function selectSource(sourceName: string) {
        activeSection.set("source");
        activeSource.set(sourceName);
        filters.update((f) => ({
            ...f,
            selectedFolder: null,
            selectedYear: null,
            selectedMonth: null,
        }));
    }

    async function selectAlbum(album: Album) {
        activeSection.set("album");
        activeResourceId.set(album.id);
        activeSource.set(null);
        filters.update((f) => ({
            ...f,
            selectedFolder: null,
            selectedYear: null,
            selectedMonth: null,
        }));
        photos.set([]); // Clear current
        await loadAlbumPhotos(album.id);
    }

    async function selectTag(tag: Tag) {
        activeSection.set("tag");
        activeResourceId.set(tag.id);
        activeSource.set(null);
        filters.update((f) => ({
            ...f,
            selectedFolder: null,
            selectedYear: null,
            selectedMonth: null,
        }));
        photos.set([]); // Clear current
        await loadTagPhotos(tag.name);
    }

    // Compute video count
    $: videoCount = $photos.filter((p) => p.mediaType === "video").length;

    function getSectionCount(id: SidebarSection): string {
        switch (id) {
            case "all":
                return $photoCount.toLocaleString();
            case "favorites":
                return $favoritesCount > 0
                    ? $favoritesCount.toLocaleString()
                    : "";
            case "videos":
                return videoCount.toLocaleString();
            default:
                return "";
        }
    }
</script>

<aside class="sidebar glass-thick">
    <div class="sidebar-inner">
        <!-- Smart Collections -->
        <div class="sidebar-section">
            <h3 class="section-title">Smart Collections</h3>
            <nav class="nav-list">
                {#each sections as section}
                    <button
                        class="nav-item"
                        class:active={$activeSection === section.id &&
                            !$filters.selectedFolder}
                        on:click={() => selectSection(section.id)}
                    >
                        <span class="nav-icon">{@html section.icon}</span>
                        <span class="nav-label">{section.label}</span>
                        {#if getSectionCount(section.id)}
                            <span class="nav-count"
                                >{getSectionCount(section.id)}</span
                            >
                        {/if}
                    </button>
                {/each}
            </nav>
        </div>

        <!-- Sources -->
        <div class="sidebar-section">
            <div class="section-header">
                <h3 class="section-title">Sources</h3>
                <button
                    class="settings-icon-btn"
                    on:click={() => showSettings.set(true)}
                    title="Manage Settings"
                >
                    ⚙️
                </button>
            </div>
            {#if $sourceDirectories.length > 0}
                <nav class="nav-list">
                    {#each $sourceDirectories as source}
                        <button
                            class="nav-item"
                            class:active={$activeSection === "source" &&
                                $activeSource === source.name}
                            on:click={() => selectSource(source.name)}
                        >
                            <span class="nav-icon">📁</span>
                            <span class="nav-label">{source.name}</span>
                            <span class="nav-count"
                                >{source.photoCount || ""}</span
                            >
                        </button>
                    {/each}
                </nav>
            {:else}
                <div class="empty-state">
                    <p>No folders added.</p>
                    <button
                        class="add-btn-small"
                        on:click={() => showSettings.set(true)}
                        >+ Add Folder</button
                    >
                </div>
            {/if}
        </div>

        <!-- Folders -->
        {#if $folders.length > 0}
            <div class="sidebar-section">
                <button
                    class="section-title-btn"
                    on:click={() => (expandedFolders = !expandedFolders)}
                >
                    <h3 class="section-title">Folders</h3>
                    <span class="chevron" class:expanded={expandedFolders}>
                        {@html icons.chevronDown}
                    </span>
                </button>

                {#if expandedFolders}
                    <nav class="nav-list folder-list">
                        {#each $folders as folder}
                            <button
                                class="nav-item folder-item"
                                class:active={$filters.selectedFolder ===
                                    folder}
                                on:click={() => selectFolder(folder)}
                                title={folder}
                            >
                                <span class="nav-icon"
                                    >{@html icons.folder}</span
                                >
                                <span class="nav-label truncate"
                                    >{folder.split("/").pop() || folder}</span
                                >
                            </button>
                        {/each}
                    </nav>
                {/if}
            </div>
        {/if}

        <!-- Albums -->
        <div class="sidebar-section">
            <button
                class="section-title-btn"
                on:click={() => (expandedAlbums = !expandedAlbums)}
            >
                <h3 class="section-title">Albums</h3>
                <span class="chevron" class:expanded={expandedAlbums}>
                    {@html icons.chevronDown}
                </span>
            </button>

            {#if expandedAlbums}
                <nav class="nav-list">
                    {#each $albums as album}
                        <button
                            class="nav-item"
                            class:active={$activeSection === "album" &&
                                $activeResourceId === album.id}
                            on:click={() => selectAlbum(album)}
                        >
                            <span class="nav-icon">📁</span>
                            <span class="nav-label truncate">{album.name}</span>
                            <span class="nav-count">{album.photoCount}</span>
                        </button>
                    {/each}
                    {#if $albums.length === 0}
                        <div class="empty-hint">No albums</div>
                    {/if}
                </nav>
            {/if}
        </div>

        <!-- Tags -->
        <div class="sidebar-section">
            <button
                class="section-title-btn"
                on:click={() => (expandedTags = !expandedTags)}
            >
                <h3 class="section-title">Tags</h3>
                <span class="chevron" class:expanded={expandedTags}>
                    {@html icons.chevronDown}
                </span>
            </button>

            {#if expandedTags}
                <nav class="nav-list">
                    {#each $tags as tag}
                        <button
                            class="nav-item"
                            class:active={$activeSection === "tag" &&
                                $activeResourceId === tag.id}
                            on:click={() => selectTag(tag)}
                        >
                            <span class="nav-icon" style="color: {tag.color}"
                                >●</span
                            >
                            <span class="nav-label truncate">{tag.name}</span>
                        </button>
                    {/each}
                    {#if $tags.length === 0}
                        <div class="empty-hint">No tags</div>
                    {/if}
                </nav>
            {/if}
        </div>
    </div>

    <!-- Bottom Action -->
    <div class="sidebar-footer">
        <button class="add-library-btn" on:click={selectLibrary}>
            <span class="add-icon">{@html icons.plus}</span>
            <span>Add Library</span>
        </button>
    </div>
</aside>

<style>
    .sidebar {
        width: var(--sidebar-width);
        height: 100%;
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--glass-border);
        border-radius: 0;
        flex-shrink: 0;
        overflow: hidden;
        animation: slideInLeft var(--duration-base) var(--ease-out);
        user-select: none;
    }

    .sidebar-inner {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: var(--sp-3) var(--sp-3);
    }

    .sidebar-section {
        margin-bottom: var(--sp-6);
    }

    .section-title {
        font-size: var(--text-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-tertiary);
        padding: var(--sp-1) var(--sp-2);
        margin-bottom: var(--sp-1);
    }

    .section-title-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--sp-1) var(--sp-2);
        margin-bottom: var(--sp-1);
        border-radius: var(--radius-sm);
        transition: var(--transition-fast);
    }

    .section-title-btn:hover {
        background: var(--accent-subtle);
    }

    .chevron {
        display: flex;
        color: var(--text-tertiary);
        transition: transform var(--duration-fast) var(--ease-out);
    }

    .chevron.expanded {
        transform: rotate(0deg);
    }

    .chevron:not(.expanded) {
        transform: rotate(-90deg);
    }

    .nav-list {
        display: flex;
        flex-direction: column;
        gap: 1px;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        padding: var(--sp-2) var(--sp-3);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-size: var(--text-sm);
        font-weight: 450;
        transition: var(--transition-fast);
        min-height: 34px;
    }

    .nav-item:hover {
        background: var(--accent-subtle);
    }

    .nav-item.active {
        background: var(--accent);
        color: var(--text-on-accent);
    }

    .nav-item.active .nav-icon {
        color: var(--text-on-accent);
    }

    .nav-item.active .nav-count {
        color: rgba(255, 255, 255, 0.7);
    }

    .nav-icon {
        display: flex;
        flex-shrink: 0;
        color: var(--text-secondary);
        transition: color var(--duration-fast) var(--ease-out);
    }

    .nav-label {
        flex: 1;
        text-align: left;
    }

    .nav-count {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        font-weight: 500;
        font-variant-numeric: tabular-nums;
    }

    .folder-list {
        max-height: 200px;
        overflow-y: auto;
        padding-right: var(--sp-1);
    }

    .folder-item .nav-icon {
        color: var(--accent);
    }

    .folder-item.active .nav-icon {
        color: var(--text-on-accent);
    }

    .source-item .nav-count {
        background: var(--bg-tertiary);
        padding: 0 6px;
        border-radius: 99px;
        font-size: 11px;
        height: 18px;
        display: flex;
        align-items: center;
    }

    .empty-hint {
        padding: 4px 12px;
        font-size: 12px;
        color: var(--text-quaternary);
        font-style: italic;
    }

    .sidebar-footer {
        padding: var(--sp-3);
        border-top: 1px solid var(--glass-border);
    }

    .add-library-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--sp-2);
        padding: var(--sp-2) var(--sp-3);
        border-radius: var(--radius-md);
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--accent);
        border: 1px dashed var(--accent);
        background: var(--accent-subtle);
        transition: var(--transition-fast);
    }

    .add-library-btn:hover {
        background: var(--accent);
        color: var(--text-on-accent);
        border-style: solid;
    }

    .add-icon {
        display: flex;
    }
</style>
