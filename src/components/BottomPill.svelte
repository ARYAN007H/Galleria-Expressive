<script lang="ts">
    import { icons } from "../lib/icons";
    import { activeSection, favoritesCount } from "../lib/store";
    import type { SidebarSection } from "../lib/store";

    function setSection(section: SidebarSection) {
        activeSection.set(section);
    }

    type PillItem = {
        id: SidebarSection;
        label: string;
        icon: string;
    };

    const items: PillItem[] = [
        { id: "all", label: "Library", icon: icons.photos },
        { id: "favorites", label: "Favorites", icon: icons.heart },
        { id: "recents", label: "Recents", icon: icons.clock },
        { id: "videos", label: "Videos", icon: icons.video },
    ];
</script>

<nav class="m3-nav-bar" aria-label="Navigation">
    <div class="nav-bar-inner">
        {#each items as item (item.id)}
            <button
                class="nav-bar-item"
                class:active={$activeSection === item.id}
                on:click={() => setSection(item.id)}
                title={item.label}
            >
                <div class="icon-container">
                    <div
                        class="active-pill"
                        class:show={$activeSection === item.id}
                    ></div>
                    <span
                        class="nav-bar-icon"
                        class:active-icon={$activeSection === item.id}
                    >
                        {@html item.icon}
                    </span>
                    {#if item.id === "favorites" && $favoritesCount > 0}
                        <span class="nav-badge">{$favoritesCount}</span>
                    {/if}
                </div>
                <span class="nav-bar-label">{item.label}</span>
            </button>
        {/each}
    </div>
</nav>

<style>
    /* ── M3 Navigation Bar (Pixel-style) ── */
    .m3-nav-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 900;
        animation: navBarSlideUp var(--duration-emphasized)
            var(--ease-emphasized-decel) both;
        padding: 0 var(--sp-4);
        padding-bottom: env(safe-area-inset-bottom, 0);
    }

    @keyframes navBarSlideUp {
        from {
            opacity: 0;
            transform: translateY(100%);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .nav-bar-inner {
        display: flex;
        align-items: center;
        justify-content: space-around;
        height: var(--nav-bar-height);
        max-width: 420px;
        margin: 0 auto;
        background: var(--md-sys-color-surface-container);
        border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
        box-shadow: var(--shadow-lg);
        padding: 0 var(--sp-2);
    }

    .nav-bar-item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 12px 0;
        color: var(--text-secondary);
        cursor: pointer;
        transition: color var(--duration-base) var(--ease-emphasized);
        -webkit-tap-highlight-color: transparent;
        white-space: nowrap;
        min-width: 64px;
    }

    .nav-bar-item.active {
        color: var(--md-sys-color-on-secondary-container);
    }

    /* ── Animated Indicator Pill (Pixel signature) ── */
    .icon-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 32px;
    }

    .active-pill {
        position: absolute;
        inset: 0;
        background: var(--md-sys-color-secondary-container);
        border-radius: var(--radius-full);
        transform: scaleX(0);
        opacity: 0;
        transition:
            transform var(--duration-emphasized) var(--ease-emphasized),
            opacity var(--duration-base) var(--ease-standard);
    }

    .active-pill.show {
        transform: scaleX(1);
        opacity: 1;
    }

    .nav-bar-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        position: relative;
        z-index: 1;
        transition: transform var(--duration-base) var(--ease-spring);
    }

    .nav-bar-icon :global(svg) {
        width: 22px;
        height: 22px;
    }

    .nav-bar-item.active .nav-bar-icon {
        transform: scale(1.05);
    }

    /* ── Label ── */
    .nav-bar-label {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.02em;
        line-height: 1;
        position: relative;
        z-index: 1;
    }

    /* ── Badge ── */
    .nav-badge {
        position: absolute;
        top: -2px;
        right: 10px;
        min-width: 16px;
        height: 16px;
        padding: 0 4px;
        background: var(--md-sys-color-error);
        color: var(--md-sys-color-on-error);
        font-size: 10px;
        font-weight: 700;
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        z-index: 2;
    }
</style>
