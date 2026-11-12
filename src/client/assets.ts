declare global {
  interface Window {
    __DSH_FUTURISTIC_STYLE_ORIGIN__?: string;
  }
}

const ABSOLUTE = /^(?:https?:\/\/|dsh-app:\/\/|data:|blob:)/i;

export function setAssetOrigin(value: unknown): void {
  if (typeof value !== 'string') return;
  const origin = value.trim().replace(/\/+$/, '');
  if (!origin) return;
  window.__DSH_FUTURISTIC_STYLE_ORIGIN__ = origin;
}

export function assetOrigin(): string {
  const value = window.__DSH_FUTURISTIC_STYLE_ORIGIN__;
  return typeof value === 'string' ? value.replace(/\/+$/, '') : '';
}

export function assetCandidates(path: string): string[] {
  if (!path) return [];
  if (ABSOLUTE.test(path)) return [path];
  const origin = assetOrigin();
  if (!origin) return [path];
  return [path, `${origin}${path.startsWith('/') ? path : `/${path}`}`];
}

export function preferredAsset(path: string): string {
  const candidates = assetCandidates(path);
  return candidates[candidates.length - 1] ?? path;
}

export function fallbackAsset(path: string): string | undefined {
  const candidates = assetCandidates(path);
  return candidates.length > 1 ? candidates[0] : undefined;
}

export function nextAssetCandidate(path: string, current: string): string | undefined {
  const candidates = assetCandidates(path);
  if (candidates.length < 2) return undefined;
  const resolvedCurrent = new URL(current, document.baseURI).href;
  return candidates
    .map((candidate) => new URL(candidate, document.baseURI).href)
    .find((candidate) => candidate !== resolvedCurrent);
}
