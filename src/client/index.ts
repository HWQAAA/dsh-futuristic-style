import { installBackground } from './background';
import { installBootAnimation } from './boot';
import { installSettings } from './settings';
import { ensureClientStyle } from './styles';

declare global {
  interface Window {
    __ModuleLoader__?: {
      load(info: {
        id: string;
        factory: (require: (id: string) => any) => any;
      }): void;
    };
  }
}

const PLUGIN_ID = 'dsh-futuristic-style';

window.__ModuleLoader__?.load({
  id: PLUGIN_ID,
  factory: () => {
    function apply(ctx: any): void {
      ensureClientStyle();
      let disposeBoot = (): void => {};
      try {
        disposeBoot = installBootAnimation();
      } catch (error) {
        console.warn('[dsh-futuristic-style] 启动动画加载失败：', error);
      }
      const disposeBackground = installBackground();
      let disposeSettings = (): void => {};
      try {
        disposeSettings = installSettings();
      } catch (error) {
        console.warn('[dsh-futuristic-style] 设置面板加载失败：', error);
      }
      const dispose = (): void => {
        disposeSettings();
        disposeBackground();
        disposeBoot();
      };
      if (typeof ctx?.effect === 'function') {
        ctx.effect(() => dispose, 'dsh-futuristic-style: ui');
      }
    }

    return { name: PLUGIN_ID, inject: [], apply };
  },
});
