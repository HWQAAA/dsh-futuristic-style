import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { apply } from './index';

interface Route {
  path: string;
  handler: (req: any, res: any) => unknown;
}

let previousHome: string | undefined;
let home: string;

beforeEach(() => {
  previousHome = process.env.DSH_HOME;
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-futuristic-style-'));
  process.env.DSH_HOME = home;
});

afterEach(() => {
  if (previousHome === undefined) delete process.env.DSH_HOME;
  else process.env.DSH_HOME = previousHome;
  fs.rmSync(home, { recursive: true, force: true });
});

function boot(): Map<string, Route> {
  const routes = new Map<string, Route>();
  const ctx = {
    get(name: string) {
      if (name !== 'webServer') return undefined;
      return {
        register(route: Route) {
          routes.set(route.path, route);
        },
      };
    },
    effect(setup: () => unknown) {
      setup();
    },
    logger: { info() {}, warn() {} },
  };
  apply(ctx);
  return routes;
}

interface RawResponse {
  status: number;
  headers: Record<string, string>;
  body: Buffer;
}

function request(
  route: Route,
  method: string,
  options: { body?: unknown; headers?: Record<string, string> } = {},
): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const req = Readable.from(
      options.body === undefined ? [] : [Buffer.from(JSON.stringify(options.body))],
    ) as any;
    req.method = method;
    req.url = route.path;
    req.headers = options.headers ?? {};

    const res = new PassThrough() as any;
    res.statusCode = 0;
    res.headers = {};
    res.setHeader = (name: string, value: unknown) => {
      res.headers[name.toLowerCase()] = String(value);
    };
    res.writeHead = (status: number, headers?: Record<string, unknown>) => {
      res.statusCode = status;
      for (const [name, value] of Object.entries(headers ?? {})) {
        res.headers[name.toLowerCase()] = String(value);
      }
      return res;
    };

    const chunks: Buffer[] = [];
    res.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    res.on('end', () => {
      resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks),
      });
    });
    res.on('error', reject);
    Promise.resolve(route.handler(req, res)).catch(reject);
  });
}

function json(response: RawResponse): any {
  return JSON.parse(response.body.toString('utf8'));
}

describe('host config and assets', () => {
  it('serves one-background config and persists settings', async () => {
    const routes = boot();
    const configRoute = routes.get('/dsh-futuristic-style/config');
    expect(configRoute).toBeTruthy();
    if (!configRoute) return;

    let result = await request(configRoute, 'GET');
    expect(result.status).toBe(200);
    expect(json(result).settings).toEqual({ enabled: true, overlay: 0.28 });
    expect(json(result).videoUrl).toBe('/dsh-futuristic-style/backgrounds/loop.mp4');
    expect(json(result).posterUrl).toBe('/dsh-futuristic-style/backgrounds/poster.png');
    expect(json(result).bootVideoUrl).toBe('/dsh-futuristic-style/boot/cold-start.mp4');
    expect(json(result).bootPosterUrl).toBe('/dsh-futuristic-style/boot/poster.png');
    expect(
      fs.existsSync(path.join(home, 'dsh-futuristic-style', 'config.json')),
    ).toBe(true);

    result = await request(configRoute, 'PUT', {
      body: { settings: { background: { enabled: false, overlay: 2 } } },
    });
    expect(result.status).toBe(200);
    expect(json(result).settings.enabled).toBe(false);
    expect(json(result).settings.overlay).toBe(0.8);

    result = await request(configRoute, 'DELETE');
    expect(result.status).toBe(405);
    expect(json(result).ok).toBe(false);
  });

  it('serves the video with Range and the poster as an image', async () => {
    const routes = boot();
    const videoRoute = routes.get('/dsh-futuristic-style/backgrounds/loop.mp4');
    const posterRoute = routes.get('/dsh-futuristic-style/backgrounds/poster.png');
    const bootVideoRoute = routes.get('/dsh-futuristic-style/boot/cold-start.mp4');
    const bootPosterRoute = routes.get('/dsh-futuristic-style/boot/poster.png');
    expect(videoRoute).toBeTruthy();
    expect(posterRoute).toBeTruthy();
    expect(bootVideoRoute).toBeTruthy();
    expect(bootPosterRoute).toBeTruthy();
    if (!videoRoute || !posterRoute || !bootVideoRoute || !bootPosterRoute) {
      return;
    }

    const video = await request(videoRoute, 'GET', {
      headers: { range: 'bytes=0-1023' },
    });
    expect(video.status).toBe(206);
    expect(video.headers['content-type']).toBe('video/mp4');
    expect(video.headers['content-range']).toMatch(/^bytes 0-1023\/\d+$/);
    expect(video.headers['content-length']).toBe('1024');
    expect(video.body.length).toBe(1024);

    const poster = await request(posterRoute, 'GET');
    expect(poster.status).toBe(200);
    expect(poster.headers['content-type']).toBe('image/png');
    expect(poster.body.length).toBeGreaterThan(1000);

    const bootVideo = await request(bootVideoRoute, 'GET', {
      headers: { range: 'bytes=0-1023' },
    });
    expect(bootVideo.status).toBe(206);
    expect(bootVideo.headers['content-type']).toBe('video/mp4');
    expect(bootVideo.body.length).toBe(1024);

    const bootPoster = await request(bootPosterRoute, 'GET');
    expect(bootPoster.status).toBe(200);
    expect(bootPoster.headers['content-type']).toBe('image/png');
    expect(bootPoster.body.length).toBeGreaterThan(1000);
  });

  it('injects an early boot cover into index html', () => {
    const taps: Array<(html: string) => string> = [];
    const ctx = {
      get(name: string) {
        if (name !== 'webServer') return undefined;
        return {
          register() {},
          tapIndex(inject: (html: string) => string) {
            taps.push(inject);
          },
        };
      },
      effect(setup: () => unknown) {
        setup();
      },
      logger: { info() {}, warn() {} },
    };
    apply(ctx);
    expect(taps.length).toBeGreaterThan(0);
    const inject = taps[0];
    if (!inject) return;

    const html = '<html><head></head><body><div id="root"></div></body></html>';
    const output = inject(html);
    expect(output).toContain('id="dsh-futuristic-style-cover"');
    expect(output).toContain('DEEPSEEK HARNESS');
    expect(inject(output)).toBe(output);
  });
});
