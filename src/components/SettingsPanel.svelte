<script lang="ts">
    import { icons } from "../lib/icons";
    import { appSettings, showSettings, updateSettings } from "../lib/store";

    function close() {
        showSettings.set(false);
    }

    function handleOverlayClick(e: MouseEvent) {
        if (e.target === e.currentTarget) close();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") close();
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
    <div class="settings-panel glass-ultra">
        <div class="settings-header">
            <h2>Settings</h2>
            <button class="close-btn" on:click={close} title="Close">
                {@html icons.close}
            </button>
        </div>

        <div class="settings-body">
            <!-- Appearance -->
            <div class="settings-group">
                <h3 class="group-title">Appearance</h3>

                <div class="setting-row">
                    <div class="setting-info">
                        <span class="setting-icon"
                            >{@html $appSettings.theme === "dark"
                                ? icons.moon
                                : icons.sun}</span
                        >
                        <div>
                            <p class="setting-label">Theme</p>
                            <p class="setting-desc">
                                Switch between light and dark mode
                            </p>
                        </div>
                    </div>
                    <div class="theme-toggle">
                        <button
                            class="theme-option"
                            class:active={$appSettings.theme === "light"}
                            on:click={() => updateSettings({ theme: "light" })}
                        >
                            <span>{@html icons.sun}</span>
                            Light
                        </button>
                        <button
                            class="theme-option"
                            class:active={$appSettings.theme === "dark"}
                            on:click={() => updateSettings({ theme: "dark" })}
                        >
                            <span>{@html icons.moon}</span>
                            Dark
                        </button>
                    </div>
                </div>

                <div class="setting-row">
                    <div class="setting-info">
                        <span class="setting-icon">{@html icons.grid}</span>
                        <div>
                            <p class="setting-label">Layout Mode</p>
                            <p class="setting-desc">
                                Change how the gallery is presented
                            </p>
                        </div>
                    </div>
                    <div class="layout-toggle">
                        <button
                            class="layout-option"
                            class:active={$appSettings.layoutMode === "compact"}
                            on:click={() =>
                                updateSettings({ layoutMode: "compact" })}
                            title="Dense grid, minimal spacing"
                        >
                            Compact
                        </button>
                        <button
                            class="layout-option"
                            class:active={$appSettings.layoutMode === "default"}
                            on:click={() =>
                                updateSettings({ layoutMode: "default" })}
                            title="Standard layout with sidebar"
                        >
                            Default
                        </button>
                        <button
                            class="layout-option"
                            class:active={$appSettings.layoutMode ===
                                "expressive"}
                            on:click={() =>
                                updateSettings({ layoutMode: "expressive" })}
                            title="Full-screen with bottom navigation"
                        >
                            Expressive
                        </button>
                    </div>
                </div>
            </div>

            <!-- Gallery -->
            <div class="settings-group">
                <h3 class="group-title">Gallery</h3>

                <div class="setting-row">
                    <div class="setting-info">
                        <span class="setting-icon">{@html icons.image}</span>
                        <div>
                            <p class="setting-label">Filmstrip Scroll</p>
                            <p class="setting-desc">
                                Scroll filmstrip with mouse wheel in detail view
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
                        <span class="setting-icon">{@html icons.grid}</span>
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
                                    gridZoom: parseInt(e.currentTarget.value),
                                })}
                            class="density-slider"
                        />
                        <span class="density-label"
                            >{$appSettings.gridZoom}</span
                        >
                    </div>
                </div>
            </div>

            <!-- Keyboard Shortcuts -->
            <div class="settings-group">
                <h3 class="group-title">Keyboard Shortcuts</h3>
                <div class="shortcuts-grid">
                    <div class="shortcut">
                        <kbd>Ctrl</kbd> + <kbd>F</kbd><span>Search</span>
                    </div>
                    <div class="shortcut">
                        <kbd>Ctrl</kbd> + <kbd>,</kbd><span>Settings</span>
                    </div>
                    <div class="shortcut">
                        <kbd>Esc</kbd><span>Close / Back</span>
                    </div>
                    <div class="shortcut">
                        <kbd>←</kbd> <kbd>→</kbd><span>Navigate Photos</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="settings-footer">
            <span class="version">Photo Sorter v0.1.0</span>
        </div>
    </div>
