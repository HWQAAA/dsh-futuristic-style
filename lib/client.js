(function() {
	// src/client/assets.ts
	var ABSOLUTE = /^(?:https?:\/\/|dsh-app:\/\/|data:|blob:)/i;
	function setAssetOrigin(value) {
		if (typeof value !== "string") return;
		const origin = value.trim().replace(/\/+$/, "");
		if (!origin) return;
		window.__DSH_FUTURISTIC_STYLE_ORIGIN__ = origin;
	}
	function assetOrigin() {
		const value = window.__DSH_FUTURISTIC_STYLE_ORIGIN__;
		return typeof value === "string" ? value.replace(/\/+$/, "") : "";
	}
	function assetCandidates(path) {
		if (!path) return [];
		if (ABSOLUTE.test(path)) return [path];
		const origin = assetOrigin();
		if (!origin) return [path];
		return [path, `${origin}${path.startsWith("/") ? path : `/${path}`}`];
	}
	function preferredAsset(path) {
		const candidates = assetCandidates(path);
		return candidates[candidates.length - 1] ?? path;
	}
	function fallbackAsset(path) {
		const candidates = assetCandidates(path);
		return candidates.length > 1 ? candidates[0] : void 0;
	}
	function nextAssetCandidate(path, current) {
		const candidates = assetCandidates(path);
		if (candidates.length < 2) return void 0;
		const resolvedCurrent = new URL(current, document.baseURI).href;
		return candidates.map((candidate) => new URL(candidate, document.baseURI).href).find((candidate) => candidate !== resolvedCurrent);
	}
	// src/shared/config.ts
	var VIDEO_PATH = "/dsh-futuristic-style/backgrounds/loop.mp4";
	var POSTER_PATH = "/dsh-futuristic-style/backgrounds/poster.png";
	var BOOT_VIDEO_PATH = "/dsh-futuristic-style/boot/cold-start.mp4";
	var BOOT_POSTER_PATH = "/dsh-futuristic-style/boot/poster.png";
	var DEFAULT_CONFIG = {
		version: 2,
		background: {
			enabled: true,
			overlay: .28
		}
	};
	function asRecord$1(value) {
		if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
		return value;
	}
	function clampOverlay(value) {
		const number = typeof value === "number" ? value : Number(value);
		if (!Number.isFinite(number)) return DEFAULT_CONFIG.background.overlay;
		return Math.round(Math.min(.8, Math.max(0, number)) * 100) / 100;
	}
	function normalizeConfig(input) {
		const background = asRecord$1(asRecord$1(input)?.background);
		return {
			version: 2,
			background: {
				enabled: typeof background?.enabled === "boolean" ? background.enabled : DEFAULT_CONFIG.background.enabled,
				overlay: clampOverlay(background?.overlay)
			}
		};
	}
	function toPublicConfig(config) {
		return {
			settings: { ...config.background },
			videoUrl: VIDEO_PATH,
			posterUrl: POSTER_PATH,
			bootVideoUrl: BOOT_VIDEO_PATH,
			bootPosterUrl: BOOT_POSTER_PATH
		};
	}
	// src/client/api.ts
	var ENDPOINT = "/dsh-futuristic-style/config";
	var DEFAULT_PUBLIC = toPublicConfig(normalizeConfig(void 0));
	function asRecord(value) {
		if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
		return value;
	}
	function assetUrl(value, fallback) {
		if (typeof value !== "string") return fallback;
		if (value.startsWith("/") || /^(?:https?:\/\/|dsh-app:\/\/)/i.test(value)) return value;
		return fallback;
	}
	function parsePublicConfig(raw) {
		const record = asRecord(raw);
		setAssetOrigin(record?.origin);
		return {
			settings: normalizeConfig({ background: record?.settings }).background,
			videoUrl: assetUrl(record?.videoUrl, DEFAULT_PUBLIC.videoUrl),
			posterUrl: assetUrl(record?.posterUrl, DEFAULT_PUBLIC.posterUrl),
			bootVideoUrl: assetUrl(record?.bootVideoUrl, DEFAULT_PUBLIC.bootVideoUrl),
			bootPosterUrl: assetUrl(record?.bootPosterUrl, DEFAULT_PUBLIC.bootPosterUrl)
		};
	}
	async function fetchPublicConfig() {
		for (const endpoint of assetCandidates(ENDPOINT)) try {
			const response = await fetch(endpoint, { cache: "no-store" });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return parsePublicConfig(await response.json());
		} catch {}
		return DEFAULT_PUBLIC;
	}
	async function saveBackgroundSettings(settings) {
		let lastError;
		for (const endpoint of assetCandidates(ENDPOINT)) try {
			const response = await fetch(endpoint, {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ settings: { background: settings } })
			});
			if (!response.ok) throw new Error(`保存失败：HTTP ${response.status}`);
			return parsePublicConfig(await response.json());
		} catch (error) {
			lastError = error;
		}
		throw lastError instanceof Error ? lastError : /* @__PURE__ */ new Error("保存失败");
	}
	// src/client/background.ts
	var current = DEFAULT_PUBLIC;
	var layer;
	var poster;
	var video;
	var observer;
	var themeObserver;
	var themeQuery;
	var themeListener;
	var motionQuery;
	var motionListener;
	var visibilityListener;
	var videoListeners = [];
	function detectTheme() {
		const scheme = getComputedStyle(document.documentElement).colorScheme || "";
		if (/dark/i.test(scheme)) return "dark";
		if (/light/i.test(scheme)) return "light";
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	}
	function playVideo() {
		if (!video) return;
		video.play().catch(() => {});
	}
	function renderPoster(base) {
		if (!poster) return;
		poster.dataset.base = base;
		delete poster.dataset.fallback;
		const candidates = assetCandidates(base);
		poster.src = candidates[0] ?? base;
		if (layer) {
			layer.style.backgroundImage = candidates.map((candidate) => `url("${candidate.replace(/"/g, "%22")}")`).join(",");
			layer.style.backgroundSize = "cover";
			layer.style.backgroundPosition = "center";
		}
	}
	function renderVideo(base) {
		if (!video) return;
		video.dataset.base = base;
		delete video.dataset.fallback;
		video.src = assetCandidates(base)[0] ?? base;
		video.load();
	}
	function onPosterError() {
		if (!poster || poster.dataset.fallback) return;
		const next = nextAssetCandidate(poster.dataset.base || current.posterUrl, poster.src);
		if (!next) return;
		poster.dataset.fallback = "1";
		poster.src = next;
	}
	function onVideoError() {
		if (!video) return;
		if (video.dataset.fallback) {
			layer?.classList.remove("is-playing");
			return;
		}
		const next = nextAssetCandidate(video.dataset.base || current.videoUrl, video.src);
		if (!next) {
			layer?.classList.remove("is-playing");
			return;
		}
		video.dataset.fallback = "1";
		video.src = next;
		video.load();
		playVideo();
	}
	function apply() {
		if (!layer || !poster || !video) return;
		const enabled = current.settings.enabled;
		layer.style.display = enabled ? "block" : "none";
		layer.style.setProperty("--dsh-fs-overlay", String(current.settings.overlay));
		if (poster.dataset.base !== current.posterUrl) renderPoster(current.posterUrl);
		if (video.dataset.base !== current.videoUrl) renderVideo(current.videoUrl);
		document.documentElement.classList.toggle("dsh-fs-bg-on", enabled);
		if (!enabled) {
			video.pause();
			return;
		}
		if (motionQuery?.matches) {
			video.pause();
			layer.classList.remove("is-playing");
			return;
		}
		playVideo();
	}
	function getCurrentPublicConfig() {
		return current;
	}
	function applyPublicConfig(config) {
		current = config;
		apply();
	}
	function createLayer() {
		layer = document.createElement("div");
		layer.id = "dsh-futuristic-style-bg";
		layer.setAttribute("aria-hidden", "true");
		poster = document.createElement("img");
		poster.className = "dsh-fs-poster";
		poster.alt = "";
		poster.draggable = false;
		video = document.createElement("video");
		video.className = "dsh-fs-video";
		video.muted = true;
		video.loop = true;
		video.playsInline = true;
		video.autoplay = true;
		video.preload = "auto";
		video.poster = current.posterUrl;
		video.setAttribute("muted", "");
		video.setAttribute("loop", "");
		video.setAttribute("playsinline", "");
		video.setAttribute("aria-hidden", "true");
		video.tabIndex = -1;
		const veil = document.createElement("div");
		veil.className = "dsh-fs-veil";
		layer.append(poster, video, veil);
		const parent = document.body || document.documentElement;
		parent.insertBefore(layer, parent.firstChild);
		const onPlaying = () => layer?.classList.add("is-playing");
		const onVideoStall = () => layer?.classList.remove("is-playing");
		const addVideoListener = (name, listener) => {
			video?.addEventListener(name, listener);
			videoListeners.push([name, listener]);
		};
		addVideoListener("playing", onPlaying);
		addVideoListener("error", onVideoError);
		addVideoListener("stalled", onVideoStall);
		poster.addEventListener("error", onPosterError);
		renderPoster(current.posterUrl);
		renderVideo(current.videoUrl);
		visibilityListener = () => {
			if (!video) return;
			if (document.hidden) video.pause();
			else if (current.settings.enabled) apply();
		};
		document.addEventListener("visibilitychange", visibilityListener);
		motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		motionListener = () => apply();
		motionQuery.addEventListener("change", motionListener);
		apply();
		if (document.body) {
			observer = new MutationObserver(() => {
				if (layer && !layer.isConnected && document.body) document.body.insertBefore(layer, document.body.firstChild);
			});
			observer.observe(document.body, { childList: true });
		}
		const applyTheme = () => {
			document.documentElement.dataset.dshFsTheme = detectTheme();
		};
		applyTheme();
		themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
		themeListener = applyTheme;
		themeQuery.addEventListener("change", themeListener);
		themeObserver = new MutationObserver(applyTheme);
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: [
				"class",
				"style",
				"data-theme"
			]
		});
		fetchPublicConfig().then((config) => {
			current = config;
			renderPoster(current.posterUrl);
			renderVideo(current.videoUrl);
			apply();
		});
	}
	function disposeLayer() {
		observer?.disconnect();
		observer = void 0;
		themeObserver?.disconnect();
		themeObserver = void 0;
		if (themeQuery && themeListener) themeQuery.removeEventListener("change", themeListener);
		themeQuery = void 0;
		themeListener = void 0;
		if (motionQuery && motionListener) motionQuery.removeEventListener("change", motionListener);
		motionQuery = void 0;
		motionListener = void 0;
		if (visibilityListener) document.removeEventListener("visibilitychange", visibilityListener);
		visibilityListener = void 0;
		if (video) {
			for (const [name, listener] of videoListeners) video.removeEventListener(name, listener);
			video.pause();
			video.removeAttribute("src");
			video.load();
		}
		videoListeners = [];
		layer?.remove();
		layer = void 0;
		poster = void 0;
		video = void 0;
		document.documentElement.classList.remove("dsh-fs-bg-on");
		delete document.documentElement.dataset.dshFsTheme;
	}
	function installBackground() {
		if (!layer) createLayer();
		else apply();
		return disposeLayer;
	}
	// src/client/boot.ts
	var SESSION_KEY = "dsh-futuristic-style.boot.v2";
	var REVEAL_MS = 1200;
	function installBootAnimation() {
		try {
			const cover = window.__DSH_FUTURISTIC_STYLE_COVER__;
			if (cover && typeof cover.remove === "function") cover.remove();
		} catch {}
		try {
			if (sessionStorage.getItem(SESSION_KEY)) return () => {};
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
				sessionStorage.setItem(SESSION_KEY, "1");
				return () => {};
			}
			sessionStorage.setItem(SESSION_KEY, "1");
		} catch {}
		const overlay = document.createElement("div");
		overlay.id = "dsh-futuristic-style-boot";
		overlay.setAttribute("role", "dialog");
		overlay.setAttribute("aria-modal", "true");
		overlay.setAttribute("aria-label", "启动动画");
		const posterSources = assetCandidates(BOOT_POSTER_PATH);
		overlay.style.backgroundImage = posterSources.map((candidate) => `url("${candidate.replace(/"/g, "%22")}")`).join(",");
		overlay.style.backgroundSize = "cover";
		overlay.style.backgroundPosition = "center";
		const video = document.createElement("video");
		video.className = "dsh-fs-boot-video";
		video.src = preferredAsset(BOOT_VIDEO_PATH);
		video.poster = preferredAsset(BOOT_POSTER_PATH);
		video.muted = false;
		video.volume = .8;
		video.playsInline = true;
		video.preload = "auto";
		video.autoplay = true;
		video.setAttribute("playsinline", "");
		video.setAttribute("aria-hidden", "true");
		video.tabIndex = -1;
		const shade = document.createElement("div");
		shade.className = "dsh-fs-boot-shade";
		const brand = document.createElement("div");
		brand.className = "dsh-fs-boot-brand";
		const brandName = document.createElement("strong");
		brandName.textContent = "DEEPSEEK HARNESS";
		const brandTag = document.createElement("span");
		brandTag.textContent = "FUTURISTIC STYLE";
		brand.append(brandName, brandTag);
		const hint = document.createElement("div");
		hint.className = "dsh-fs-boot-hint";
		hint.textContent = "冷启动 · 10 秒";
		const progress = document.createElement("div");
		progress.className = "dsh-fs-boot-progress";
		const progressBar = document.createElement("i");
		progress.appendChild(progressBar);
		const sound = document.createElement("button");
		sound.type = "button";
		sound.className = "dsh-fs-boot-sound";
		sound.textContent = "声音：开";
		sound.setAttribute("aria-pressed", "true");
		const skip = document.createElement("button");
		skip.type = "button";
		skip.className = "dsh-fs-boot-skip";
		skip.textContent = "跳过";
		overlay.append(video, shade, brand, hint, progress, sound, skip);
		(document.body || document.documentElement).appendChild(overlay);
		document.documentElement.classList.add("dsh-fs-booting");
		let finished = false;
		let videoFallbackStarted = false;
		let failTimer = 0;
		let hideTimer = 0;
		const setSound = (muted) => {
			video.muted = muted;
			sound.textContent = muted ? "声音：关" : "声音：开";
			sound.setAttribute("aria-pressed", String(!muted));
		};
		const finish = (immediate = false) => {
			if (finished) return;
			finished = true;
			window.clearTimeout(failTimer);
			window.clearTimeout(hideTimer);
			window.removeEventListener("keydown", onKeyDown);
			video.pause();
			if (!immediate) document.documentElement.classList.add("dsh-fs-revealing");
			overlay.classList.add("is-leaving");
			hideTimer = window.setTimeout(() => {
				overlay.remove();
				video.removeAttribute("src");
				video.load();
				document.documentElement.classList.remove("dsh-fs-booting", "dsh-fs-revealing");
			}, immediate ? 0 : REVEAL_MS);
		};
		const useVideoFallback = () => {
			if (videoFallbackStarted) return false;
			const fallback = fallbackAsset(BOOT_VIDEO_PATH);
			if (!fallback) return false;
			videoFallbackStarted = true;
			video.src = fallback;
			video.load();
			video.play().catch(() => finish(true));
			return true;
		};
		const onKeyDown = (event) => {
			if (event.key === "Escape") finish();
		};
		window.addEventListener("keydown", onKeyDown);
		skip.addEventListener("click", () => finish());
		sound.addEventListener("click", () => {
			if (video.muted) {
				setSound(false);
				video.play().catch(() => setSound(true));
			} else setSound(true);
		});
		video.addEventListener("error", () => {
			if (!useVideoFallback()) finish(true);
		});
		video.addEventListener("timeupdate", () => {
			const duration = video.duration;
			if (Number.isFinite(duration) && duration > 0) progressBar.style.width = `${Math.min(100, video.currentTime / duration * 100)}%`;
		});
		video.addEventListener("ended", () => {
			window.setTimeout(() => finish(), 260);
		});
		video.addEventListener("loadedmetadata", () => {
			window.clearTimeout(failTimer);
			const duration = Number.isFinite(video.duration) ? video.duration : 10;
			failTimer = window.setTimeout(() => finish(true), Math.max(12e3, duration * 1e3 + 2500));
		});
		failTimer = window.setTimeout(() => finish(true), 15e3);
		const start = async () => {
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
		start();
		return () => {
			if (!finished) finish(true);
		};
	}
	// src/client/settings.ts
	function make(tag, className, text) {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (text !== void 0) node.textContent = text;
		return node;
	}
	function installSettings() {
		let open = false;
		let busy = false;
		let status = "";
		let error = false;
		let settings = { ...getCurrentPublicConfig().settings };
		let posterUrl = getCurrentPublicConfig().posterUrl;
		const container = make("div");
		container.id = "dsh-futuristic-style-settings-root";
		const gear = make("button", void 0, "⚙");
		gear.id = "dsh-futuristic-style-gear";
		gear.type = "button";
		gear.title = "聊天背景设置";
		gear.setAttribute("aria-label", "聊天背景设置");
		gear.setAttribute("aria-expanded", "false");
		const panel = make("div");
		panel.id = "dsh-futuristic-style-panel";
		panel.setAttribute("role", "dialog");
		panel.setAttribute("aria-label", "聊天背景设置");
		panel.hidden = true;
		const head = make("div", "dsh-fs-head");
		const title = make("div");
		title.append(make("strong", void 0, "聊天背景"), make("small", void 0, "dsh-futuristic-style · 内置循环视频"));
		const closeButton = make("button", "dsh-fs-close", "×");
		closeButton.type = "button";
		closeButton.setAttribute("aria-label", "关闭");
		head.append(title, closeButton);
		const enabledRow = make("div", "dsh-fs-row");
		const toggle = make("button", "dsh-fs-toggle");
		toggle.type = "button";
		enabledRow.append(make("span", "dsh-fs-label", "显示聊天背景"), toggle);
		const card = make("div", "dsh-fs-video-card");
		const preview = make("img");
		preview.alt = "";
		card.append(preview, make("span", void 0, "内置循环视频 · 47s"));
		const sliderRow = make("div", "dsh-fs-row dsh-fs-slider-row");
		const slider = make("input", "dsh-fs-slider");
		slider.type = "range";
		slider.min = "0";
		slider.max = "0.8";
		slider.step = "0.01";
		slider.setAttribute("aria-label", "遮罩强度");
		const sliderValue = make("span", "dsh-fs-value");
		sliderRow.append(make("span", "dsh-fs-label", "遮罩强度"), slider, sliderValue);
		const statusLine = make("div", "dsh-fs-status");
		const actions = make("div", "dsh-fs-actions");
		const cancelButton = make("button", "dsh-fs-ghost", "取消");
		cancelButton.type = "button";
		const saveButton = make("button", "dsh-fs-primary", "保存");
		saveButton.type = "button";
		actions.append(cancelButton, saveButton);
		panel.append(head, enabledRow, card, sliderRow, statusLine, actions);
		container.append(gear, panel);
		function renderPreview() {
			const candidates = assetCandidates(posterUrl);
			preview.onerror = () => {
				preview.onerror = null;
				if (candidates[1]) preview.src = candidates[1];
			};
			preview.src = candidates[0] ?? posterUrl;
		}
		function render() {
			panel.hidden = !open;
			gear.setAttribute("aria-expanded", String(open));
			toggle.textContent = settings.enabled ? "开" : "关";
			toggle.className = `dsh-fs-toggle${settings.enabled ? " is-on" : ""}`;
			toggle.setAttribute("aria-pressed", String(settings.enabled));
			slider.value = String(settings.overlay);
			sliderValue.textContent = `${Math.round(settings.overlay * 100)}%`;
			statusLine.textContent = status;
			statusLine.className = `dsh-fs-status${error ? " is-error" : status === "已保存" ? " is-ok" : ""}`;
			saveButton.disabled = busy;
			saveButton.textContent = busy ? "保存中…" : "保存";
			renderPreview();
		}
		function update(patch) {
			settings = {
				...settings,
				...patch
			};
			status = "";
			error = false;
			render();
		}
		async function load() {
			status = "读取配置…";
			error = false;
			render();
			const config = await fetchPublicConfig();
			if (!open) return;
			settings = { ...config.settings };
			posterUrl = config.posterUrl;
			applyPublicConfig(config);
			status = "";
			render();
		}
		function close() {
			settings = { ...getCurrentPublicConfig().settings };
			status = "";
			error = false;
			open = false;
			render();
		}
		async function save() {
			busy = true;
			status = "保存中…";
			error = false;
			render();
			try {
				const config = await saveBackgroundSettings(settings);
				applyPublicConfig(config);
				settings = { ...config.settings };
				posterUrl = config.posterUrl;
				status = "已保存";
			} catch (caught) {
				status = caught instanceof Error ? caught.message : String(caught);
				error = true;
			} finally {
				busy = false;
				render();
			}
		}
		const onKeyDown = (event) => {
			if (event.key === "Escape" && open) close();
		};
		gear.addEventListener("click", () => {
			open = !open;
			if (open) load();
			else close();
		});
		closeButton.addEventListener("click", close);
		cancelButton.addEventListener("click", close);
		saveButton.addEventListener("click", () => {
			save();
		});
		toggle.addEventListener("click", () => update({ enabled: !settings.enabled }));
		slider.addEventListener("input", () => update({ overlay: Number(slider.value) }));
		window.addEventListener("keydown", onKeyDown);
		(document.body || document.documentElement).appendChild(container);
		render();
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			container.remove();
		};
	}
	// src/client/styles.ts
	var STYLE_ID = "dsh-futuristic-style/main.css";
	var CLIENT_CSS = `
:root {
  --dsh-fs-cyan: #8fe8ff;
  --dsh-fs-blue: #2f8fe0;
  --dsh-fs-ink: #eaf7ff;
  --dsh-fs-muted: #9dc4d8;
  --dsh-fs-panel: rgba(6, 14, 28, 0.94);
  --dsh-fs-panel-soft: rgba(12, 26, 46, 0.72);
  --dsh-fs-border: rgba(127, 231, 255, 0.32);
  --dsh-fs-border-strong: rgba(127, 231, 255, 0.62);
  --dsh-fs-radius: 14px;
  --dsh-fs-radius-sm: 9px;
  --dsh-fs-ease: cubic-bezier(0.22, 0.8, 0.24, 1);
}

html.dsh-fs-bg-on,
html.dsh-fs-bg-on body,
html.dsh-fs-bg-on #root,
html.dsh-fs-bg-on body > div:not(#dsh-futuristic-style-bg):not(#dsh-futuristic-style-settings-root) {
  background-color: transparent !important;
  background-image: none !important;
}

html.dsh-fs-bg-on body {
  color: var(--dsh-fs-ink);
}

#dsh-futuristic-style-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: #030814;
}

#dsh-futuristic-style-bg .dsh-fs-poster,
#dsh-futuristic-style-bg .dsh-fs-video {
  position: absolute;
  inset: -2%;
  width: 104%;
  height: 104%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
}

#dsh-futuristic-style-bg .dsh-fs-poster {
  z-index: 0;
  filter: saturate(1.03);
}

#dsh-futuristic-style-bg .dsh-fs-video {
  z-index: 1;
  opacity: 0;
  transition: opacity 200ms var(--dsh-fs-ease);
}

#dsh-futuristic-style-bg.is-playing .dsh-fs-video {
  opacity: 1;
}

#dsh-futuristic-style-bg .dsh-fs-veil {
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    radial-gradient(ellipse at 50% 42%, rgba(3, 10, 24, 0) 28%, rgba(3, 10, 24, 0.36) 100%),
    linear-gradient(180deg, rgba(3, 10, 24, 0.04) 0%, rgba(3, 10, 24, 0.12) 58%, rgba(3, 10, 24, 0.4) 100%),
    rgba(3, 10, 24, var(--dsh-fs-overlay, 0.28));
}

html.dsh-fs-bg-on[data-dsh-fs-theme="light"] #dsh-futuristic-style-bg .dsh-fs-veil {
  background:
    radial-gradient(ellipse at 50% 42%, rgba(247, 252, 255, 0.04) 0%, rgba(247, 252, 255, 0.3) 100%),
    linear-gradient(180deg, rgba(247, 252, 255, 0.1) 0%, rgba(247, 252, 255, 0.2) 58%, rgba(247, 252, 255, 0.38) 100%),
    rgba(247, 252, 255, calc(var(--dsh-fs-overlay, 0.28) * 0.6));
}

html.dsh-fs-bg-on[data-dsh-fs-theme="light"] #root [class$="_frame"] {
  background-color: rgba(247, 252, 255, 0.06) !important;
}

html.dsh-fs-bg-on[data-dsh-fs-theme="light"] #root [class$="_root"] {
  background-color: transparent !important;
}

html.dsh-fs-bg-on[data-dsh-fs-theme="light"] #root [class*="emptyTabHost"] {
  background-color: rgba(247, 252, 255, 0.48) !important;
  backdrop-filter: blur(22px);
}

html.dsh-fs-bg-on[data-dsh-fs-theme="light"] [class*="sidebar"] {
  background-color: rgba(247, 252, 255, 0.72) !important;
  backdrop-filter: blur(14px);
}

html.dsh-fs-bg-on[data-dsh-fs-theme="light"] [class*="header"],
html.dsh-fs-bg-on[data-dsh-fs-theme="light"] [class*="composer"] {
  background-color: rgba(247, 252, 255, 0.55) !important;
  backdrop-filter: blur(14px);
}

html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] #root,
html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] #root div,
html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] body::before,
html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] body::after,
html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] #root::before,
html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] #root::after {
  background-color: transparent !important;
  background-image: none !important;
}

html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] #root [class*="sidebar"],
html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] #root [class*="header"],
html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] #root [class*="workspace"] {
  background-color: rgba(3, 10, 24, 0.55) !important;
  backdrop-filter: blur(14px);
}

html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] #root [class*="composerStack"],
html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] #root [class*="composer"] {
  background-color: rgba(4, 12, 26, 0.38) !important;
  border: 1px solid rgba(127, 231, 255, 0.16);
  border-radius: 16px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(18px);
}

html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] #root [class*="composer"] [class*="card"],
html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] #root [class*="composer"] [class*="input"],
html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] #root [class*="composer"] [class*="scroll"],
html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] #root [class*="composer"] form {
  background-color: transparent !important;
  background-image: none !important;
}

html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] [data-menu-material],
html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] #root [data-menu-material],
html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] [role="menu"] {
  background-color: rgba(6, 14, 28, 0.97) !important;
  border: 1px solid rgba(127, 231, 255, 0.18);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(20px);
  z-index: 2147482500 !important;
}

html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] [data-menu-material] > [class*="_material_"],
html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] [role="menu"] > [class*="_material_"],
html.dsh-fs-bg-on[data-dsh-fs-theme="dark"] [role="menu"] [class*="_material_"] {
  background-color: transparent !important;
  background-image: none !important;
}

#dsh-futuristic-style-boot {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  overflow: hidden;
  background: #02060f;
  opacity: 1;
  transition: opacity 1200ms var(--dsh-fs-ease);
}

#dsh-futuristic-style-boot.is-leaving {
  opacity: 0;
}

#dsh-futuristic-style-boot .dsh-fs-boot-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #02060f;
  transition: transform 1200ms var(--dsh-fs-ease);
}

#dsh-futuristic-style-boot.is-leaving .dsh-fs-boot-video {
  transform: scale(1.025);
}

html.dsh-fs-revealing #root {
  animation: dsh-fs-ui-reveal 1200ms var(--dsh-fs-ease) both;
}

html.dsh-fs-revealing #dsh-futuristic-style-bg {
  animation: dsh-fs-bg-reveal 1200ms var(--dsh-fs-ease) both;
}

html.dsh-fs-revealing #dsh-futuristic-style-settings-root {
  animation: dsh-fs-fade-in 1200ms var(--dsh-fs-ease) both;
}

@keyframes dsh-fs-ui-reveal {
  0% {
    opacity: 0.35;
    transform: scale(1.012);
    filter: blur(7px);
  }
  55% {
    opacity: 0.92;
    filter: blur(1.5px);
  }
  100% {
    opacity: 1;
    transform: none;
    filter: none;
  }
}

@keyframes dsh-fs-bg-reveal {
  0% {
    opacity: 0.55;
    transform: scale(1.025);
  }
  100% {
    opacity: 1;
    transform: none;
  }
}

@keyframes dsh-fs-fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

#dsh-futuristic-style-boot .dsh-fs-boot-shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(2, 6, 15, 0.28) 0%, rgba(2, 6, 15, 0) 32%, rgba(2, 6, 15, 0) 62%, rgba(2, 6, 15, 0.5) 100%),
    radial-gradient(ellipse at 50% 55%, rgba(2, 6, 15, 0) 45%, rgba(2, 6, 15, 0.28) 100%);
}

#dsh-futuristic-style-boot .dsh-fs-boot-brand {
  position: absolute;
  left: 28px;
  top: 24px;
  color: #ffffff;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.55);
  font: 12px/1.2 "Segoe UI", "Microsoft YaHei", sans-serif;
  letter-spacing: 0.24em;
  pointer-events: none;
}

#dsh-futuristic-style-boot .dsh-fs-boot-brand strong {
  display: block;
  font-size: 12px;
  font-weight: 600;
}

#dsh-futuristic-style-boot .dsh-fs-boot-brand span {
  display: block;
  margin-top: 4px;
  color: rgba(235, 250, 255, 0.7);
  font-size: 9px;
  letter-spacing: 0.2em;
}

#dsh-futuristic-style-boot .dsh-fs-boot-hint {
  position: absolute;
  left: 28px;
  bottom: 28px;
  color: rgba(235, 250, 255, 0.7);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
  font: 10px/1.3 "Segoe UI", "Microsoft YaHei", sans-serif;
  letter-spacing: 0.16em;
  pointer-events: none;
}

#dsh-futuristic-style-boot .dsh-fs-boot-progress {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.16);
}

#dsh-futuristic-style-boot .dsh-fs-boot-progress i {
  display: block;
  width: 0;
  height: 100%;
  background: linear-gradient(90deg, #8fe8ff, #ffffff);
  box-shadow: 0 0 12px rgba(143, 232, 255, 0.8);
  transition: width 120ms linear;
}

#dsh-futuristic-style-boot .dsh-fs-boot-skip,
#dsh-futuristic-style-boot .dsh-fs-boot-sound {
  position: absolute;
  bottom: 22px;
  z-index: 2;
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 999px;
  background: rgba(2, 8, 18, 0.58);
  color: #f2fbff;
  font: 12px/1.2 "Segoe UI", "Microsoft YaHei", sans-serif;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: border-color 140ms var(--dsh-fs-ease), background-color 140ms var(--dsh-fs-ease);
}

#dsh-futuristic-style-boot .dsh-fs-boot-skip {
  right: 22px;
}

#dsh-futuristic-style-boot .dsh-fs-boot-sound {
  right: 104px;
}

#dsh-futuristic-style-boot .dsh-fs-boot-skip:hover,
#dsh-futuristic-style-boot .dsh-fs-boot-sound:hover {
  border-color: rgba(255, 255, 255, 0.68);
  background: rgba(2, 8, 18, 0.78);
}

#dsh-futuristic-style-boot .dsh-fs-boot-skip:focus-visible,
#dsh-futuristic-style-boot .dsh-fs-boot-sound:focus-visible {
  outline: 2px solid #8fe8ff;
  outline-offset: 3px;
}

#dsh-futuristic-style-settings-root {
  position: relative;
  z-index: 2147483000;
}

#dsh-futuristic-style-gear {
  position: fixed;
  right: 16px;
  bottom: 92px;
  z-index: 2147483000;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid var(--dsh-fs-border);
  border-radius: 50%;
  background: var(--dsh-fs-panel);
  color: var(--dsh-fs-cyan);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  font: 17px/1 "Segoe UI", "Microsoft YaHei", sans-serif;
  cursor: pointer;
  transition: border-color 140ms var(--dsh-fs-ease), transform 140ms var(--dsh-fs-ease);
  backdrop-filter: blur(12px);
}

#dsh-futuristic-style-gear:hover {
  border-color: var(--dsh-fs-border-strong);
  transform: translateY(-1px);
}

#dsh-futuristic-style-gear:focus-visible {
  outline: 2px solid var(--dsh-fs-cyan);
  outline-offset: 3px;
}

#dsh-futuristic-style-panel {
  position: fixed;
  right: 16px;
  bottom: 136px;
  z-index: 2147483001;
  width: min(340px, calc(100vw - 32px));
  max-height: calc(100vh - 180px);
  overflow: auto;
  box-sizing: border-box;
  padding: 16px;
  border: 1px solid var(--dsh-fs-border);
  border-radius: var(--dsh-fs-radius);
  background: var(--dsh-fs-panel);
  color: var(--dsh-fs-ink);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(18px);
  font: 13px/1.45 "Segoe UI", "Microsoft YaHei", sans-serif;
}

#dsh-futuristic-style-panel * {
  box-sizing: border-box;
}

#dsh-futuristic-style-panel .dsh-fs-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

#dsh-futuristic-style-panel .dsh-fs-head strong {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

#dsh-futuristic-style-panel .dsh-fs-head small {
  display: block;
  margin-top: 2px;
  color: var(--dsh-fs-muted);
  font-size: 11px;
  font-weight: 400;
}

#dsh-futuristic-style-panel .dsh-fs-close {
  width: 26px;
  height: 26px;
  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  color: var(--dsh-fs-muted);
  font: 18px/1 "Segoe UI", sans-serif;
  cursor: pointer;
}

#dsh-futuristic-style-panel .dsh-fs-close:hover {
  border-color: var(--dsh-fs-border);
  color: var(--dsh-fs-ink);
}

#dsh-futuristic-style-panel .dsh-fs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 10px 0;
}

#dsh-futuristic-style-panel .dsh-fs-label {
  color: var(--dsh-fs-muted);
  font-size: 12px;
}

#dsh-futuristic-style-panel .dsh-fs-value {
  min-width: 36px;
  color: var(--dsh-fs-cyan);
  font-size: 11px;
  text-align: right;
}

#dsh-futuristic-style-panel .dsh-fs-toggle {
  min-width: 46px;
  padding: 5px 10px;
  border: 1px solid var(--dsh-fs-border);
  border-radius: 999px;
  background: transparent;
  color: var(--dsh-fs-muted);
  font: inherit;
  cursor: pointer;
}

#dsh-futuristic-style-panel .dsh-fs-toggle.is-on {
  border-color: rgba(127, 231, 255, 0.7);
  background: rgba(47, 143, 224, 0.22);
  color: var(--dsh-fs-cyan);
}

#dsh-futuristic-style-panel .dsh-fs-video-card {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  margin: 12px 0;
  border: 1px solid var(--dsh-fs-border);
  border-radius: var(--dsh-fs-radius-sm);
  background: #061426;
}

#dsh-futuristic-style-panel .dsh-fs-video-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

#dsh-futuristic-style-panel .dsh-fs-video-card span {
  position: absolute;
  inset: auto 0 0 0;
  padding: 6px 8px;
  background: linear-gradient(180deg, transparent, rgba(2, 7, 16, 0.88));
  color: var(--dsh-fs-ink);
  font-size: 10px;
  line-height: 1.2;
}

#dsh-futuristic-style-panel .dsh-fs-slider-row {
  gap: 12px;
}

#dsh-futuristic-style-panel .dsh-fs-slider {
  flex: 1;
  min-width: 0;
  accent-color: var(--dsh-fs-blue);
}

#dsh-futuristic-style-panel .dsh-fs-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

#dsh-futuristic-style-panel .dsh-fs-primary,
#dsh-futuristic-style-panel .dsh-fs-ghost {
  padding: 8px 12px;
  border-radius: var(--dsh-fs-radius-sm);
  font: inherit;
  cursor: pointer;
}

#dsh-futuristic-style-panel .dsh-fs-primary {
  border: 1px solid rgba(143, 232, 255, 0.7);
  background: rgba(47, 143, 224, 0.3);
  color: var(--dsh-fs-ink);
}

#dsh-futuristic-style-panel .dsh-fs-primary:disabled {
  cursor: wait;
  opacity: 0.6;
}

#dsh-futuristic-style-panel .dsh-fs-ghost {
  border: 1px solid var(--dsh-fs-border);
  background: transparent;
  color: var(--dsh-fs-muted);
}

#dsh-futuristic-style-panel .dsh-fs-status {
  min-height: 18px;
  margin-top: 8px;
  color: var(--dsh-fs-muted);
  font-size: 11px;
}

#dsh-futuristic-style-panel .dsh-fs-status.is-error {
  color: #ffb3c1;
}

#dsh-futuristic-style-panel .dsh-fs-status.is-ok {
  color: var(--dsh-fs-cyan);
}

#dsh-futuristic-style-panel .dsh-fs-toggle:focus-visible,
#dsh-futuristic-style-panel .dsh-fs-primary:focus-visible,
#dsh-futuristic-style-panel .dsh-fs-ghost:focus-visible,
#dsh-futuristic-style-panel .dsh-fs-close:focus-visible {
  outline: 2px solid var(--dsh-fs-cyan);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  #dsh-futuristic-style-boot,
  #dsh-futuristic-style-gear,
  #dsh-futuristic-style-panel,
  #dsh-futuristic-style-panel * {
    transition: none !important;
    animation: none !important;
  }

  html.dsh-fs-revealing #root,
  html.dsh-fs-revealing #dsh-futuristic-style-bg,
  html.dsh-fs-revealing #dsh-futuristic-style-settings-root {
    animation: none !important;
  }
}

@media (max-width: 480px) {
  #dsh-futuristic-style-panel {
    right: 10px;
    bottom: 126px;
    width: calc(100vw - 20px);
  }

  #dsh-futuristic-style-gear {
    right: 10px;
    bottom: 82px;
  }
}
`;
	function ensureClientStyle() {
		if (document.querySelector(`style[data-plugin-css="dsh-futuristic-style/main.css"]`)) return;
		const style = document.createElement("style");
		style.dataset.pluginCss = STYLE_ID;
		style.textContent = CLIENT_CSS;
		(document.head || document.documentElement).appendChild(style);
	}
	// src/client/index.ts
	var PLUGIN_ID = "dsh-futuristic-style";
	window.__ModuleLoader__?.load({
		id: PLUGIN_ID,
		factory: () => {
			function apply(ctx) {
				ensureClientStyle();
				let disposeBoot = () => {};
				try {
					disposeBoot = installBootAnimation();
				} catch (error) {
					console.warn("[dsh-futuristic-style] 启动动画加载失败：", error);
				}
				const disposeBackground = installBackground();
				let disposeSettings = () => {};
				try {
					disposeSettings = installSettings();
				} catch (error) {
					console.warn("[dsh-futuristic-style] 设置面板加载失败：", error);
				}
				const dispose = () => {
					disposeSettings();
					disposeBackground();
					disposeBoot();
				};
				if (typeof ctx?.effect === "function") ctx.effect(() => dispose, "dsh-futuristic-style: ui");
			}
			return {
				name: PLUGIN_ID,
				inject: [],
				apply
			};
		}
	});
})();
