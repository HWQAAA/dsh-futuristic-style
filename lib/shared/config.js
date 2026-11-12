export const VIDEO_PATH = '/dsh-futuristic-style/backgrounds/loop.mp4';
export const POSTER_PATH = '/dsh-futuristic-style/backgrounds/poster.png';
export const BOOT_VIDEO_PATH = '/dsh-futuristic-style/boot/cold-start.mp4';
export const BOOT_POSTER_PATH = '/dsh-futuristic-style/boot/poster.png';
export const DEFAULT_CONFIG = {
    version: 2,
    background: {
        enabled: true,
        overlay: 0.28,
    },
};
function asRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return undefined;
    return value;
}
export function clampOverlay(value) {
    const number = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(number))
        return DEFAULT_CONFIG.background.overlay;
    return Math.round(Math.min(0.8, Math.max(0, number)) * 100) / 100;
}
export function normalizeConfig(input) {
    const root = asRecord(input);
    const background = asRecord(root?.background);
    const enabled = typeof background?.enabled === 'boolean'
        ? background.enabled
        : DEFAULT_CONFIG.background.enabled;
    return {
        version: 2,
        background: {
            enabled,
            overlay: clampOverlay(background?.overlay),
        },
    };
}
export function mergeBackgroundSettings(config, patch) {
    const next = asRecord(patch);
    if (!next)
        return config;
    return normalizeConfig({
        ...config,
        background: {
            ...config.background,
            ...next,
        },
    });
}
export function toPublicConfig(config) {
    return {
        settings: { ...config.background },
        videoUrl: VIDEO_PATH,
        posterUrl: POSTER_PATH,
        bootVideoUrl: BOOT_VIDEO_PATH,
        bootPosterUrl: BOOT_POSTER_PATH,
    };
}
