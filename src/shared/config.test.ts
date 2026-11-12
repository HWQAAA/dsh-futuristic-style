import { describe, expect, it } from 'vitest';
import {
  BOOT_POSTER_PATH,
  BOOT_VIDEO_PATH,
  DEFAULT_CONFIG,
  POSTER_PATH,
  VIDEO_PATH,
  clampOverlay,
  mergeBackgroundSettings,
  normalizeConfig,
  toPublicConfig,
} from './config.js';

describe('config normalization', () => {
  it('falls back to defaults for invalid input', () => {
    const config = normalizeConfig(null);
    expect(config.version).toBe(2);
    expect(config.background).toEqual(DEFAULT_CONFIG.background);
  });

  it('keeps valid values and clamps overlay', () => {
    const config = normalizeConfig({
      background: { enabled: false, overlay: 2 },
    });
    expect(config.background.enabled).toBe(false);
    expect(config.background.overlay).toBe(0.8);
  });

  it('clamps overlay to the supported range', () => {
    expect(clampOverlay(-1)).toBe(0);
    expect(clampOverlay(0.456)).toBe(0.46);
    expect(clampOverlay(Number.NaN)).toBe(DEFAULT_CONFIG.background.overlay);
  });
});

describe('settings merge', () => {
  it('applies background changes while keeping the one-video shape', () => {
    const config = normalizeConfig({});
    const merged = mergeBackgroundSettings(config, {
      enabled: false,
      overlay: 0.3,
    });
    expect(merged.background.enabled).toBe(false);
    expect(merged.background.overlay).toBe(0.3);
    expect(merged.version).toBe(2);
  });

  it('ignores a non-object patch', () => {
    const config = normalizeConfig({});
    expect(mergeBackgroundSettings(config, null)).toBe(config);
    expect(mergeBackgroundSettings(config, 'nope')).toBe(config);
  });
});

describe('public payload', () => {
  it('exposes one video and one poster with settings', () => {
    const publicConfig = toPublicConfig(normalizeConfig({}));
    expect(publicConfig.videoUrl).toBe(VIDEO_PATH);
    expect(publicConfig.posterUrl).toBe(POSTER_PATH);
    expect(publicConfig.bootVideoUrl).toBe(BOOT_VIDEO_PATH);
    expect(publicConfig.bootPosterUrl).toBe(BOOT_POSTER_PATH);
    expect(publicConfig.settings).toEqual(DEFAULT_CONFIG.background);
  });
});
