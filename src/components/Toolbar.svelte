<script lang="ts">
    import { icons } from "../lib/icons";
    import {
        searchQuery,
        viewMode,
        sortBy,
        appSettings,
        showSettings,
        filteredCount,
        photoCount,
    } from "../lib/store";

    let searchInput: HTMLInputElement;
    let query = "";
    let debounceTimer: ReturnType<typeof setTimeout>;
    let showSortMenu = false;

    function handleInput(e: Event) {
        const value = (e.target as HTMLInputElement).value;
        query = value;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchQuery.set(value);
        }, 180);
    }

    function clearSearch() {
        query = "";
        searchQuery.set("");
        if (searchInput) searchInput.focus();
    }

    function toggleSidebar() {
        appSettings.update((s) => ({ ...s, showSidebar: !s.showSidebar }));
    }

    function handleZoom(e: Event) {
        const value = parseInt((e.target as HTMLInputElement).value);
        appSettings.update((s) => ({ ...s, gridZoom: value }));
    }

    const sortOptions: { value: string; label: string }[] = [
        { value: "date-desc", label: "Newest First" },
        { value: "date-asc", label: "Oldest First" },
        { value: "name-asc", label: "Name A → Z" },
        { value: "name-desc", label: "Name Z → A" },
        { value: "size-desc", label: "Largest First" },
        { value: "size-asc", label: "Smallest First" },
    ];

    function selectSort(value: string) {
        sortBy.set(value as any);
        showSortMenu = false;
    }

    function handleClickOutside() {
        if (showSortMenu) showSortMenu = false;
    }
</script>

<svelte:window on:click={handleClickOutside} />