</div>

<style>
    .settings-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn var(--duration-fast) var(--ease-out);
    }

    .settings-panel {
        width: min(480px, 90vw);
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        border-radius: var(--radius-2xl);
        box-shadow: var(--shadow-float);
        animation: fadeInScale var(--duration-base) var(--ease-spring);
        overflow: hidden;
    }

    .settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--sp-5) var(--sp-6);
        border-bottom: 1px solid var(--glass-border);
    }

    .settings-header h2 {
        font-size: var(--text-lg);
        font-weight: 600;
        letter-spacing: var(--letter-tight);
    }

    .close-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        color: var(--text-tertiary);
        transition: var(--transition-fast);
    }

    .close-btn:hover {
        background: var(--glass-border-strong);
        color: var(--text-primary);
    }

    .settings-body {
        flex: 1;
        overflow-y: auto;
        padding: var(--sp-4) var(--sp-6);
    }

    .settings-group {
        margin-bottom: var(--sp-6);
    }

    .group-title {
        font-size: var(--text-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-tertiary);
        margin-bottom: var(--sp-3);
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
        color: var(--text-secondary);
        flex-shrink: 0;
    }

    .setting-label {
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--text-primary);
    }

    .setting-desc {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        margin-top: 2px;
    }

    /* Theme Toggle */
    .theme-toggle {
        display: flex;
        gap: 2px;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        padding: 2px;
    }

    .theme-option {
        display: flex;
        align-items: center;
        gap: var(--sp-1);
        padding: var(--sp-1) var(--sp-3);
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
        font-weight: 500;
        color: var(--text-tertiary);
        transition: var(--transition-fast);
        white-space: nowrap;
    }

    .theme-option :global(svg) {
        width: 14px;
        height: 14px;
    }

    .theme-option.active {
        background: var(--bg-primary);
        color: var(--accent);
        box-shadow: var(--shadow-xs);
    }

    /* Layout Toggle */
    .layout-toggle {
        display: flex;
        gap: 2px;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        padding: 2px;
    }

    .layout-option {
        padding: var(--sp-1) var(--sp-2);
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
        font-weight: 500;
        color: var(--text-tertiary);
        transition: var(--transition-fast);
        white-space: nowrap;
    }

    .layout-option.active {
        background: var(--bg-primary);
        color: var(--accent);
        box-shadow: var(--shadow-xs);
    }

    /* Toggle Switch */
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
        width: 44px;
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
        transform: translateX(20px);
    }

    /* Density Slider */
    .density-control {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
    }

    .density-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 80px;
        height: 4px;
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
        color: var(--text-tertiary);
        font-weight: 500;
        width: 16px;
        text-align: center;
    }

    /* Keyboard Shortcuts */
    .shortcuts-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--sp-2);
    }

    .shortcut {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        padding: var(--sp-2);
        font-size: var(--text-xs);
        color: var(--text-secondary);
    }

    .shortcut span {
        margin-left: auto;
        color: var(--text-tertiary);
    }

    kbd {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 22px;
        height: 22px;
        padding: 0 var(--sp-1);
        background: var(--bg-tertiary);
        border: 1px solid var(--glass-border-strong);
        border-radius: var(--radius-xs);
        font-family: var(--font-mono);
        font-size: 10px;
        color: var(--text-secondary);
    }

    .settings-footer {
        padding: var(--sp-3) var(--sp-6);
        border-top: 1px solid var(--glass-border);
        text-align: center;
    }

    .version {
        font-size: var(--text-xs);
        color: var(--text-quaternary);
    }
</style>
