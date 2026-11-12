import { type BackgroundSettings } from '../shared/config';
import { assetCandidates } from './assets';
import { fetchPublicConfig, saveBackgroundSettings } from './api';
import { applyPublicConfig, getCurrentPublicConfig } from './background';

function make<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function installSettings(): () => void {
  let open = false;
  let busy = false;
  let status = '';
  let error = false;
  let settings: BackgroundSettings = { ...getCurrentPublicConfig().settings };
  let posterUrl = getCurrentPublicConfig().posterUrl;

  const container = make('div');
  container.id = 'dsh-futuristic-style-settings-root';

  const gear = make('button', undefined, '⚙');
  gear.id = 'dsh-futuristic-style-gear';
  gear.type = 'button';
  gear.title = '聊天背景设置';
  gear.setAttribute('aria-label', '聊天背景设置');
  gear.setAttribute('aria-expanded', 'false');

  const panel = make('div');
  panel.id = 'dsh-futuristic-style-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', '聊天背景设置');
  panel.hidden = true;

  const head = make('div', 'dsh-fs-head');
  const title = make('div');
  title.append(make('strong', undefined, '聊天背景'), make('small', undefined, 'dsh-futuristic-style · 内置循环视频'));
  const closeButton = make('button', 'dsh-fs-close', '×');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', '关闭');
  head.append(title, closeButton);

  const enabledRow = make('div', 'dsh-fs-row');
  const toggle = make('button', 'dsh-fs-toggle');
  toggle.type = 'button';
  enabledRow.append(make('span', 'dsh-fs-label', '显示聊天背景'), toggle);

  const card = make('div', 'dsh-fs-video-card');
  const preview = make('img');
  preview.alt = '';
  card.append(preview, make('span', undefined, '内置循环视频 · 47s'));

  const sliderRow = make('div', 'dsh-fs-row dsh-fs-slider-row');
  const slider = make('input', 'dsh-fs-slider');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '0.8';
  slider.step = '0.01';
  slider.setAttribute('aria-label', '遮罩强度');
  const sliderValue = make('span', 'dsh-fs-value');
  sliderRow.append(make('span', 'dsh-fs-label', '遮罩强度'), slider, sliderValue);

  const statusLine = make('div', 'dsh-fs-status');
  const actions = make('div', 'dsh-fs-actions');
  const cancelButton = make('button', 'dsh-fs-ghost', '取消');
  cancelButton.type = 'button';
  const saveButton = make('button', 'dsh-fs-primary', '保存');
  saveButton.type = 'button';
  actions.append(cancelButton, saveButton);

  panel.append(head, enabledRow, card, sliderRow, statusLine, actions);
  container.append(gear, panel);

  function renderPreview(): void {
    const candidates = assetCandidates(posterUrl);
    preview.onerror = () => {
      preview.onerror = null;
      if (candidates[1]) preview.src = candidates[1];
    };
    preview.src = candidates[0] ?? posterUrl;
  }

  function render(): void {
    panel.hidden = !open;
    gear.setAttribute('aria-expanded', String(open));
    toggle.textContent = settings.enabled ? '开' : '关';
    toggle.className = `dsh-fs-toggle${settings.enabled ? ' is-on' : ''}`;
    toggle.setAttribute('aria-pressed', String(settings.enabled));
    slider.value = String(settings.overlay);
    sliderValue.textContent = `${Math.round(settings.overlay * 100)}%`;
    statusLine.textContent = status;
    statusLine.className = `dsh-fs-status${error ? ' is-error' : status === '已保存' ? ' is-ok' : ''}`;
    saveButton.disabled = busy;
    saveButton.textContent = busy ? '保存中…' : '保存';
    renderPreview();
  }

  function update(patch: Partial<BackgroundSettings>): void {
    settings = { ...settings, ...patch };
    status = '';
    error = false;
    render();
  }

  async function load(): Promise<void> {
    status = '读取配置…';
    error = false;
    render();
    const config = await fetchPublicConfig();
    if (!open) return;
    settings = { ...config.settings };
    posterUrl = config.posterUrl;
    applyPublicConfig(config);
    status = '';
    render();
  }

  function close(): void {
    settings = { ...getCurrentPublicConfig().settings };
    status = '';
    error = false;
    open = false;
    render();
  }

  async function save(): Promise<void> {
    busy = true;
    status = '保存中…';
    error = false;
    render();
    try {
      const config = await saveBackgroundSettings(settings);
      applyPublicConfig(config);
      settings = { ...config.settings };
      posterUrl = config.posterUrl;
      status = '已保存';
    } catch (caught) {
      status = caught instanceof Error ? caught.message : String(caught);
      error = true;
    } finally {
      busy = false;
      render();
    }
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && open) close();
  };
  gear.addEventListener('click', () => {
    open = !open;
    if (open) void load();
    else close();
  });
  closeButton.addEventListener('click', close);
  cancelButton.addEventListener('click', close);
  saveButton.addEventListener('click', () => {
    void save();
  });
  toggle.addEventListener('click', () => update({ enabled: !settings.enabled }));
  slider.addEventListener('input', () => update({ overlay: Number(slider.value) }));
  window.addEventListener('keydown', onKeyDown);

  (document.body || document.documentElement).appendChild(container);
  render();

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    container.remove();
  };
}
