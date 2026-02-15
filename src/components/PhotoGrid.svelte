<script context="module">
    import { icons } from "../lib/icons";
</script>

<script lang="ts">
    import {
        groupedPhotos,
        filteredPhotos,
        selectedPhoto,
        getThumbnail,
        appSettings,
        isMultiSelectMode,
        selectedPhotoIds,
        togglePhotoSelection,
    } from "../lib/store";
    import type { Photo } from "../lib/store";
    import { convertFileSrc } from "@tauri-apps/api/core";

    // Thumbnail cache for performance
    let thumbnailCache = new Map<string, string>();
    let loadingSet = new Set<string>();

    // Compute grid column count based on zoom
    $: columnCount = getColumnCount($appSettings.gridZoom);

    function getColumnCount(zoom: number): number {
        switch (zoom) {
            case 1:
                return 10;
            case 2:
                return 7;
            case 3:
                return 5;
            case 4:
                return 4;
            case 5:
                return 3;
            default:
                return 5;
        }
    }

    $: itemSize = getItemSize($appSettings.gridZoom);

    function getItemSize(zoom: number): number {
        switch (zoom) {
            case 1:
                return 100;
            case 2:
                return 140;
            case 3:
                return 190;
            case 4:
                return 240;
            case 5:
                return 320;
            default:
                return 190;
        }
    }

    async function loadThumbnail(photo: Photo): Promise<string> {
        if (thumbnailCache.has(photo.path)) {
            return thumbnailCache.get(photo.path)!;
        }
        if (loadingSet.has(photo.path)) return "";

        loadingSet.add(photo.path);
        try {
            const thumbPath = await getThumbnail(photo.path);
            if (thumbPath) {
                const url = convertFileSrc(thumbPath);
                thumbnailCache.set(photo.path, url);
                loadingSet.delete(photo.path);
                return url;
            }
        } catch (err) {
            console.error("Thumbnail load error:", err);
        }
        loadingSet.delete(photo.path);
        return "";
    }

    function openPhoto(photo: Photo) {
        if ($isMultiSelectMode) {
            togglePhotoSelection(photo.id);
        } else {
            // Single view select
            selectedPhoto.set(photo);
        }
    }

    function getPhotoAspect(photo: Photo): number {
        if (photo.width && photo.height) {
            return photo.width / photo.height;
        }
        return 1;
    }
</script>

<div
    class="photo-grid-container"
    class:layout-compact={$appSettings.layoutMode === "compact"}
    class:layout-expressive={$appSettings.layoutMode === "expressive"}
