export const VIDEO_PATH = '/dsh-futuristic-style/backgrounds/loop.mp4';
export const POSTER_PATH = '/dsh-futuristic-style/backgrounds/poster.png';
export const BOOT_VIDEO_PATH = '/dsh-futuristic-style/boot/cold-start.mp4';
export const BOOT_POSTER_PATH = '/dsh-futuristic-style/boot/poster.png';

export interface BackgroundSettings {
  enabled: boolean;
  overlay: number;
}

export interface PluginConfig {
  version: 2;
  background: BackgroundSettings;
}

export interface PublicConfig {
  settings: BackgroundSettings;
  videoUrl: string;
  posterUrl: string;
  bootVideoUrl: string;
  bootPosterUrl: string;
}

export const DEFAULT_CONFIG: PluginConfig = {
  version: 2,
  background: {
    enabled: true,
    overlay: 0.28,
  },
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

export function clampOverlay(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return DEFAULT_CONFIG.background.overlay;
  return Math.round(Math.min(0.8, Math.max(0, number)) * 100) / 100;
}

export function normalizeConfig(input: unknown): PluginConfig {
  const root = asRecord(input);
  const background = asRecord(root?.background);
  const enabled =
    typeof background?.enabled === 'boolean'
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

export function mergeBackgroundSettings(config: PluginConfig, patch: unknown): PluginConfig {
  const next = asRecord(patch);
  if (!next) return config;
  return normalizeConfig({
    ...config,
    background: {
      ...config.background,
      ...next,
    },
  });
}

export function toPublicConfig(config: PluginConfig): PublicConfig {
  return {
    settings: { ...config.background },
    videoUrl: VIDEO_PATH,
    posterUrl: POSTER_PATH,
    bootVideoUrl: BOOT_VIDEO_PATH,
    bootPosterUrl: BOOT_POSTER_PATH,
  };
}
