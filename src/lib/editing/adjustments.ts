// ── Editing Adjustment State ──
// Type definitions and defaults for all editing parameters

export interface ToneCurvePoint {
    x: number; // 0-255
    y: number; // 0-255
}

export interface HSLChannelState {
    hue: number;        // -180 to 180
    saturation: number; // -100 to 100
    luminance: number;  // -100 to 100
}

export interface ColorWheelState {
    hue: number;        // 0-360
    saturation: number; // 0-100
    luminance: number;  // -100 to 100
}

export interface AdjustmentState {
    // ── Global Adjustments ──
    // Basic
    temperature: number; // 2000-50000K
    tint: number;        // -150 to 150
    exposure: number;    // -5 to +5 EVs
    contrast: number;    // -100 to 100
    highlights: number;  // -100 to 100
    shadows: number;     // -100 to 100
    whites: number;      // -100 to 100
    blacks: number;      // -100 to 100
    texture: number;
    clarity: number;
    dehaze: number;
    vibrance: number;
    saturation: number;

    // Tone Curve
    toneCurveChannel: 'rgb' | 'r' | 'g' | 'b';
    toneCurveRgb: ToneCurvePoint[];
    toneCurveR: ToneCurvePoint[];
    toneCurveG: ToneCurvePoint[];
    toneCurveB: ToneCurvePoint[];

    // Parametric Tone Curve
    tcParametricHighlights: number; // -100 to 100
    tcParametricLights: number;     // -100 to 100
    tcParametricDarks: number;      // -100 to 100
    tcParametricShadows: number;    // -100 to 100

    // HSL (8 color ranges)
    hsl: HSLChannelState[];

    // Color Grading
    cgShadows: ColorWheelState;
    cgMidtones: ColorWheelState;
    cgHighlights: ColorWheelState;
    cgBlending: number;
    cgBalance: number;

    // Detail
    sharpenAmount: number;
    sharpenRadius: number;
    sharpenDetail: number;
    sharpenMasking: number;
    nrLuminance: number;
    nrLumDetail: number;
    nrLumContrast: number;
    nrColor: number;
    nrColorDetail: number;
    nrColorSmooth: number;

    // Lens Corrections
    lensDistortion: number;
    lensVignetting: number;
    lensCaRed: number;
    lensCaBlue: number;

    // Effects
    vignetteAmount: number;
    vignetteMidpoint: number;
    vignetteRoundness: number;
    vignetteFeather: number;
    vignetteHighlights: number;
    grainAmount: number;
    grainSize: number;
    grainRoughness: number;

    // Calibration
    calShadowTint: number;
    calRedHue: number;
    calRedSat: number;
    calGreenHue: number;
    calGreenSat: number;
    calBlueHue: number;
    calBlueSat: number;

    // Crop & Geometry
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
    cropRotation: number;

    // ── Local Adjustments ──
    masks: MaskLayer[];
}

export type MaskType = 'linear_gradient' | 'radial_gradient' | 'brush';

export interface MaskLayer {
    id: string;             // Unique identifier for the mask
    name: string;           // User-friendly name
    type: MaskType;
    active: boolean;        // Is this mask enabled?
    inverted: boolean;      // Reverse the alpha map
    
    // Geometry logic for Linear Gradient: Start (p1) to End (p2)
    // Geometry logic for Radial Gradient: Center (p1), Outer Radius (p2), Feather (radius)
    // Coords are [0, 1] relative normalized across the cropped geometry
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    radius: number;         // Used for radial feather or brush width
    feather: number;

    // The isolated adjustments overriding or adding to the global image state in this local region
    adjustments: Partial<AdjustmentState>;
}

export const HSL_COLORS = ['Red', 'Orange', 'Yellow', 'Green', 'Aqua', 'Blue', 'Purple', 'Magenta'] as const;

export const HSL_COLOR_HEX: Record<string, string> = {
    Red: '#ef4444',
    Orange: '#f97316',
    Yellow: '#eab308',
    Green: '#22c55e',
    Aqua: '#06b6d4',
    Blue: '#3b82f6',
    Purple: '#8b5cf6',
    Magenta: '#d946ef',
};

function makeDefaultHSL(): HSLChannelState[] {
    return Array.from({ length: 8 }, () => ({ hue: 0, saturation: 0, luminance: 0 }));
}

function makeDefaultWheel(): ColorWheelState {
    return { hue: 0, saturation: 0, luminance: 0 };
}

