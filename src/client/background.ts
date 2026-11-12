import { assetCandidates, nextAssetCandidate } from './assets';
import { DEFAULT_PUBLIC, fetchPublicConfig } from './api';
import type { PublicConfig } from '../shared/config';

let current: PublicConfig = DEFAULT_PUBLIC;
let layer: HTMLDivElement | undefined;
let poster: HTMLImageElement | undefined;
let video: HTMLVideoElement | undefined;
let observer: MutationObserver | undefined;
let themeObserver: MutationObserver | undefined;
let themeQuery: MediaQueryList | undefined;
let themeListener: (() => void) | undefined;
let motionQuery: MediaQueryList | undefined;
let motionListener: (() => void) | undefined;
let visibilityListener: (() => void) | undefined;
let videoListeners: Array<[string, EventListener]> = [];

function detectTheme(): 'light' | 'dark' {
  const scheme = getComputedStyle(document.documentElement).colorScheme || '';
  if (/dark/i.test(scheme)) return 'dark';
  if (/light/i.test(scheme)) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function playVideo(): void {
  if (!video) return;
  void video.play().catch(() => {
    // Autoplay can be blocked; the poster stays visible and chat remains usable.
  });
}

function renderPoster(base: string): void {
  if (!poster) return;
  poster.dataset.base = base;
  delete poster.dataset.fallback;
  const candidates = assetCandidates(base);
  poster.src = candidates[0] ?? base;
  if (layer) {
    layer.style.backgroundImage = candidates
      .map((candidate) => `url("${candidate.replace(/"/g, '%22')}")`)
      .join(',');
    layer.style.backgroundSize = 'cover';
    layer.style.backgroundPosition = 'center';
  }
}

function renderVideo(base: string): void {
  if (!video) return;
  video.dataset.base = base;
  delete video.dataset.fallback;
  video.src = assetCandidates(base)[0] ?? base;
  video.load();
}

function onPosterError(): void {
  if (!poster || poster.dataset.fallback) return;
  const base = poster.dataset.base || current.posterUrl;
  const next = nextAssetCandidate(base, poster.src);
  if (!next) return;
  poster.dataset.fallback = '1';
  poster.src = next;
}

function onVideoError(): void {
  if (!video) return;
  if (video.dataset.fallback) {
    layer?.classList.remove('is-playing');
    return;
  }
  const base = video.dataset.base || current.videoUrl;
  const next = nextAssetCandidate(base, video.src);
  if (!next) {
    layer?.classList.remove('is-playing');
    return;
  }
  video.dataset.fallback = '1';
  video.src = next;
  video.load();
  playVideo();
}

function apply(): void {
  if (!layer || !poster || !video) return;
  const enabled = current.settings.enabled;
  layer.style.display = enabled ? 'block' : 'none';
  layer.style.setProperty('--dsh-fs-overlay', String(current.settings.overlay));

  if (poster.dataset.base !== current.posterUrl) renderPoster(current.posterUrl);
  if (video.dataset.base !== current.videoUrl) renderVideo(current.videoUrl);

  document.documentElement.classList.toggle('dsh-fs-bg-on', enabled);
  if (!enabled) {
    video.pause();
    return;
  }
  if (motionQuery?.matches) {
    video.pause();
    layer.classList.remove('is-playing');
    return;
  }
  playVideo();
}

export function getCurrentPublicConfig(): PublicConfig {
  return current;
}

export function applyPublicConfig(config: PublicConfig): void {
  current = config;
  apply();
}

function createLayer(): void {
  layer = document.createElement('div');
  layer.id = 'dsh-futuristic-style-bg';
  layer.setAttribute('aria-hidden', 'true');

  poster = document.createElement('img');
  poster.className = 'dsh-fs-poster';
  poster.alt = '';
  poster.draggable = false;

  video = document.createElement('video');
  video.className = 'dsh-fs-video';
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = true;
  video.preload = 'auto';
  video.poster = current.posterUrl;
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.tabIndex = -1;

  const veil = document.createElement('div');
  veil.className = 'dsh-fs-veil';

  layer.append(poster, video, veil);
  const parent = document.body || document.documentElement;
  parent.insertBefore(layer, parent.firstChild);

  const onPlaying = (): void => layer?.classList.add('is-playing');
  const onVideoStall = (): void => layer?.classList.remove('is-playing');
  const addVideoListener = (name: string, listener: EventListener): void => {
    video?.addEventListener(name, listener);
    videoListeners.push([name, listener]);
  };
  addVideoListener('playing', onPlaying);
  addVideoListener('error', onVideoError);
  addVideoListener('stalled', onVideoStall);
  poster.addEventListener('error', onPosterError);
  renderPoster(current.posterUrl);
  renderVideo(current.videoUrl);

  visibilityListener = (): void => {
    if (!video) return;
    if (document.hidden) video.pause();
    else if (current.settings.enabled) apply();
  };
  document.addEventListener('visibilitychange', visibilityListener);

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionListener = (): void => apply();
  motionQuery.addEventListener('change', motionListener);

  apply();

  if (document.body) {
    observer = new MutationObserver(() => {
      if (layer && !layer.isConnected && document.body) {
        document.body.insertBefore(layer, document.body.firstChild);
      }
    });
    observer.observe(document.body, { childList: true });
  }

  const applyTheme = (): void => {
    document.documentElement.dataset.dshFsTheme = detectTheme();
  };
  applyTheme();
  themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  themeListener = applyTheme;
  themeQuery.addEventListener('change', themeListener);
  themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme'],
  });

  void fetchPublicConfig().then((config) => {
    current = config;
    renderPoster(current.posterUrl);
    renderVideo(current.videoUrl);
    apply();
  });
}

function disposeLayer(): void {
  observer?.disconnect();
  observer = undefined;
  themeObserver?.disconnect();
  themeObserver = undefined;
  if (themeQuery && themeListener) themeQuery.removeEventListener('change', themeListener);
  themeQuery = undefined;
  themeListener = undefined;
  if (motionQuery && motionListener) motionQuery.removeEventListener('change', motionListener);
  motionQuery = undefined;
  motionListener = undefined;
  if (visibilityListener) document.removeEventListener('visibilitychange', visibilityListener);
  visibilityListener = undefined;
  if (video) {
    for (const [name, listener] of videoListeners) video.removeEventListener(name, listener);
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
  videoListeners = [];
  layer?.remove();
  layer = undefined;
  poster = undefined;
  video = undefined;
  document.documentElement.classList.remove('dsh-fs-bg-on');
  delete document.documentElement.dataset.dshFsTheme;
}

export function installBackground(): () => void {
  if (!layer) createLayer();
  else apply();
  return disposeLayer;
}
