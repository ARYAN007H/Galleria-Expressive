<script lang="ts">
    import { icons } from "../lib/icons";
    import {
        activeSection,
        folders,
        visibleFolders,
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
        photos.set([]);
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
        photos.set([]);
        await loadTagPhotos(tag.name);
    }

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

<aside class="sidebar">
    <div class="sidebar-inner">
        <!-- Smart Collections -->
        <div class="sidebar-section">
            <h3 class="section-title">Library</h3>
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
                        {#if $activeSection === section.id && !$filters.selectedFolder}
                            <div class="active-indicator"></div>
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
                    class="section-action-btn"
                    on:click={() => showSettings.set(true)}
                    title="Manage Sources"
                >
                    {@html icons.settings}
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
                            <span class="nav-icon source-icon"
                                >{@html icons.folder}</span
                            >
                            <span class="nav-label truncate">{source.name}</span
                            >
                            {#if source.photoCount}
                                <span class="nav-count"
                                    >{source.photoCount}</span
                                >
                            {/if}
                        </button>
                    {/each}
                </nav>
            {:else}
                <div class="empty-hint">
                    <p>No folders added yet</p>
                    <button
                        class="add-btn-inline"
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
                        {#each $visibleFolders as folder}
                            <button
                                class="nav-item folder-item"
                                class:active={$filters.selectedFolder ===
                                    folder}
                                on:click={() => selectFolder(folder)}
                                title={folder}
                            >
                                <span class="nav-icon source-icon"
                                    >{@html icons.folder}</span
                                >
                                <span class="nav-label truncate"
                                    >{folder.split("/").pop() || folder}</span
                                >
                            </button>
                        {/each}
                        {#if $folders.length > $visibleFolders.length}
                            <button
                                class="nav-item manage-link"
                                on:click={() => showSettings.set(true)}
                            >
                                <span class="nav-label"
                                    >+{$folders.length - $visibleFolders.length}
                                    more — Manage…</span
                                >
                            </button>
                        {/if}
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
                            <span class="nav-icon source-icon"
                                >{@html icons.album}</span
                            >
                            <span class="nav-label truncate">{album.name}</span>
                            <span class="nav-count">{album.photoCount}</span>
                        </button>
                    {/each}
                    {#if $albums.length === 0}
                        <div class="empty-hint">No albums yet</div>
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
                            <span
                                class="tag-dot"
                                style="background: {tag.color}"
                            ></span>
                            <span class="nav-label truncate">{tag.name}</span>
                        </button>
                    {/each}
                    {#if $tags.length === 0}
                        <div class="empty-hint">No tags yet</div>
                    {/if}
                </nav>
            {/if}
        </div>
    </div>

    <!-- Bottom Action -->
    <div class="sidebar-footer">
        <button class="add-library-btn" on:click={selectLibrary}>
            <span class="add-icon">{@html icons.plus}</span>
            <span>Import Folder</span>
        </button>
    </div>
</aside>

<style>
    /* ── M3 Navigation Drawer ── */
    .sidebar {
        width: var(--sidebar-width);
        height: 100%;
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface-container-low);
        flex-shrink: 0;
        overflow: hidden;
        animation: slideInLeft var(--duration-base) var(--ease-emphasized-decel);
        user-select: none;
    }

    .sidebar-inner {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: var(--sp-3);
    }

    .sidebar-section {
        margin-bottom: var(--sp-6);
    }

    .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-right: var(--sp-1);
    }

    .section-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: var(--letter-prominent);
        color: var(--text-tertiary);
        padding: var(--sp-2) var(--sp-3);
        margin-bottom: 2px;
    }

    .section-action-btn {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        color: var(--text-tertiary);
        transition: var(--transition-fast);
        opacity: 0;
    }

    .section-action-btn :global(svg) {
        width: 14px;
        height: 14px;
    }

    .sidebar-section:hover .section-action-btn {
        opacity: 1;
    }

    .section-action-btn:hover {
        color: var(--text-primary);
        background: var(--accent-subtle);
    }

    .section-title-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--sp-2) var(--sp-3);
        margin-bottom: 2px;
        border-radius: var(--radius-full);
        transition: var(--transition-fast);
    }

    .section-title-btn:hover {
        background: var(--accent-subtle);
    }

    .chevron {
        display: flex;
        color: var(--text-tertiary);
        transition: transform var(--duration-base) var(--ease-emphasized);
    }

    .chevron :global(svg) {
        width: 14px;
        height: 14px;
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
        gap: 2px;
    }

    /* ── M3 Nav Item with Indicator Pill ── */
    .nav-item {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        padding: 10px var(--sp-4);
        border-radius: var(--radius-full);
        color: var(--text-primary);
        font-size: var(--text-base);
        font-weight: 500;
        transition: var(--transition-base);
        min-height: 40px;
        position: relative;
    }

    .nav-item:hover {
        background: var(--accent-subtle);
    }

    .nav-item.active {
        background: var(--md-sys-color-secondary-container);
        color: var(--md-sys-color-on-secondary-container);
        font-weight: 600;
    }

    .nav-item.active .nav-icon {
        color: var(--md-sys-color-on-secondary-container);
    }

    .nav-item.active .nav-count {
        color: var(--md-sys-color-on-secondary-container);
        opacity: 0.7;
    }

    .active-indicator {
        display: none; /* Handled via background color in M3 style */
    }

    .nav-icon {
        display: flex;
        flex-shrink: 0;
        color: var(--text-secondary);
        transition: color var(--duration-fast) var(--ease-standard);
    }

    .nav-icon :global(svg) {
        width: 20px;
        height: 20px;
    }

    .source-icon {
        color: var(--accent-text);
    }

    .nav-item.active .source-icon {
        color: var(--md-sys-color-on-secondary-container);
    }

    .tag-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
        margin-left: var(--sp-1);
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
        max-height: 220px;
        overflow-y: auto;
        padding-right: var(--sp-1);
    }

    .manage-link {
        font-size: var(--text-sm);
        color: var(--accent-text);
        font-weight: 500;
    }

    .manage-link:hover {
        background: var(--accent-subtle);
    }

    .empty-hint {
        padding: var(--sp-3) var(--sp-4);
        font-size: var(--text-sm);
        color: var(--text-tertiary);
        display: flex;
        flex-direction: column;
        gap: var(--sp-2);
    }

    /* ── M3 Filled Tonal Button (Inline Add) ── */
    .add-btn-inline {
        font-size: var(--text-sm);
        color: var(--accent-on-container);
        font-weight: 600;
        padding: 6px 16px;
        border-radius: var(--radius-full);
        background: var(--accent-container);
        transition: var(--transition-base);
        width: fit-content;
    }

    .add-btn-inline:hover {
        box-shadow: var(--shadow-sm);
    }

    /* ── Sidebar Footer ── */
    .sidebar-footer {
        padding: var(--sp-3) var(--sp-4);
        border-top: 1px solid var(--md-sys-color-outline-variant);
    }

    /* ── M3 Filled Tonal Button (Import) ── */
    .add-library-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--sp-2);
        padding: 10px var(--sp-4);
        border-radius: var(--radius-full);
        font-size: var(--text-base);
        font-weight: 600;
        color: var(--accent-on-container);
        background: var(--accent-container);
        border: none;
        transition: var(--transition-base);
    }

    .add-library-btn:hover {
        box-shadow: var(--shadow-sm);
    }

    .add-library-btn:active {
        transform: scale(0.98);
    }

    .add-icon {
        display: flex;
    }

    .add-icon :global(svg) {
        width: 18px;
        height: 18px;
    }
</style>
