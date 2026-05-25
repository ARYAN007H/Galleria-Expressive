<script lang="ts">
    import { onMount } from "svelte";
    import {
        filters,
        photos,
        invokeCommand,
        activeSection,
    } from "../lib/store";

    export let onClose: () => void = () => {};

    interface MonthDensity {
        year: number;
        month: number;
        count: number;
    }

    interface PhotoLocation {
        id: number;
        gpsLat: number;
        gpsLon: number;
    }

    let density: MonthDensity[] = [];
    let locations: PhotoLocation[] = [];
    let selectedYear: number | null = null;
    let canvasEl: HTMLCanvasElement;
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    onMount(async () => {
        try {
            density = await invokeCommand<MonthDensity[]>("get_timeline_density", {
                year: selectedYear,
            });
            locations = await invokeCommand<PhotoLocation[]>("get_photo_locations", {
                limit: 1500,
            });
        } catch (e) {
            console.warn("ChronicleAtlas load failed", e);
        }
        drawMap();
    });

    $: if (canvasEl && locations.length) drawMap();

    function drawMap() {
        if (!canvasEl || !locations.length) return;
        const ctx = canvasEl.getContext("2d");
        if (!ctx) return;
        const w = canvasEl.width;
        const h = canvasEl.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "var(--md-sys-color-surface-container-low, #1a1a2e)";
        ctx.fillRect(0, 0, w, h);

        let minLat = 90,
            maxLat = -90,
            minLon = 180,
            maxLon = -180;
        for (const p of locations) {
            minLat = Math.min(minLat, p.gpsLat);
            maxLat = Math.max(maxLat, p.gpsLat);
            minLon = Math.min(minLon, p.gpsLon);
            maxLon = Math.max(maxLon, p.gpsLon);
        }
        const pad = 0.1;
        const latSpan = (maxLat - minLat) || 1;
        const lonSpan = (maxLon - minLon) || 1;

        ctx.fillStyle = "var(--accent, #3b82f6)";
        for (const p of locations) {
            const x = ((p.gpsLon - minLon) / lonSpan) * (w - 20) + 10;
            const y = (1 - (p.gpsLat - minLat) / latSpan) * (h - 20) + 10;
            ctx.globalAlpha = 0.55;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function selectMonth(year: number, month: number) {
        filters.update((f) => ({
            ...f,
            selectedYear: year,
            selectedMonth: month,
        }));
        activeSection.set("all");
        onClose();
    }

    async function loadYear(year: number) {
        selectedYear = year;
        density = await invokeCommand<MonthDensity[]>("get_timeline_density", { year });
    }
</script>

<div class="atlas-overlay" role="dialog" aria-label="Chronicle Atlas">
    <header class="atlas-header">
        <h2>Chronicle Atlas</h2>
        <button class="close-btn" on:click={onClose} aria-label="Close">×</button>
    </header>
    <div class="atlas-body">
        <section class="timeline-spine">
            <h3>Timeline</h3>
            <div class="density-bars">
                {#each density as d}
                    <button
                        class="bar-wrap"
                        title="{monthNames[d.month]} {d.year} — {d.count}"
                        on:click={() => selectMonth(d.year, d.month)}
                    >
                        <div
                            class="bar"
                            style="height: {Math.min(100, d.count)}px"
                        ></div>
                        <span class="bar-label">{monthNames[d.month]}</span>
                    </button>
                {/each}
            </div>
        </section>
        <section class="map-panel">
            <h3>Places ({locations.length} geotagged)</h3>
            <canvas bind:this={canvasEl} width="400" height="220" class="map-canvas"
            ></canvas>
        </section>
    </div>
</div>

<style>
    .atlas-overlay {
        position: absolute;
        inset: 0;
        z-index: 30;
        background: var(--md-sys-color-surface);
        display: flex;
        flex-direction: column;
        padding: var(--sp-4);
    }

    .atlas-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--sp-4);
    }

    .atlas-header h2 {
        font-size: var(--text-xl);
        font-weight: 700;
    }

    .close-btn {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-full);
        font-size: 24px;
        line-height: 1;
        color: var(--text-secondary);
    }

    .atlas-body {
        flex: 1;
        overflow: auto;
        display: grid;
        gap: var(--sp-6);
    }

    @media (min-width: 768px) {
        .atlas-body {
            grid-template-columns: 1fr 1fr;
        }
    }

    .density-bars {
        display: flex;
        align-items: flex-end;
        gap: var(--sp-2);
        min-height: 120px;
        padding-top: var(--sp-4);
    }

    .bar-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--sp-1);
    }

    .bar {
        width: 20px;
        min-height: 4px;
        background: var(--accent);
        border-radius: var(--radius-sm) var(--radius-sm) 0 0;
        transition: height 0.2s;
    }

    .bar-label {
        font-size: 10px;
        color: var(--text-secondary);
    }

    .map-canvas {
        width: 100%;
        max-width: 100%;
        border-radius: var(--radius-lg);
        border: 1px solid var(--md-sys-color-outline-variant);
    }
</style>
