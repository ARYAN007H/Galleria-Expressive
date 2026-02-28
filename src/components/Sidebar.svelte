<script lang="ts">
    import {
        activeSection,
        selectedPhoto,
        filters,
        loadAllPhotos,
        showSettings,
        appSettings,
        toggleTheme,
    } from "../lib/store";
    import * as Icons from "lucide-svelte";

    // Mapped navigation items to Lucide icons
    const navItems = [
        { path: "all", icon: Icons.Image, label: "Photos" },
        { path: "albums", icon: Icons.FolderOpen, label: "Albums" },
        { path: "favorites", icon: Icons.Heart, label: "Favorites" },
        { path: "trash", icon: Icons.Trash2, label: "Trash" },
    ];

    $: isDarkMode = $appSettings.theme === "dark";

    async function selectSection(id: string) {
        if (id === "all") {
            activeSection.set("all");
            filters.update((f) => ({ ...f, selectedFolder: null }));
            await loadAllPhotos();
        } else if (id === "albums") {
            activeSection.set("albums" as any);
        } else if (id === "favorites") {
            activeSection.set("favorites");
            filters.update((f) => ({ ...f, selectedFolder: null }));
        } else if (id === "videos") {
            activeSection.set("videos");
        } else if (id === "trash") {
            activeSection.set("trash");
            filters.update((f) => ({ ...f, selectedFolder: null }));
        } else {
            activeSection.set(id as any);
        }
        selectedPhoto.set(null);
    }
</script>

<aside class="sidebar">
    <div class="sidebar-inner">
        <!-- Add Photos Button -->
        <button
            on:click={() => {
                /* TODO: Hook up upload flow */
            }}
            class="add-photos-btn"
        >
            <Icons.Plus class="w-5 h-5" />
            <span>Add Photos</span>
        </button>

        <!-- Navigation -->
        <nav class="sidebar-nav">
            {#each navItems as item}
                {@const active =
                    $activeSection === item.path && !$filters.selectedFolder}
                <button
                    on:click={() => selectSection(item.path)}
                    class="nav-item"
                    class:active
                >
                    <div class="nav-icon-wrap">
                        <div class="nav-active-bg" class:show={active}></div>
                        <svelte:component
                            this={item.icon}
                            class="w-5 h-5 nav-icon-svg"
                        />
                    </div>
                    <span class="nav-label">{item.label}</span>
                </button>
            {/each}
        </nav>

        <div class="sidebar-spacer"></div>

        <!-- Bottom actions -->
        <div class="sidebar-footer">
            <button on:click={() => showSettings.set(true)} class="nav-item">
                <div class="nav-icon-wrap">
                    <Icons.Settings class="w-5 h-5 nav-icon-svg" />
                </div>
                <span class="nav-label">Settings</span>
            </button>

            <!-- Dark Mode Toggle -->
            <button on:click={toggleTheme} class="theme-toggle-btn">
                {#if isDarkMode}
                    <Icons.Sun class="w-5 h-5" />
                {:else}
                    <Icons.Moon class="w-5 h-5" />
                {/if}
            </button>
        </div>
    </div>
</aside>

<!-- Mobile Bottom Navigation -->
<nav class="mobile-nav">
    <div class="mobile-nav-inner">
        {#each navItems as item}
            {@const active =
                $activeSection === item.path && !$filters.selectedFolder}
            <button
                on:click={() => selectSection(item.path)}
                class="mobile-nav-item"
                class:active
            >
                <svelte:component this={item.icon} class="w-6 h-6" />
                <span class="mobile-nav-label">{item.label}</span>
            </button>
        {/each}
    </div>
</nav>

<style>
    /* ── M3 Sidebar ── */
    .sidebar {
        display: none;
        width: var(--sidebar-width);
        flex-shrink: 0;
        height: 100%;
        background: var(--md-sys-color-surface-container-low);
        border-right: 1px solid var(--md-sys-color-outline-variant);
        transition: background var(--duration-base) var(--ease-standard);
    }

    @media (min-width: 768px) {
        .sidebar {
            display: flex;
        }
    }

    .sidebar-inner {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--sp-3);
        padding: var(--sp-4);
        overflow-y: auto;
    }

    .sidebar-inner::-webkit-scrollbar {
        display: none;
    }

    /* ── Add Photos CTA ── */
    .add-photos-btn {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        padding: var(--sp-3) var(--sp-6);
        border-radius: var(--radius-full);
        background: var(--accent);
        color: var(--text-on-accent);
        font-weight: 600;
        font-size: var(--text-base);
        box-shadow: var(--shadow-md);
        transition: var(--transition-base);
        flex-shrink: 0;
    }

    .add-photos-btn:hover {
        box-shadow: var(--shadow-lg);
        transform: translateY(-1px);
    }

    .add-photos-btn:active {
        transform: translateY(0) scale(0.98);
    }

    .add-photos-btn :global(svg) {
        width: 20px;
        height: 20px;
    }

    /* ── Navigation Items ── */
    .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        padding: var(--sp-2) var(--sp-4);
        border-radius: var(--radius-full);
        font-weight: 500;
        font-size: var(--text-base);
        color: var(--text-secondary);
        transition: var(--transition-fast);
        white-space: nowrap;
        overflow: hidden;
        position: relative;
    }

    .nav-item:hover {
        background: var(--accent-subtle);
        color: var(--text-primary);
    }

    .nav-item.active {
        color: var(--md-sys-color-on-secondary-container);
        font-weight: 600;
    }

    .nav-icon-wrap {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        flex-shrink: 0;
    }

    .nav-active-bg {
        position: absolute;
        inset: -2px -8px;
        background: var(--md-sys-color-secondary-container);
        border-radius: var(--radius-full);
        transform: scaleX(0);
        opacity: 0;
        transition:
            transform 0.3s var(--ease-emphasized),
            opacity 0.2s var(--ease-standard);
    }

    .nav-active-bg.show {
        transform: scaleX(1);
        opacity: 1;
    }

    .nav-icon-wrap :global(svg) {
        position: relative;
        z-index: 1;
    }

    .nav-label {
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* ── Spacer & Footer ── */
    .sidebar-spacer {
        flex: 1;
    }

    .sidebar-footer {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex-shrink: 0;
    }

    .theme-toggle-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: var(--radius-full);
        background: var(--md-sys-color-surface-container-high);
        color: var(--text-secondary);
        transition: var(--transition-fast);
        margin-top: var(--sp-1);
    }

    .theme-toggle-btn:hover {
        background: var(--md-sys-color-surface-container-highest);
        color: var(--text-primary);
    }

    .theme-toggle-btn :global(svg) {
        width: 20px;
        height: 20px;
    }

    /* ── Mobile Bottom Nav ── */
    .mobile-nav {
        display: none;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--md-sys-color-surface-container);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border-top: 1px solid var(--md-sys-color-outline-variant);
        z-index: 40;
    }

    @media (max-width: 767px) {
        .mobile-nav {
            display: block;
        }
    }

    .mobile-nav-inner {
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: var(--sp-2) var(--sp-4) var(--sp-3);
    }

    .mobile-nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: var(--sp-2);
        border-radius: var(--radius-xl);
        color: var(--text-secondary);
        transition: color var(--duration-fast) var(--ease-standard);
    }

    .mobile-nav-item.active {
        color: var(--accent);
    }

    .mobile-nav-item :global(svg) {
        width: 24px;
        height: 24px;
    }

    .mobile-nav-label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.02em;
    }
</style>
