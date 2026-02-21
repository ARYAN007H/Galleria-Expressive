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
            class="toolbar-btn"
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
                class="toolbar-btn"
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
            class="toolbar-btn settings-btn"
            on:click|stopPropagation={() => showSettings.update((v) => !v)}
            title="Settings"
        >
            {@html icons.settings}
        </button>
    </div>
</header>

<style>
    .toolbar {
        height: var(--toolbar-height);
        display: flex;
        align-items: center;
        gap: var(--sp-4);
        padding: 0 var(--sp-4);
        border-bottom: 1px solid var(--glass-border);
        flex-shrink: 0;
        z-index: 100;
        background: var(--glass-thick);
        backdrop-filter: blur(30px) saturate(1.8);
        -webkit-backdrop-filter: blur(30px) saturate(1.8);
        user-select: none;
        -webkit-app-region: drag;
        /* Subtle inner light for liquid glass */
        box-shadow:
            inset 0 -1px 0 var(--glass-border),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
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
        color: var(--text-tertiary);
        font-weight: 500;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
    }

    .toolbar-center {
        flex: 1;
        display: flex;
        justify-content: center;
        max-width: 400px;
        margin: 0 auto;
        -webkit-app-region: no-drag;
    }

    .search-container {
        display: flex;
        align-items: center;
        width: 100%;
        gap: var(--sp-2);
        background: var(--bg-secondary);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-full);
        padding: 6px var(--sp-3);
        transition: var(--transition-base);
    }

    .search-container:focus-within,
    .search-container.focused {
        border-color: var(--accent);
        box-shadow:
            0 0 0 3px var(--accent-subtle),
            var(--shadow-glow);
        background: var(--bg-primary);
    }

    .search-icon {
        color: var(--text-quaternary);
        display: flex;
        flex-shrink: 0;
        transition: color var(--duration-fast) var(--ease-out);
    }

    .search-icon :global(svg) {
        width: 15px;
        height: 15px;
    }

    .search-container:focus-within .search-icon {
        color: var(--accent);
    }

    .search-input {
        flex: 1;
        font-size: var(--text-sm);
        color: var(--text-primary);
        background: none;
        border: none;
        outline: none;
        min-width: 0;
        letter-spacing: 0.01em;
    }

    .search-input::placeholder {
        color: var(--text-quaternary);
    }

    .search-clear {
        display: flex;
        align-items: center;
        padding: 2px;
        border-radius: var(--radius-full);
        color: var(--text-tertiary);
        transition: var(--transition-fast);
    }

    .search-clear:hover {
        color: var(--text-primary);
        background: var(--glass-border-strong);
    }

    .search-clear :global(svg) {
        width: 14px;
        height: 14px;
    }

    .toolbar-right {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        -webkit-app-region: no-drag;
    }

    .toolbar-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md);
        color: var(--text-tertiary);
        transition: var(--transition-fast);
    }

    .toolbar-btn :global(svg) {
        width: 18px;
        height: 18px;
    }

    .toolbar-btn:hover {
        color: var(--text-primary);
        background: var(--accent-subtle);
    }

    .view-toggles {
        display: flex;
        background: var(--bg-secondary);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-md);
        padding: 2px;
        gap: 2px;
    }

    .view-btn {
        width: 28px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-sm);
        color: var(--text-quaternary);
        transition: var(--transition-fast);
    }

    .view-btn :global(svg) {
        width: 15px;
        height: 15px;
    }

    .view-btn:hover {
        color: var(--text-secondary);
    }

    .view-btn.active {
        background: var(--bg-primary);
        color: var(--accent);
        box-shadow: var(--shadow-xs);
    }

    .sort-wrapper {
        position: relative;
    }

    .sort-menu {
        position: absolute;
        top: calc(100% + var(--sp-2));
        right: 0;
        min-width: 180px;
        padding: var(--sp-1);
        border-radius: var(--radius-lg);
        background: var(--glass-ultra);
        backdrop-filter: blur(40px) saturate(2);
        -webkit-backdrop-filter: blur(40px) saturate(2);
        border: 1px solid var(--glass-border-strong);
        box-shadow: var(--shadow-float);
        z-index: 200;
        animation: fadeInScale var(--duration-fast) var(--ease-spring);
        transform-origin: top right;
    }

    .sort-option {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 7px var(--sp-3);
        border-radius: var(--radius-sm);
        font-size: var(--text-sm);
        color: var(--text-primary);
        transition: var(--transition-fast);
    }

    .sort-option:hover {
        background: var(--accent-subtle);
    }

    .sort-option.active {
        color: var(--accent);
        font-weight: 500;
    }

    .sort-option .check {
        color: var(--accent);
        display: flex;
    }

    .zoom-control {
        display: flex;
        align-items: center;
        gap: var(--sp-1);
    }

    .zoom-icon {
        color: var(--text-quaternary);
        display: flex;
    }

    .zoom-icon.small :global(svg) {
        width: 13px;
        height: 13px;
    }

    .zoom-icon.large :global(svg) {
        width: 15px;
        height: 15px;
    }

    .zoom-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 72px;
        height: 3px;
        background: var(--bg-tertiary);
        border-radius: var(--radius-full);
        outline: none;
        cursor: pointer;
        transition: background var(--duration-fast) var(--ease-out);
    }

    .zoom-slider:hover {
        background: var(--text-quaternary);
    }

    .zoom-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--accent);
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
        transition: transform var(--duration-fast) var(--ease-spring);
    }

    .zoom-slider::-webkit-slider-thumb:hover {
        transform: scale(1.15);
    }

    .settings-btn {
        margin-left: var(--sp-1);
    }
</style>
