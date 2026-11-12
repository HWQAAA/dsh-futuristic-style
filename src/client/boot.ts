import { BOOT_POSTER_PATH, BOOT_VIDEO_PATH } from '../shared/config';
import { assetCandidates, fallbackAsset, preferredAsset } from './assets';

const SESSION_KEY = 'dsh-futuristic-style.boot.v2';
const REVEAL_MS = 1200;

export function installBootAnimation(): () => void {
  try {
    const cover = (window as any).__DSH_FUTURISTIC_STYLE_COVER__;
    if (cover && typeof cover.remove === 'function') cover.remove();
  } catch {
    // The host cover is optional; the overlay can proceed without it.
  }
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return () => {};
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sessionStorage.setItem(SESSION_KEY, '1');
      return () => {};
    }
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // Storage can be unavailable; continue with the animation.
  }

  const overlay = document.createElement('div');
  overlay.id = 'dsh-futuristic-style-boot';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', '启动动画');
  const posterSources = assetCandidates(BOOT_POSTER_PATH);
  overlay.style.backgroundImage = posterSources
    .map((candidate) => `url("${candidate.replace(/"/g, '%22')}")`)
    .join(',');
  overlay.style.backgroundSize = 'cover';
  overlay.style.backgroundPosition = 'center';

  const video = document.createElement('video');
  video.className = 'dsh-fs-boot-video';
  video.src = preferredAsset(BOOT_VIDEO_PATH);
  video.poster = preferredAsset(BOOT_POSTER_PATH);
  video.muted = false;
  video.volume = 0.8;
  video.playsInline = true;
  video.preload = 'auto';
  video.autoplay = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.tabIndex = -1;

  const shade = document.createElement('div');
  shade.className = 'dsh-fs-boot-shade';

  const brand = document.createElement('div');
  brand.className = 'dsh-fs-boot-brand';
  const brandName = document.createElement('strong');
  brandName.textContent = 'DEEPSEEK HARNESS';
  const brandTag = document.createElement('span');
  brandTag.textContent = 'FUTURISTIC STYLE';
  brand.append(brandName, brandTag);

  const hint = document.createElement('div');
  hint.className = 'dsh-fs-boot-hint';
  hint.textContent = '冷启动 · 10 秒';

  const progress = document.createElement('div');
  progress.className = 'dsh-fs-boot-progress';
  const progressBar = document.createElement('i');
  progress.appendChild(progressBar);

  const sound = document.createElement('button');
  sound.type = 'button';
  sound.className = 'dsh-fs-boot-sound';
  sound.textContent = '声音：开';
  sound.setAttribute('aria-pressed', 'true');

  const skip = document.createElement('button');
  skip.type = 'button';
  skip.className = 'dsh-fs-boot-skip';
  skip.textContent = '跳过';

  overlay.append(video, shade, brand, hint, progress, sound, skip);
  const parent = document.body || document.documentElement;
  parent.appendChild(overlay);
  document.documentElement.classList.add('dsh-fs-booting');

  let finished = false;
  let videoFallbackStarted = false;
  let failTimer = 0;
  let hideTimer = 0;

  const setSound = (muted: boolean): void => {
    video.muted = muted;
    sound.textContent = muted ? '声音：关' : '声音：开';
    sound.setAttribute('aria-pressed', String(!muted));
  };

  const finish = (immediate = false): void => {
    if (finished) return;
    finished = true;
    window.clearTimeout(failTimer);
    window.clearTimeout(hideTimer);
    window.removeEventListener('keydown', onKeyDown);
    video.pause();
    if (!immediate) document.documentElement.classList.add('dsh-fs-revealing');
    overlay.classList.add('is-leaving');
    hideTimer = window.setTimeout(() => {
      overlay.remove();
      video.removeAttribute('src');
      video.load();
      document.documentElement.classList.remove('dsh-fs-booting', 'dsh-fs-revealing');
    }, immediate ? 0 : REVEAL_MS);
  };

  const useVideoFallback = (): boolean => {
    if (videoFallbackStarted) return false;
    const fallback = fallbackAsset(BOOT_VIDEO_PATH);
    if (!fallback) return false;
    videoFallbackStarted = true;
    video.src = fallback;
    video.load();
    void video.play().catch(() => finish(true));
    return true;
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') finish();
  };
  window.addEventListener('keydown', onKeyDown);
  skip.addEventListener('click', () => finish());
  sound.addEventListener('click', () => {
    if (video.muted) {
      setSound(false);
      void video.play().catch(() => setSound(true));
    } else {
      setSound(true);
    }
  });
  video.addEventListener('error', () => {
    if (!useVideoFallback()) finish(true);
  });
  video.addEventListener('timeupdate', () => {
    const duration = video.duration;
    if (Number.isFinite(duration) && duration > 0) {
      progressBar.style.width = `${Math.min(100, (video.currentTime / duration) * 100)}%`;
    }
  });
  video.addEventListener('ended', () => {
    window.setTimeout(() => finish(), 260);
  });
  video.addEventListener('loadedmetadata', () => {
    window.clearTimeout(failTimer);
    const duration = Number.isFinite(video.duration) ? video.duration : 10;
    failTimer = window.setTimeout(() => finish(true), Math.max(12000, duration * 1000 + 2500));
  });
  failTimer = window.setTimeout(() => finish(true), 15000);

  const start = async (): Promise<void> => {
    setSound(false);
    try {
      await video.play();
    } catch {
      if (videoFallbackStarted) return;
      setSound(true);
      try {
        await video.play();
      } catch {
        window.setTimeout(() => {
          if (!finished && !videoFallbackStarted) finish(true);
        }, 800);
      }
    }
  };
  void start();

  return () => {
    if (!finished) finish(true);
  };
}
