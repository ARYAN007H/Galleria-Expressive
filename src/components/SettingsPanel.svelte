<script lang="ts">
    import { icons } from "../lib/icons";
    import {
        appSettings,
        showSettings,
        updateSettings,
        folders,
    } from "../lib/store";
    import type { AccentColor } from "../lib/store";

    type SettingsTab = "general" | "appearance" | "library" | "shortcuts";
    let activeTab: SettingsTab = "general";

    function close() {
        showSettings.set(false);
    }

    function handleOverlayClick(e: MouseEvent) {
        if (e.target === e.currentTarget) close();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") close();
    }

    const tabs: { id: SettingsTab; label: string; icon: string }[] = [
        { id: "general", label: "General", icon: icons.settings },
        { id: "appearance", label: "Appearance", icon: icons.sun },
        { id: "library", label: "Library", icon: icons.folder },
        { id: "shortcuts", label: "Shortcuts", icon: icons.info },
    ];

    const accentColors: { id: AccentColor; label: string; color: string }[] = [
        { id: "blue", label: "Blue", color: "#3b82f6" },
        { id: "purple", label: "Purple", color: "#8b5cf6" },
        { id: "pink", label: "Pink", color: "#ec4899" },
        { id: "red", label: "Red", color: "#ef4444" },
        { id: "orange", label: "Orange", color: "#f97316" },
        { id: "green", label: "Green", color: "#22c55e" },
        { id: "teal", label: "Teal", color: "#14b8a6" },
        { id: "indigo", label: "Indigo", color: "#6366f1" },
    ];

    function toggleFolderHidden(folder: string) {
        const hidden = [...$appSettings.hiddenFolders];
        const idx = hidden.indexOf(folder);
        if (idx >= 0) {
            hidden.splice(idx, 1);
        } else {
            hidden.push(folder);
        }
        updateSettings({ hiddenFolders: hidden });
    }

    function toggleFolderPinned(folder: string) {
        const pinned = [...$appSettings.pinnedFolders];
        const idx = pinned.indexOf(folder);
        if (idx >= 0) {
            pinned.splice(idx, 1);
        } else {
            pinned.push(folder);
        }
        updateSettings({ pinnedFolders: pinned });
    }

    function isFolderHidden(folder: string): boolean {
        return $appSettings.hiddenFolders.includes(folder);
    }

    function isFolderPinned(folder: string): boolean {
        return $appSettings.pinnedFolders.includes(folder);
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
    class="settings-overlay"
    on:click={handleOverlayClick}
    role="dialog"
    aria-label="Settings"
>
    <div class="settings-panel">
        <!-- Sidebar tabs -->
        <div class="settings-sidebar">
            <h2 class="settings-title">Settings</h2>
            <nav class="tab-nav">
                {#each tabs as tab}
                    <button
                        class="tab-btn"
                        class:active={activeTab === tab.id}
                        on:click={() => (activeTab = tab.id)}
                    >
                        <span class="tab-icon">{@html tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                {/each}
            </nav>
            <div class="settings-sidebar-footer">
                <span class="version">ifoto v1.0.0</span>
            </div>
        </div>

        <!-- Content -->
        <div class="settings-content">
            <div class="content-header">
                <h3>{tabs.find((t) => t.id === activeTab)?.label}</h3>
                <button class="close-btn" on:click={close} title="Close">
                    {@html icons.close}
                </button>
            </div>

            <div class="content-body">
                <!-- ═══════ GENERAL TAB ═══════ -->
                {#if activeTab === "general"}
                    <div class="settings-group">
                        <h4 class="group-title">Gallery</h4>

                        <div class="setting-row">
                            <div class="setting-info">
                                <span class="setting-icon"
                                    >{@html icons.grid}</span
                                >
                                <div>
                                    <p class="setting-label">Grid Density</p>
                                    <p class="setting-desc">
                                        Default zoom level for the photo grid
                                    </p>
                                </div>
                            </div>
                            <div class="density-control">
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={$appSettings.gridZoom}
                                    on:input={(e) =>
                                        updateSettings({
                                            gridZoom: parseInt(
                                                e.currentTarget.value,
                                            ),
                                        })}
                                    class="density-slider"
                                />
                                <span class="density-label"
                                    >{$appSettings.gridZoom}</span
                                >
                            </div>
                        </div>

                        <div class="setting-row">
                            <div class="setting-info">
                                <span class="setting-icon"
                                    >{@html icons.image}</span
                                >
                                <div>
                                    <p class="setting-label">
                                        Filmstrip Scroll
                                    </p>
                                    <p class="setting-desc">
                                        Scroll filmstrip with mouse wheel in
                                        detail view
                                    </p>
                                </div>
                            </div>
                            <label class="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={$appSettings.filmstripScrollEnabled}
                                    on:change={(e) =>
                                        updateSettings({
                                            filmstripScrollEnabled:
                                                e.currentTarget.checked,
                                        })}
                                />
                                <span class="toggle-track">
                                    <span class="toggle-thumb"></span>
                                </span>
                            </label>
                        </div>

                        <div class="setting-row">
                            <div class="setting-info">
                                <span class="setting-icon"
                                    >{@html icons.sidebar}</span
                                >
                                <div>
                                    <p class="setting-label">Sidebar</p>
                                    <p class="setting-desc">
                                        Show the navigation sidebar
                                    </p>
                                </div>
                            </div>
                            <label class="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={$appSettings.showSidebar}
                                    on:change={(e) =>
                                        updateSettings({
                                            showSidebar:
                                                e.currentTarget.checked,
                                        })}
                                />
                                <span class="toggle-track">
                                    <span class="toggle-thumb"></span>
                                </span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h4 class="group-title">Sidebar Folders</h4>
                        <div class="setting-row">
                            <div class="setting-info">
                                <span class="setting-icon"
                                    >{@html icons.folder}</span
                                >
                                <div>
                                    <p class="setting-label">
                                        Max Visible Folders
                                    </p>
                                    <p class="setting-desc">
                                        How many folders to show in the sidebar
                                    </p>
                                </div>
                            </div>
                            <div class="density-control">
                                <input
                                    type="range"
                                    min="3"
                                    max="20"
                                    value={$appSettings.maxVisibleFolders}
                                    on:input={(e) =>
                                        updateSettings({
                                            maxVisibleFolders: parseInt(
                                                e.currentTarget.value,
                                            ),
                                        })}
                                    class="density-slider"
                                />
                                <span class="density-label"
                                    >{$appSettings.maxVisibleFolders}</span
                                >
                            </div>
                        </div>
                    </div>

                    <!-- ═══════ APPEARANCE TAB ═══════ -->
                {:else if activeTab === "appearance"}
                    <div class="settings-group">
                        <h4 class="group-title">Theme</h4>
                        <div class="setting-row">
                            <div class="setting-info">
                                <span class="setting-icon">
                                    {@html $appSettings.theme === "dark"
                                        ? icons.moon
                                        : icons.sun}
                                </span>
                                <div>
                                    <p class="setting-label">Color Mode</p>
                                    <p class="setting-desc">
                                        Switch between light and dark
                                    </p>
                                </div>
                            </div>
                            <div class="theme-toggle">
                                <button
                                    class="theme-option"
                                    class:active={$appSettings.theme ===
                                        "light"}
                                    on:click={() =>
                                        updateSettings({ theme: "light" })}
                                >
                                    <span>{@html icons.sun}</span> Light
                                </button>
                                <button
                                    class="theme-option"
                                    class:active={$appSettings.theme === "dark"}
                                    on:click={() =>
                                        updateSettings({ theme: "dark" })}
                                >
                                    <span>{@html icons.moon}</span> Dark
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h4 class="group-title">Accent Color</h4>
                        <div class="accent-grid">
                            {#each accentColors as accent}
                                <button
                                    class="accent-swatch"
                                    class:active={$appSettings.accentColor ===
                                        accent.id}
                                    on:click={() =>
                                        updateSettings({
                                            accentColor: accent.id,
                                        })}
                                    title={accent.label}
                                >
                                    <span
                                        class="swatch-circle"
                                        style="background: {accent.color}"
                                    >
                                        {#if $appSettings.accentColor === accent.id}
                                            <svg
                                                width="12"
                                                height="12"
                                                viewBox="0 0 24 24"
                                                fill="white"
                                            >
                                                <path
                                                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                                                />
                                            </svg>
                                        {/if}
                                    </span>
                                    <span class="swatch-label"
                                        >{accent.label}</span
                                    >
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div class="settings-group">
                        <h4 class="group-title">Layout Mode</h4>
                        <div class="layout-cards">
                            <button
                                class="layout-card"
                                class:active={$appSettings.layoutMode ===
                                    "compact"}
                                on:click={() =>
                                    updateSettings({ layoutMode: "compact" })}
                            >
                                <span class="layout-card-icon"
                                    >{@html icons.grid}</span
                                >
                                <span class="layout-card-name">Compact</span>
                                <span class="layout-card-desc"
                                    >Dense grid, minimal spacing</span
                                >
                            </button>
                            <button
                                class="layout-card"
                                class:active={$appSettings.layoutMode ===
                                    "default"}
                                on:click={() =>
                                    updateSettings({ layoutMode: "default" })}
                            >
                                <span class="layout-card-icon"
                                    >{@html icons.grid}</span
                                >
                                <span class="layout-card-name">Default</span>
                                <span class="layout-card-desc"
                                    >Standard layout with sidebar</span
                                >
                            </button>
                            <button
                                class="layout-card"
                                class:active={$appSettings.layoutMode ===
                                    "expressive"}
                                on:click={() =>
                                    updateSettings({
                                        layoutMode: "expressive",
                                    })}
                            >
                                <span class="layout-card-icon"
                                    >{@html icons.image}</span
                                >
                                <span class="layout-card-name">Expressive</span>
                                <span class="layout-card-desc"
                                    >Immersive full-screen experience</span
                                >
                            </button>
                        </div>
                    </div>

                    <!-- ═══════ LIBRARY TAB ═══════ -->
                {:else if activeTab === "library"}
                    <div class="settings-group">
                        <h4 class="group-title">Manage Folders</h4>
                        <p class="group-desc">
                            Toggle visibility and pin your favorite folders.
                            Hidden folders won't appear in the sidebar. Pinned
                            folders appear at the top.
                        </p>

                        {#if $folders.length > 0}
                            <div class="folder-management">
                                {#each $folders as folder}
                                    <div
                                        class="folder-row"
                                        class:hidden-folder={isFolderHidden(
                                            folder,
                                        )}
                                    >
                                        <span class="folder-icon"
                                            >{@html icons.folder}</span
                                        >
                                        <span class="folder-name truncate"
                                            >{folder.split("/").pop() ||
                                                folder}</span
                                        >
                                        <div class="folder-actions">
                                            <button
                                                class="folder-action-btn"
                                                class:pinned={isFolderPinned(
                                                    folder,
                                                )}
                                                on:click={() =>
                                                    toggleFolderPinned(folder)}
                                                title={isFolderPinned(folder)
                                                    ? "Unpin"
                                                    : "Pin to top"}
                                            >
                                                {@html icons.star}
                                            </button>
                                            <button
                                                class="folder-action-btn"
                                                class:eye-hidden={isFolderHidden(
                                                    folder,
                                                )}
                                                on:click={() =>
                                                    toggleFolderHidden(folder)}
                                                title={isFolderHidden(folder)
                                                    ? "Show"
                                                    : "Hide"}
                                            >
                                                {#if isFolderHidden(folder)}
                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        stroke-width="2"
                                                    >
                                                        <path
                                                            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                                                        />
                                                        <line
                                                            x1="1"
                                                            y1="1"
                                                            x2="23"
                                                            y2="23"
                                                        />
                                                    </svg>
                                                {:else}
                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        stroke-width="2"
                                                    >
                                                        <path
                                                            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                                                        />
                                                        <circle
                                                            cx="12"
                                                            cy="12"
                                                            r="3"
                                                        />
                                                    </svg>
                                                {/if}
                                            </button>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <div class="empty-state-sm">
                                No folders indexed yet. Import a folder first.
                            </div>
                        {/if}
                    </div>

                    <!-- ═══════ SHORTCUTS TAB ═══════ -->
                {:else if activeTab === "shortcuts"}
                    <div class="settings-group">
                        <h4 class="group-title">Navigation</h4>
                        <div class="shortcuts-list">
                            <div class="shortcut">
                                <div class="shortcut-keys">
                                    <kbd>←</kbd> <kbd>→</kbd>
                                </div>
                                <span class="shortcut-label"
                                    >Navigate photos</span
                                >
                            </div>
                            <div class="shortcut">
                                <div class="shortcut-keys"><kbd>Esc</kbd></div>
                                <span class="shortcut-label">Close / Back</span>
                            </div>
                            <div class="shortcut">
                                <div class="shortcut-keys"><kbd>I</kbd></div>
                                <span class="shortcut-label"
                                    >Toggle photo info</span
                                >
                            </div>
                        </div>
                    </div>
                    <div class="settings-group">
                        <h4 class="group-title">Actions</h4>
                        <div class="shortcuts-list">
                            <div class="shortcut">
                                <div class="shortcut-keys">
                                    <kbd>Ctrl</kbd> + <kbd>F</kbd>
                                </div>
                                <span class="shortcut-label">Focus search</span>
                            </div>
                            <div class="shortcut">
                                <div class="shortcut-keys">
                                    <kbd>Ctrl</kbd> + <kbd>,</kbd>
                                </div>
                                <span class="shortcut-label">Open settings</span
                                >
                            </div>
                            <div class="shortcut">
                                <div class="shortcut-keys">
                                    <kbd>Ctrl</kbd> + <kbd>⇧</kbd> +
                                    <kbd>A</kbd>
                                </div>
                                <span class="shortcut-label"
                                    >Toggle multi-select</span
                                >
                            </div>
                        </div>
                    </div>
                    <div class="settings-group">
                        <h4 class="group-title">Gestures</h4>
                        <div class="shortcuts-list">
                            <div class="shortcut">
                                <div class="shortcut-keys">Swipe ← →</div>
                                <span class="shortcut-label"
                                    >Navigate in detail view</span
                                >
                            </div>
                            <div class="shortcut">
                                <div class="shortcut-keys">Pinch</div>
                                <span class="shortcut-label"
                                    >Zoom grid in/out</span
                                >
                            </div>
                            <div class="shortcut">
                                <div class="shortcut-keys">
                                    Scroll filmstrip
                                </div>
                                <span class="shortcut-label">Browse photos</span
                                >
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .settings-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn var(--duration-fast) var(--ease-out);
    }

    .settings-panel {
        width: min(680px, 92vw);
        max-height: 80vh;
        display: flex;
        border-radius: var(--radius-2xl);
        background: var(--glass-ultra);
        backdrop-filter: blur(40px) saturate(2);
        -webkit-backdrop-filter: blur(40px) saturate(2);
        border: 1px solid var(--glass-border-strong);
        box-shadow: var(--shadow-float);
        animation: fadeInScale var(--duration-base) var(--ease-spring);
        overflow: hidden;
    }

    /* ── Sidebar Tabs ── */
    .settings-sidebar {
        width: 180px;
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--glass-border);
        background: var(--bg-secondary);
        padding: var(--sp-4);
        flex-shrink: 0;
    }

    .settings-title {
        font-size: var(--text-lg);
        font-weight: 700;
        letter-spacing: var(--letter-tight);
        padding: var(--sp-2) var(--sp-2) var(--sp-4);
    }

    .tab-nav {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
    }

    .tab-btn {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        padding: 7px var(--sp-3);
        border-radius: var(--radius-md);
        font-size: var(--text-sm);
        font-weight: 450;
        color: var(--text-secondary);
        transition: var(--transition-fast);
        text-align: left;
    }

    .tab-btn:hover {
        background: var(--accent-subtle);
    }

    .tab-btn.active {
        background: var(--accent);
        color: white;
    }

    .tab-icon {
        display: flex;
        flex-shrink: 0;
    }

    .tab-icon :global(svg) {
        width: 16px;
        height: 16px;
    }

    .settings-sidebar-footer {
        padding-top: var(--sp-4);
        border-top: 1px solid var(--glass-border);
    }

    .version {
        font-size: var(--text-xs);
        color: var(--text-quaternary);
        font-weight: 450;
    }

    /* ── Content Area ── */
    .settings-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .content-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--sp-4) var(--sp-5);
        border-bottom: 1px solid var(--glass-border);
    }

    .content-header h3 {
        font-size: var(--text-md);
        font-weight: 600;
    }

    .close-btn {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        color: var(--text-tertiary);
        transition: var(--transition-fast);
    }

    .close-btn :global(svg) {
        width: 14px;
        height: 14px;
    }

    .close-btn:hover {
        background: var(--glass-border-strong);
        color: var(--text-primary);
    }

    .content-body {
        flex: 1;
        overflow-y: auto;
        padding: var(--sp-4) var(--sp-5);
    }

    .settings-group {
        margin-bottom: var(--sp-6);
    }

    .group-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-quaternary);
        margin-bottom: var(--sp-3);
    }

    .group-desc {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        margin-bottom: var(--sp-3);
        line-height: 1.5;
    }

    .setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--sp-3) 0;
        gap: var(--sp-4);
    }

    .setting-row + .setting-row {
        border-top: 1px solid var(--glass-border);
    }

    .setting-info {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        flex: 1;
        min-width: 0;
    }

    .setting-icon {
        display: flex;
        color: var(--text-tertiary);
        flex-shrink: 0;
    }

    .setting-icon :global(svg) {
        width: 17px;
        height: 17px;
    }

    .setting-label {
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--text-primary);
    }

    .setting-desc {
        font-size: var(--text-xs);
        color: var(--text-quaternary);
        margin-top: 1px;
    }

    /* ── Theme Toggle ── */
    .theme-toggle {
        display: flex;
        gap: 2px;
        background: var(--bg-secondary);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-md);
        padding: 2px;
    }

    .theme-option {
        display: flex;
        align-items: center;
        gap: var(--sp-1);
        padding: 5px var(--sp-3);
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
        font-weight: 500;
        color: var(--text-tertiary);
        transition: var(--transition-fast);
        white-space: nowrap;
    }

    .theme-option :global(svg) {
        width: 13px;
        height: 13px;
    }

    .theme-option.active {
        background: var(--bg-primary);
        color: var(--accent);
        box-shadow: var(--shadow-xs);
    }

    /* ── Toggle Switch ── */
    .toggle-switch {
        position: relative;
        cursor: pointer;
        flex-shrink: 0;
    }

    .toggle-switch input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
    }

    .toggle-track {
        display: block;
        width: 42px;
        height: 24px;
        background: var(--bg-tertiary);
        border-radius: var(--radius-full);
        transition: background var(--duration-fast) var(--ease-out);
        position: relative;
    }

    .toggle-switch input:checked + .toggle-track {
        background: var(--accent);
    }

    .toggle-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: var(--radius-full);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
        transition: transform var(--duration-fast) var(--ease-spring);
    }

    .toggle-switch input:checked + .toggle-track .toggle-thumb {
        transform: translateX(18px);
    }

    /* ── Density Slider ── */
    .density-control {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
    }

    .density-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 80px;
        height: 3px;
        background: var(--bg-tertiary);
        border-radius: var(--radius-full);
        outline: none;
        cursor: pointer;
    }

    .density-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--accent);
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }

    .density-label {
        font-size: var(--text-xs);
        color: var(--text-quaternary);
        font-weight: 500;
        width: 20px;
        text-align: center;
        font-variant-numeric: tabular-nums;
    }

    /* ── Accent Color Picker ── */
    .accent-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--sp-2);
    }

    .accent-swatch {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: var(--sp-3);
        border-radius: var(--radius-md);
        background: var(--bg-secondary);
        border: 2px solid transparent;
        transition: var(--transition-fast);
    }

    .accent-swatch:hover {
        background: var(--bg-tertiary);
    }

    .accent-swatch.active {
        border-color: var(--accent);
        background: var(--accent-subtle);
    }

    .swatch-circle {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .swatch-label {
        font-size: 10px;
        font-weight: 500;
        color: var(--text-tertiary);
    }

    .accent-swatch.active .swatch-label {
        color: var(--accent);
        font-weight: 600;
    }

    /* ── Layout Cards ── */
    .layout-cards {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--sp-2);
    }

    .layout-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: var(--sp-4) var(--sp-2);
        border-radius: var(--radius-lg);
        background: var(--bg-secondary);
        border: 2px solid transparent;
        transition: var(--transition-fast);
        text-align: center;
    }

    .layout-card:hover {
        background: var(--bg-tertiary);
    }

    .layout-card.active {
        border-color: var(--accent);
        background: var(--accent-subtle);
    }

    .layout-card-icon {
        display: flex;
        color: var(--text-tertiary);
    }

    .layout-card-icon :global(svg) {
        width: 24px;
        height: 24px;
    }

    .layout-card.active .layout-card-icon {
        color: var(--accent);
    }

    .layout-card-name {
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--text-primary);
    }

    .layout-card-desc {
        font-size: 10px;
        color: var(--text-quaternary);
        line-height: 1.3;
    }

    /* ── Folder Management ── */
    .folder-management {
        display: flex;
        flex-direction: column;
        gap: 1px;
        max-height: 320px;
        overflow-y: auto;
    }

    .folder-row {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        padding: 6px var(--sp-2);
        border-radius: var(--radius-sm);
        transition: var(--transition-fast);
    }

    .folder-row:hover {
        background: var(--bg-tertiary);
    }

    .folder-row.hidden-folder {
        opacity: 0.45;
    }

    .folder-icon {
        display: flex;
        color: var(--text-tertiary);
        flex-shrink: 0;
    }

    .folder-icon :global(svg) {
        width: 16px;
        height: 16px;
    }

    .folder-name {
        flex: 1;
        font-size: var(--text-sm);
        min-width: 0;
    }

    .folder-actions {
        display: flex;
        gap: 2px;
        opacity: 0;
        transition: opacity var(--duration-fast) var(--ease-out);
    }

    .folder-row:hover .folder-actions {
        opacity: 1;
    }

    .folder-action-btn {
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-sm);
        color: var(--text-quaternary);
        transition: var(--transition-fast);
    }

    .folder-action-btn :global(svg) {
        width: 14px;
        height: 14px;
    }

    .folder-action-btn:hover {
        background: var(--accent-subtle);
        color: var(--accent);
    }

    .folder-action-btn.pinned {
        color: var(--accent);
    }

    .folder-action-btn.pinned :global(svg) {
        fill: var(--accent);
    }

    .folder-action-btn.eye-hidden {
        color: var(--color-danger);
    }

    .empty-state-sm {
        padding: var(--sp-4);
        text-align: center;
        font-size: var(--text-sm);
        color: var(--text-quaternary);
    }

    /* ── Shortcuts ── */
    .shortcuts-list {
        display: flex;
        flex-direction: column;
        gap: var(--sp-2);
    }

    .shortcut {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sp-3);
        padding: 7px var(--sp-3);
        border-radius: var(--radius-sm);
        background: var(--bg-secondary);
        border: 1px solid var(--glass-border);
    }

    .shortcut-keys {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: var(--text-xs);
    }

    .shortcut-label {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        font-weight: 450;
    }

    kbd {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 22px;
        height: 22px;
        padding: 0 5px;
        background: var(--bg-tertiary);
        border: 1px solid var(--glass-border-strong);
        border-radius: var(--radius-xs);
        font-family: var(--font-mono);
        font-size: 10px;
        color: var(--text-secondary);
    }
</style>
