<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { fade } from "svelte/transition";
    import type { Photo } from "../lib/store";
    import { getThumbnail } from "../lib/store";
    import { icons } from "../lib/icons";
    import { convertFileSrc } from "@tauri-apps/api/core";

    export let photo: Photo;
    export let selected: boolean = false;
    export let size: number = 200; // default approximate size

    let src: string = "";
    let visible = false;
    let imgElement: HTMLDivElement;
    let observer: IntersectionObserver;

    onMount(() => {
        observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                visible = true;
                loadThumbnail();
                observer.disconnect();
            }
        });

        if (imgElement) {
            observer.observe(imgElement);
        }
    });

    onDestroy(() => {
        if (observer) observer.disconnect();
    });

    async function loadThumbnail() {
        // Use the store helper which calls the backend
        const rawPath = await getThumbnail(photo.path);
        if (rawPath) {
            src = convertFileSrc(rawPath);
        }
    }

    function formatDuration(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
    class="thumbnail-container"
    class:selected
    on:click
    on:dblclick
    bind:this={imgElement}
    role="button"
    tabindex="0"
>
    {#if visible && src}
        <img {src} alt={photo.filename} loading="lazy" class="thumb-img" />
    {:else}
        <div class="placeholder"></div>
    {/if}

    <div class="overlay">
        <div class="top-row">
            {#if photo.isFavorite}
                <div class="icon-indicator favorite">
                    {@html icons.heartFilled}
                </div>
            {/if}
            {#if selected}
                <div
                    class="icon-indicator selection-check"
                    transition:fade={{ duration: 150 }}
                >
                    {@html icons.check}
                </div>
            {/if}
        </div>

        <div class="bottom-row">
            {#if photo.mediaType === "video"}
                <div class="video-badge">
                    <span class="play-icon"
                        ><svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="white"><path d="M8 5v14l11-7z" /></svg
                        ></span
                    >
                    <!-- generic duration if not available -->
                    <span>Video</span>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .thumbnail-container {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: var(--radius-md);
        overflow: hidden;
        background-color: var(--bg-secondary);
        cursor: pointer;
        transition: transform 0.1s ease;
    }

    .thumbnail-container:active {
        transform: scale(0.98);
    }

    .thumbnail-container.selected {
        box-shadow: 0 0 0 3px var(--accent);
    }

    .thumbnail-container.selected .thumb-img {
        transform: scale(0.95);
    }

    .thumb-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 0.2s ease;
    }

    .placeholder {
        width: 100%;
        height: 100%;
        background-color: var(--bg-secondary);
    }

    .overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 6px;
    }

    .top-row {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
    }

    .icon-indicator {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: white;
    }

    .favorite {
        color: var(--red-500);
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }

    .selection-check {
        background-color: var(--accent);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .selection-check :global(svg) {
        width: 14px;
        height: 14px;
        stroke-width: 3;
    }

    .favorite :global(svg) {
        width: 16px;
        height: 16px;
    }

    .bottom-row {
        display: flex;
        justify-content: flex-start;
    }

    .video-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        padding: 2px 6px;
        border-radius: 4px;
        color: white;
        font-size: 10px;
        font-weight: 500;
    }

    .play-icon :global(svg) {
        width: 10px;
        height: 10px;
        fill: white;
    }
</style>
