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

<nav class="bottom-pill" aria-label="Navigation">
    <div class="pill-inner">
        {#each items as item (item.id)}
            <button
                class="pill-item"
                class:active={$activeSection === item.id}
                on:click={() => setSection(item.id)}
                title={item.label}
            >
                <span
                    class="pill-icon"
                    class:active-icon={$activeSection === item.id}
                >
                    {@html item.icon}
                </span>
                <span class="pill-label">{item.label}</span>
                {#if item.id === "favorites" && $favoritesCount > 0}
                    <span class="pill-badge">{$favoritesCount}</span>
                {/if}
            </button>
        {/each}
    </div>
</nav>

<style>
    .bottom-pill {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 900;
        animation: pillSlideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    @keyframes pillSlideUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(30px) scale(0.92);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
        }
    }

    .pill-inner {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 6px 10px;
        background: var(--glass-thick);
        backdrop-filter: blur(40px) saturate(1.8);
        -webkit-backdrop-filter: blur(40px) saturate(1.8);
        border: 1px solid var(--glass-border-strong);
        border-radius: 26px;
        box-shadow:
            var(--shadow-float),
            inset 0 0.5px 0 rgba(255, 255, 255, 0.08);
    }

    .pill-item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 8px 18px;
        border-radius: 20px;
        color: var(--text-tertiary);
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
        -webkit-tap-highlight-color: transparent;
        white-space: nowrap;
    }

    .pill-item:hover {
        color: var(--text-secondary);
        background: var(--accent-subtle);
    }

    .pill-item.active {
        color: var(--accent);
        background: var(--accent-subtle);
    }

    .pill-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .pill-icon :global(svg) {
        width: 20px;
        height: 20px;
    }

    .pill-item.active .pill-icon {
        transform: scale(1.08);
    }

    .pill-label {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.02em;
        line-height: 1;
    }

    .pill-badge {
        position: absolute;
        top: 3px;
        right: 10px;
        min-width: 15px;
        height: 15px;
        padding: 0 4px;
        background: #ff2d55;
        color: white;
        font-size: 9px;
        font-weight: 700;
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
    }
</style>
