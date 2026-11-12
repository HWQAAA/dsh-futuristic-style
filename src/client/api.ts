import {
  normalizeConfig,
  toPublicConfig,
  type BackgroundSettings,
  type PublicConfig,
} from '../shared/config';
import { assetCandidates, setAssetOrigin } from './assets';

const ENDPOINT = '/dsh-futuristic-style/config';

export const DEFAULT_PUBLIC: PublicConfig = toPublicConfig(normalizeConfig(undefined));

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function assetUrl(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  if (value.startsWith('/') || /^(?:https?:\/\/|dsh-app:\/\/)/i.test(value)) return value;
  return fallback;
}

export function parsePublicConfig(raw: unknown): PublicConfig {
  const record = asRecord(raw);
  setAssetOrigin(record?.origin);
  const settings = normalizeConfig({ background: record?.settings }).background;
  return {
    settings,
    videoUrl: assetUrl(record?.videoUrl, DEFAULT_PUBLIC.videoUrl),
    posterUrl: assetUrl(record?.posterUrl, DEFAULT_PUBLIC.posterUrl),
    bootVideoUrl: assetUrl(record?.bootVideoUrl, DEFAULT_PUBLIC.bootVideoUrl),
    bootPosterUrl: assetUrl(record?.bootPosterUrl, DEFAULT_PUBLIC.bootPosterUrl),
  };
}

export async function fetchPublicConfig(): Promise<PublicConfig> {
  for (const endpoint of assetCandidates(ENDPOINT)) {
    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return parsePublicConfig(await response.json());
    } catch {
      // Try the absolute host URL if the dsh-app relative route is not proxied.
    }
  }
  return DEFAULT_PUBLIC;
}

export async function saveBackgroundSettings(
  settings: BackgroundSettings,
): Promise<PublicConfig> {
  let lastError: unknown;
  for (const endpoint of assetCandidates(ENDPOINT)) {
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ settings: { background: settings } }),
      });
      if (!response.ok) throw new Error(`保存失败：HTTP ${response.status}`);
      return parsePublicConfig(await response.json());
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('保存失败');
}