<header class="toolbar">
    <div class="toolbar-left">
        <button
            class="m3-icon-btn"
            on:click={toggleSidebar}
            title="Toggle Sidebar"
        >
            {@html icons.sidebar}
        </button>

        <span class="photo-count">
            {#if $filteredCount !== $photoCount}
                {$filteredCount.toLocaleString()} of {$photoCount.toLocaleString()}
            {:else}
                {$photoCount.toLocaleString()} photos
            {/if}
        </span>
    </div>

    <div class="toolbar-center">
        <div class="search-container" class:focused={query.length > 0}>
            <span class="search-icon">{@html icons.search}</span>
            <input
                bind:this={searchInput}
                class="search-input"
                type="text"
                placeholder="Search photos, people, places…"
                value={query}
                on:input={handleInput}
            />
            {#if query}
                <button class="search-clear" on:click={clearSearch}>
                    {@html icons.close}
                </button>
            {/if}
        </div>
    </div>

    <div class="toolbar-right">
        <div class="view-toggles">
            <button
                class="view-btn"
                class:active={$viewMode === "grid"}
                on:click={() => viewMode.set("grid")}
                title="Grid View"
            >
                {@html icons.grid}
            </button>
            <button
                class="view-btn"
                class:active={$viewMode === "list"}
                on:click={() => viewMode.set("list")}
                title="List View"
            >
                {@html icons.list}
            </button>
        </div>

        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="sort-wrapper" on:click|stopPropagation>
            <button
                class="m3-icon-btn"
                on:click={() => (showSortMenu = !showSortMenu)}
                title="Sort"
            >
                {@html icons.sort}
            </button>
            {#if showSortMenu}
                <div class="sort-menu">
                    {#each sortOptions as opt}
                        <button
                            class="sort-option"
                            class:active={$sortBy === opt.value}
                            on:click={() => selectSort(opt.value)}
                        >
                            <span>{opt.label}</span>
                            {#if $sortBy === opt.value}
                                <span class="check">{@html icons.check}</span>
                            {/if}
                        </button>
                    {/each}
                </div>
            {/if}
        </div>

        <div class="zoom-control">
            <span class="zoom-icon small">{@html icons.zoomOut}</span>
            <input
                type="range"
                min="1"
                max="5"
                value={$appSettings.gridZoom}
                on:input={handleZoom}
                class="zoom-slider"
            />
            <span class="zoom-icon large">{@html icons.zoomIn}</span>
        </div>

        <button
            class="m3-icon-btn settings-btn"
            on:click|stopPropagation={() => showSettings.update((v) => !v)}
            title="Settings"
        >
            {@html icons.settings}
        </button>
    </div>
</header>

<style>
    /* ── M3 Top App Bar ── */
    .toolbar {
        height: var(--toolbar-height);
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        padding: 0 var(--sp-4);
        border-bottom: 1px solid var(--md-sys-color-surface-container-highest);
        flex-shrink: 0;
        z-index: 100;
        background: var(--bg-app);
        user-select: none;
        -webkit-app-region: drag;
    }

    .toolbar-left {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        min-width: 180px;
        -webkit-app-region: no-drag;
    }

    .photo-count {
        font-size: var(--text-sm);
        color: var(--text-secondary);
        font-weight: 500;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.01em;
    }

    .toolbar-center {
        flex: 1;
        display: flex;
        justify-content: center;
        max-width: 480px;
        margin: 0 auto;
        -webkit-app-region: no-drag;
    }

    /* ── M3 Search Bar (Pill Shape) ── */
    .search-container {
        display: flex;
        align-items: center;
        width: 100%;
        gap: var(--sp-2);
        background: var(--md-sys-color-surface-container-highest);
        border: none;
        border-radius: var(--radius-full);
        padding: 8px var(--sp-4);
        transition: var(--transition-base);
        min-height: 44px;
    }

    .search-container:focus-within,
    .search-container.focused {
        background: var(--md-sys-color-surface-container-highest);
        box-shadow: 0 0 0 2px var(--accent);
    }

    .search-icon {
        color: var(--text-secondary);
        display: flex;
        flex-shrink: 0;
        transition: color var(--duration-fast) var(--ease-standard);
    }

    .search-icon :global(svg) {
        width: 18px;
        height: 18px;
    }

    .search-container:focus-within .search-icon {
        color: var(--accent);
    }

    .search-input {
        flex: 1;
        font-size: var(--text-base);
        color: var(--text-primary);
        background: none;
        border: none;
        outline: none;
        min-width: 0;
        letter-spacing: 0.01em;
    }

    .search-input::placeholder {
        color: var(--text-tertiary);
    }

    .search-clear {
        display: flex;
        align-items: center;
        padding: 4px;
        border-radius: var(--radius-full);
        color: var(--text-secondary);
        transition: var(--transition-fast);
    }

    .search-clear:hover {
        color: var(--text-primary);
        background: var(--accent-subtle);
    }

    .search-clear :global(svg) {
        width: 16px;
        height: 16px;
    }

    .toolbar-right {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        -webkit-app-region: no-drag;
    }

    /* ── M3 Icon Button ── */
    .m3-icon-btn {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        color: var(--text-secondary);
        transition: var(--transition-fast);
        position: relative;
        overflow: hidden;
    }

    .m3-icon-btn::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: currentColor;
        opacity: 0;
        transition: opacity var(--duration-fast) var(--ease-standard);
    }

    .m3-icon-btn:hover::before {
        opacity: 0.08;
    }

    .m3-icon-btn:active::before {
        opacity: 0.12;
    }

    .m3-icon-btn :global(svg) {
        width: 20px;
        height: 20px;
        position: relative;
        z-index: 1;
    }

    /* ── M3 Segmented Button (View Toggle) ── */
    .view-toggles {
        display: flex;
        background: var(--md-sys-color-surface-container-high);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: var(--radius-full);
        padding: 2px;
        gap: 0;
    }

    .view-btn {
        width: 36px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        color: var(--text-secondary);
        transition: var(--transition-base);
        position: relative;
    }

    .view-btn :global(svg) {
        width: 16px;
        height: 16px;
        position: relative;
        z-index: 1;
    }

    .view-btn:hover {
        color: var(--text-primary);
    }

    .view-btn.active {
        background: var(--md-sys-color-secondary-container);
        color: var(--md-sys-color-on-secondary-container);
    }

    /* ── Sort Menu ── */
    .sort-wrapper {
        position: relative;
    }

    .sort-menu {
        position: absolute;
        top: calc(100% + var(--sp-2));
        right: 0;
        min-width: 200px;
        padding: var(--sp-1);
        border-radius: var(--radius-lg);
        background: var(--md-sys-color-surface-container-high);
        border: 1px solid var(--md-sys-color-outline-variant);
        box-shadow: var(--shadow-lg);
        z-index: 200;
        animation: fadeInScale var(--duration-base) var(--ease-emphasized-decel);
        transform-origin: top right;
    }

    .sort-option {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px var(--sp-4);
        border-radius: var(--radius-full);
        font-size: var(--text-base);
        color: var(--text-primary);
        transition: var(--transition-fast);
    }

    .sort-option:hover {
        background: var(--accent-subtle);
    }

    .sort-option.active {
        color: var(--accent);
        font-weight: 600;
    }

    .sort-option .check {
        color: var(--accent);
        display: flex;
    }

    /* ── M3 Zoom Slider ── */
    .zoom-control {
        display: flex;
        align-items: center;
        gap: var(--sp-1);
    }

    .zoom-icon {
        color: var(--text-tertiary);
        display: flex;
    }

    .zoom-icon.small :global(svg) {
        width: 14px;
        height: 14px;
    }

    .zoom-icon.large :global(svg) {
        width: 16px;
        height: 16px;
    }

    .zoom-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 80px;
        height: 4px;
        background: var(--md-sys-color-surface-container-highest);
        border-radius: var(--radius-full);
        outline: none;
        cursor: pointer;
        transition: background var(--duration-fast) var(--ease-standard);
    }

    .zoom-slider:hover {
        background: var(--md-sys-color-outline-variant);
    }

    .zoom-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--accent);
        cursor: pointer;
        box-shadow: var(--shadow-sm);
        transition: transform var(--duration-fast) var(--ease-spring);
    }

    .zoom-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
    }

    .settings-btn {
        margin-left: var(--sp-1);
    }
</style>