export const defaultAdjustments: AdjustmentState = {
    temperature: 6500,
    tint: 0,
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    texture: 0,
    clarity: 0,
    dehaze: 0,
    vibrance: 0,
    saturation: 0,

    toneCurveChannel: 'rgb',
    toneCurveRgb: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
    toneCurveR: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
    toneCurveG: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
    toneCurveB: [{ x: 0, y: 0 }, { x: 255, y: 255 }],

    tcParametricHighlights: 0,
    tcParametricLights: 0,
    tcParametricDarks: 0,
    tcParametricShadows: 0,

    hsl: makeDefaultHSL(),

    cgShadows: makeDefaultWheel(),
    cgMidtones: makeDefaultWheel(),
    cgHighlights: makeDefaultWheel(),
    cgBlending: 50,
    cgBalance: 0,

    sharpenAmount: 0,
    sharpenRadius: 1.0,
    sharpenDetail: 25,
    sharpenMasking: 0,
    nrLuminance: 0,
    nrLumDetail: 50,
    nrLumContrast: 50,
    nrColor: 0,
    nrColorDetail: 50,
    nrColorSmooth: 50,

    lensDistortion: 0,
    lensVignetting: 0,
    lensCaRed: 0,
    lensCaBlue: 0,

    vignetteAmount: 0,
    vignetteMidpoint: 50,
    vignetteRoundness: 0,
    vignetteFeather: 50,
    vignetteHighlights: 0,
    grainAmount: 0,
    grainSize: 25,
    grainRoughness: 50,

    calShadowTint: 0,
    calRedHue: 0,
    calRedSat: 0,
    calGreenHue: 0,
    calGreenSat: 0,
    calBlueHue: 0,
    calBlueSat: 0,

    cropX: 0,
    cropY: 0,
    cropWidth: 1.0,
    cropHeight: 1.0,
    cropRotation: 0,

    masks: [],
};

export function cloneAdjustments(adj: AdjustmentState): AdjustmentState {
    return JSON.parse(JSON.stringify(adj));
}

/** Convert AdjustmentState to the payload format expected by Rust */
export function toRustPayload(adj: AdjustmentState): Record<string, unknown> {
    return {
        temperature: adj.temperature,
        tint: adj.tint,
        exposure: adj.exposure,
        contrast: adj.contrast,
        highlights: adj.highlights,
        shadows: adj.shadows,
        whites: adj.whites,
        blacks: adj.blacks,
        texture: adj.texture,
        clarity: adj.clarity,
        dehaze: adj.dehaze,
        vibrance: adj.vibrance,
        saturation: adj.saturation,

        toneCurveRgb: adj.toneCurveRgb.map(p => [p.x, p.y]),
        toneCurveR: adj.toneCurveR.map(p => [p.x, p.y]),
        toneCurveG: adj.toneCurveG.map(p => [p.x, p.y]),
        toneCurveB: adj.toneCurveB.map(p => [p.x, p.y]),

        tcParametricHighlights: adj.tcParametricHighlights,
        tcParametricLights: adj.tcParametricLights,
        tcParametricDarks: adj.tcParametricDarks,
        tcParametricShadows: adj.tcParametricShadows,

        hslHue: adj.hsl.map(h => h.hue),
        hslSat: adj.hsl.map(h => h.saturation),
        hslLum: adj.hsl.map(h => h.luminance),

        cgShadowsHue: adj.cgShadows.hue,
        cgShadowsSat: adj.cgShadows.saturation,
        cgShadowsLum: adj.cgShadows.luminance,
        cgMidtonesHue: adj.cgMidtones.hue,
        cgMidtonesSat: adj.cgMidtones.saturation,
        cgMidtonesLum: adj.cgMidtones.luminance,
        cgHighlightsHue: adj.cgHighlights.hue,
        cgHighlightsSat: adj.cgHighlights.saturation,
        cgHighlightsLum: adj.cgHighlights.luminance,
        cgBlending: adj.cgBlending,
        cgBalance: adj.cgBalance,

        sharpenAmount: adj.sharpenAmount,
        sharpenRadius: adj.sharpenRadius,
        sharpenDetail: adj.sharpenDetail,
        sharpenMasking: adj.sharpenMasking,
        nrLuminance: adj.nrLuminance,
        nrLumDetail: adj.nrLumDetail,
        nrLumContrast: adj.nrLumContrast,
        nrColor: adj.nrColor,
        nrColorDetail: adj.nrColorDetail,
        nrColorSmooth: adj.nrColorSmooth,

        lensDistortion: adj.lensDistortion,
        lensVignetting: adj.lensVignetting,
        lensCaRed: adj.lensCaRed,
        lensCaBlue: adj.lensCaBlue,

        vignetteAmount: adj.vignetteAmount,
        vignetteMidpoint: adj.vignetteMidpoint,
        vignetteRoundness: adj.vignetteRoundness,
        vignetteFeather: adj.vignetteFeather,
        vignetteHighlights: adj.vignetteHighlights,
        grainAmount: adj.grainAmount,
        grainSize: adj.grainSize,
        grainRoughness: adj.grainRoughness,

        calShadowTint: adj.calShadowTint,
        calRedHue: adj.calRedHue,
        calRedSat: adj.calRedSat,
        calGreenHue: adj.calGreenHue,
        calGreenSat: adj.calGreenSat,
        calBlueHue: adj.calBlueHue,
        calBlueSat: adj.calBlueSat,

        cropX: adj.cropX,
        cropY: adj.cropY,
        cropWidth: adj.cropWidth,
        cropHeight: adj.cropHeight,
        cropRotation: adj.cropRotation,

        masks: adj.masks.map(m => ({
            id: m.id,
            maskType: m.type,
            active: m.active,
            inverted: m.inverted,
            x1: m.x1,
            y1: m.y1,
            x2: m.x2,
            y2: m.y2,
            radius: m.radius,
            feather: m.feather,
            // Convert partial adjustment struct dynamically
            adjustments: Object.fromEntries(
                Object.entries(m.adjustments)
                .map(([k, v]) => {
                    // Match the expected flat rust struct keys by creating a pseudo-payload
                    // We recursively serialize a full dummy state overlaid with the partial
                    return [k, v];
                })
            ) // we will map this better shortly
        }))
    };
}

