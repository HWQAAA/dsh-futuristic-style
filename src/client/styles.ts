export const STYLE_ID = 'dsh-futuristic-style/main.css';

export const CLIENT_CSS = `
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

export function ensureClientStyle(): void {
  if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`)) return;
  const style = document.createElement('style');
  style.dataset.pluginCss = STYLE_ID;
  style.textContent = CLIENT_CSS;
  (document.head || document.documentElement).appendChild(style);
}