>
    {#each $groupedPhotos as group (group.dateKey)}
        <div class="date-section" style="animation-delay: 0.05s">
            <div class="date-header">
                <h2 class="date-label">{group.label}</h2>
                <span class="date-count"
                    >{group.photos.length} photo{group.photos.length !== 1
                        ? "s"
                        : ""}</span
                >
            </div>

            <div
                class="photo-grid"
                style="--col-count: {columnCount}; --item-size: {itemSize}px;"
            >
                {#each group.photos as photo (photo.id)}
                    <button
                        class="photo-card"
                        class:selected={$selectedPhotoIds.has(photo.id)}
                        on:click={() => openPhoto(photo)}
                        title={photo.filename}
                        style="aspect-ratio: {$appSettings.gridZoom >= 4
                            ? getPhotoAspect(photo)
                            : '1'};"
                    >
                        {#if $isMultiSelectMode}
                            <div
                                class="select-checkbox"
                                class:checked={$selectedPhotoIds.has(photo.id)}
                            >
                                {#if $selectedPhotoIds.has(photo.id)}
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="14"
                                        height="14"
                                        fill="white"
                                        ><path
                                            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                                        /></svg
                                    >
                                {/if}
                            </div>
                        {/if}
                        >
                        <div class="photo-thumb">
                            {#await loadThumbnail(photo)}
                                <div class="placeholder">
                                    <div class="placeholder-shimmer"></div>
                                </div>
                            {:then src}
                                {#if src}
                                    <img
                                        {src}
                                        alt={photo.filename}
                                        loading="lazy"
                                        draggable="false"
                                    />
                                {:else}
                                    <div class="placeholder">
                                        <span class="placeholder-icon"
                                            >{@html icons.image || ""}</span
                                        >
                                    </div>
                                {/if}
                            {:catch}
                                <div class="placeholder">
                                    <span class="placeholder-icon">!</span>
                                </div>
                            {/await}
                        </div>

                        {#if photo.mediaType === "video"}
                            <div class="video-badge">
                                <span class="video-icon">▶</span>
                            </div>
                        {/if}
                        {#if photo.isFavorite}
                            <div class="fav-badge">
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="#ff2d55"
                                    ><path
                                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                    /></svg
                                >
                            </div>
                        {/if}
                    </button>
                {/each}
            </div>
        </div>
    {/each}

    {#if $filteredPhotos.length === 0}
        <div class="no-results">
            <p class="no-results-text">No photos found</p>
            <p class="no-results-hint">
                Try adjusting your filters or search query
            </p>
        </div>
    {/if}
</div>

<style>
    .photo-grid-container {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: var(--sp-4) var(--sp-5);
        scroll-behavior: smooth;
    }

    .date-section {
        margin-bottom: var(--sp-8);
        animation: fadeInUp var(--duration-base) var(--ease-out) backwards;
    }

    .date-header {
        display: flex;
        align-items: baseline;
        gap: var(--sp-3);
        padding: var(--sp-2) var(--sp-1);
        margin-bottom: var(--sp-3);
        position: sticky;
        top: -1px;
        z-index: 10;
        background: var(--bg-app);
    }

    .date-label {
        font-size: var(--text-lg);
        font-weight: 700;
        letter-spacing: var(--letter-tight);
        color: var(--text-primary);
    }

    .date-count {
        font-size: var(--text-sm);
        color: var(--text-tertiary);
        font-weight: 400;
    }

    .photo-grid {
        display: grid;
        grid-template-columns: repeat(var(--col-count), 1fr);
        gap: var(--sp-2);
    }

    /* Compact mode: dense, minimal spacing */
    .layout-compact {
        padding: 2px;
    }

    .layout-compact .photo-grid {
        gap: 2px;
    }

    .layout-compact .photo-card {
        border-radius: 2px;
    }

    .layout-compact .photo-thumb img {
        border-radius: 2px;
    }

    .layout-compact .date-header {
        padding: var(--sp-1) 2px;
        margin-bottom: 2px;
    }

    .layout-compact .date-section {
        margin-bottom: var(--sp-2);
    }

    /* Expressive mode: edge-to-edge, minimal chrome */
    .layout-expressive {
        padding: var(--sp-2);
    }

    .layout-expressive .photo-grid {
        gap: 4px;
    }

    .layout-expressive .photo-card {
        border-radius: 0;
    }

    .layout-expressive .photo-thumb img {
        border-radius: 0;
    }

    .photo-card {
        position: relative;
        border-radius: var(--radius-md);
        overflow: hidden;
        cursor: pointer;
        background: var(--bg-secondary);
        transition:
            transform var(--duration-fast) var(--ease-spring),
            box-shadow var(--duration-fast) var(--ease-out);
        will-change: transform;
    }

    .photo-card:hover {
        transform: scale(1.02);
        box-shadow: var(--shadow-md);
        z-index: 5;
    }

    .photo-card:active {
        transform: scale(0.98);
    }

    .photo-thumb {
        width: 100%;
        height: 100%;
        position: absolute;
        inset: 0;
    }

    .photo-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: opacity var(--duration-base) var(--ease-out);
    }

    .placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-tertiary);
    }

    .placeholder-shimmer {
        width: 100%;
        height: 100%;
        background: linear-gradient(
            90deg,
            var(--bg-tertiary) 25%,
            var(--bg-secondary) 50%,
            var(--bg-tertiary) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
    }

    .placeholder-icon {
        color: var(--text-quaternary);
        font-size: 24px;
    }

    .video-badge {
        position: absolute;
        bottom: var(--sp-2);
        left: var(--sp-2);
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        border-radius: var(--radius-full);
        pointer-events: none;
    }

    .video-icon {
        color: white;
        font-size: 12px;
        margin-left: 2px;
    }

    .fav-badge {
        position: absolute;
        top: var(--sp-1);
        right: var(--sp-1);
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(6px);
        border-radius: var(--radius-full);
        pointer-events: none;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }

    .no-results {
        text-align: center;
        padding: var(--sp-16) var(--sp-8);
        animation: fadeIn var(--duration-base) var(--ease-out);
    }

    .no-results-text {
        font-size: var(--text-lg);
        font-weight: 500;
        color: var(--text-secondary);
        margin-bottom: var(--sp-2);
    }

    .no-results-hint {
        font-size: var(--text-sm);
        color: var(--text-tertiary);
    }

    /* Multi-select */
    .photo-card.selected {
        outline: 3px solid var(--accent);
        outline-offset: -3px;
        opacity: 0.9;
    }

    .select-checkbox {
        position: absolute;
        top: 6px;
        left: 6px;
        width: 22px;
        height: 22px;
        border-radius: var(--radius-full);
        border: 2px solid rgba(255, 255, 255, 0.8);
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5;
        transition: all 0.15s ease;
        pointer-events: none;
    }

    .select-checkbox.checked {
        background: var(--accent);
        border-color: var(--accent);
    }
</style>