// ── Filter Presets ──

export interface FilterPreset {
    id: string;
    name: string;
    adjustments: Partial<AdjustmentState>;
}

export const filterPresets: FilterPreset[] = [
    {
        id: 'auto', name: 'Auto',
        adjustments: { exposure: 0.3, contrast: 10, highlights: -15, shadows: 15, vibrance: 15 },
    },
    {
        id: 'vivid', name: 'Vivid',
        adjustments: { saturation: 25, contrast: 15, vibrance: 30, clarity: 10 },
    },
    {
        id: 'vivid-warm', name: 'Vivid Warm',
        adjustments: { saturation: 20, contrast: 12, vibrance: 25, temperature: 7000 },
    },
    {
        id: 'vivid-cool', name: 'Vivid Cool',
        adjustments: { saturation: 20, contrast: 12, vibrance: 25, temperature: 5500, tint: -8 },
    },
    {
        id: 'matte', name: 'Matte',
        adjustments: { contrast: -15, blacks: 20, saturation: -10, dehaze: -8 },
    },
    {
        id: 'bw', name: 'B&W',
        adjustments: { saturation: -100, contrast: 15 },
    },
    {
        id: 'bw-high-contrast', name: 'B&W Noir',
        adjustments: { saturation: -100, contrast: 40, blacks: -15, clarity: 20 },
    },
    {
        id: 'silvertone', name: 'Silvertone',
        adjustments: { saturation: -100, contrast: 20, exposure: 0.1, highlights: -10 },
    },
    {
        id: 'cool-shadows', name: 'Cool Shadows',
        adjustments: { temperature: 5800, tint: -10, shadows: 15, highlights: -10 },
    },
    {
        id: 'golden-hour', name: 'Golden Hour',
        adjustments: { temperature: 7500, tint: 10, exposure: 0.2, contrast: 10, vibrance: 20 },
    },
    {
        id: 'cinematic', name: 'Teal & Orange',
        adjustments: { temperature: 5500, contrast: 20, saturation: -10, vibrance: 25 },
    },
    {
        id: 'portrait-soft', name: 'Portrait Soft',
        adjustments: { highlights: -20, shadows: 15, clarity: -15, vibrance: 10, sharpenAmount: 20 },
    },
    {
        id: 'landscape', name: 'Landscape',
        adjustments: { clarity: 25, vibrance: 20, dehaze: 15, highlights: -20, shadows: 20 },
    },
    {
        id: 'dramatic', name: 'Dramatic',
        adjustments: { contrast: 35, highlights: -25, shadows: -10, clarity: 30, texture: 20, saturation: -10 },
    },
    {
        id: 'film-grain', name: 'Film Grain',
        adjustments: { contrast: 10, saturation: -15, grainAmount: 30, grainSize: 15, grainRoughness: 60 },
    },
    {
        id: 'moody', name: 'Moody',
        adjustments: { exposure: -0.3, contrast: 15, shadows: -10, dehaze: -10, vibrance: -15, vignetteAmount: -30 },
    },
];
