import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_CONFIG, mergeBackgroundSettings, normalizeConfig, toPublicConfig, } from '../shared/config.js';
export const name = 'dsh-futuristic-style';
export const inject = ['webServer'];
const ROUTE_PREFIX = '/dsh-futuristic-style';
const CONFIG_ROUTE = `${ROUTE_PREFIX}/config`;
const VIDEO_ROUTE = `${ROUTE_PREFIX}/backgrounds/loop.mp4`;
const POSTER_ROUTE = `${ROUTE_PREFIX}/backgrounds/poster.png`;
const BOOT_VIDEO_ROUTE = `${ROUTE_PREFIX}/boot/cold-start.mp4`;
const BOOT_POSTER_ROUTE = `${ROUTE_PREFIX}/boot/poster.png`;
const BODY_LIMIT_BYTES = 64 * 1024;
const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BACKGROUND_DIR = path.join(PACKAGE_ROOT, 'assets', 'backgrounds');
const VIDEO_FILE = path.join(BACKGROUND_DIR, 'loop.mp4');
const POSTER_FILE = path.join(BACKGROUND_DIR, 'poster.png');
const BOOT_DIR = path.join(PACKAGE_ROOT, 'assets', 'boot');
const BOOT_VIDEO_FILE = path.join(BOOT_DIR, 'cold-start.mp4');
const BOOT_POSTER_FILE = path.join(BOOT_DIR, 'poster.png');
const BOOT_COVER_ID = 'dsh-futuristic-style-cover';
const BOOT_COVER_SESSION_KEY = 'dsh-futuristic-style.boot.v2';
const BOOT_COVER_HTML = `<div id="${BOOT_COVER_ID}"><div class="dsh-fs-cover-brand"><strong>DEEPSEEK HARNESS</strong><span>FUTURISTIC STYLE</span></div></div>`;
function coverCss(origin) {
    const absolute = origin
        ? `#${BOOT_COVER_ID}{background-image:url('/dsh-futuristic-style/boot/poster.png'),url('${origin}/dsh-futuristic-style/boot/poster.png');background-position:center,center;background-size:cover,cover;background-repeat:no-repeat,no-repeat;}`
        : '';
    return `
#${BOOT_COVER_ID}{position:fixed;inset:0;z-index:2147483646;display:block;background:#02060f url('/dsh-futuristic-style/boot/poster.png') center/cover no-repeat;pointer-events:auto;}
#${BOOT_COVER_ID}::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,6,15,.3) 0%,rgba(2,6,15,0) 35%,rgba(2,6,15,.5) 100%);}
#${BOOT_COVER_ID} .dsh-fs-cover-brand{position:absolute;left:28px;top:24px;z-index:1;color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.55);font:12px/1.2 "Segoe UI","Microsoft YaHei",sans-serif;letter-spacing:.24em;}
#${BOOT_COVER_ID} .dsh-fs-cover-brand strong{display:block;font-size:12px;font-weight:600;}
#${BOOT_COVER_ID} .dsh-fs-cover-brand span{display:block;margin-top:4px;color:rgba(235,250,255,.7);font-size:9px;letter-spacing:.2em;}
${absolute}
`;
}
function coverScript(origin) {
    return `(function(){window.__DSH_FUTURISTIC_STYLE_ORIGIN__=${JSON.stringify(origin)};var e=document.getElementById('${BOOT_COVER_ID}');if(!e)return;var hidden=false;try{hidden=!!sessionStorage.getItem('${BOOT_COVER_SESSION_KEY}')}catch(_){ }if(hidden){if(e.parentNode)e.parentNode.removeChild(e);return;}var t=setTimeout(function(){if(e.parentNode)e.parentNode.removeChild(e)},5000);window.__DSH_FUTURISTIC_STYLE_COVER__={remove:function(){clearTimeout(t);if(e.parentNode)e.parentNode.removeChild(e)}};})();`;
}
function serverOrigin(ws) {
    try {
        const direct = Number(ws?.port ?? NaN);
        const server = ws?.server ?? ws?.httpServer ?? ws?.listener;
        const address = server && typeof server.address === 'function' ? server.address() : undefined;
        const port = Number.isFinite(direct) && direct > 0 ? direct : Number(address?.port ?? NaN);
        return Number.isFinite(port) && port > 0 ? `http://127.0.0.1:${port}` : '';
    }
    catch {
        return '';
    }
}
function dshHome() {
    return process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
}
function pluginDir() {
    return path.join(dshHome(), 'dsh-futuristic-style');
}
function configPath() {
    return path.join(pluginDir(), 'config.json');
}
function loadConfig() {
    try {
        const raw = fs.readFileSync(configPath(), 'utf8');
        return normalizeConfig(JSON.parse(raw));
    }
    catch {
        return normalizeConfig(DEFAULT_CONFIG);
    }
}
function saveConfig(config) {
    const dir = pluginDir();
    fs.mkdirSync(dir, { recursive: true });
    const target = configPath();
    const temporary = `${target}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    fs.renameSync(temporary, target);
}
function sendJson(res, status, value) {
    const body = JSON.stringify(value);
    res.statusCode = status;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(body);
}
function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let total = 0;
        req.on('data', (chunk) => {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            total += buffer.length;
            if (total > BODY_LIMIT_BYTES) {
                reject(new Error('请求体过大'));
                req.destroy();
                return;
            }
            chunks.push(buffer);
        });
        req.on('end', () => {
            if (chunks.length === 0) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            }
            catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}
function asRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return undefined;
    return value;
}
function parseRange(value, total) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(value || '');
    if (!match)
        return null;
    const startRaw = match[1];
    const endRaw = match[2];
    let start;
    let end;
    if (startRaw === '') {
        const suffix = Number(endRaw);
        if (!Number.isFinite(suffix) || suffix <= 0)
            return null;
        start = Math.max(0, total - suffix);
        end = total - 1;
    }
    else {
        start = Number(startRaw);
        end = endRaw === '' ? total - 1 : Number(endRaw);
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= total)
        return null;
    return { start, end: Math.min(end, total - 1) };
}
function pipeFile(res, stream) {
    stream.on('error', () => {
        if (!res.headersSent)
            res.writeHead(500);
        res.end();
    });
    stream.pipe(res);
}
function serveAsset(req, res, filePath, contentType, cacheControl) {
    let size;
    try {
        size = fs.statSync(filePath).size;
    }
    catch {
        res.statusCode = 404;
        res.end('not found');
        return;
    }
    const range = parseRange(req.headers.range, size);
    if (range) {
        res.writeHead(206, {
            'content-type': contentType,
            'accept-ranges': 'bytes',
            'content-range': `bytes ${range.start}-${range.end}/${size}`,
            'content-length': range.end - range.start + 1,
            'cache-control': cacheControl,
        });
        if (req.method === 'HEAD') {
            res.end();
            return;
        }
        pipeFile(res, fs.createReadStream(filePath, { start: range.start, end: range.end }));
        return;
    }
    res.writeHead(200, {
        'content-type': contentType,
        'accept-ranges': 'bytes',
        'content-length': size,
        'cache-control': cacheControl,
    });
    if (req.method === 'HEAD') {
        res.end();
        return;
    }
    pipeFile(res, fs.createReadStream(filePath));
}
function isCoverRow(row) {
    if (!row)
        return false;
    if (row.kind === 'style' && typeof row.text === 'string') {
        return row.text.includes(`#${BOOT_COVER_ID}`);
    }
    if (row.kind === 'html' && typeof row.html === 'string') {
        return row.html.includes(BOOT_COVER_ID);
    }
    return false;
}
function injectCoverHtml(html, css, script) {
    if (!html || html.includes(BOOT_COVER_ID))
        return html;
    const head = `<style id="dsh-futuristic-style-cover-style">${css}</style>`;
    const body = `${BOOT_COVER_HTML}<script>${script}</script>`;
    let out = html;
    if (out.includes('</head>'))
        out = out.replace('</head>', `${head}</head>`);
    else
        out = head + out;
    if (out.includes('<body>'))
        out = out.replace('<body>', `<body>${body}`);
    else if (out.includes('</body>'))
        out = out.replace('</body>', `${body}</body>`);
    else
        out += body;
    return out;
}
function installBootCover(ctx, ws) {
    const origin = serverOrigin(ws);
    const css = coverCss(origin);
    const script = coverScript(origin);
    const contribute = (table) => {
        if (!Array.isArray(table))
            return;
        if (table.some(isCoverRow))
            return;
        table.push({ kind: 'style', text: css }, { kind: 'html', placement: 'body', html: BOOT_COVER_HTML }, { kind: 'script', placement: 'body', text: script });
    };
    if (typeof ctx?.inject === 'function') {
        try {
            ctx.inject(['webServer'], (webCtx) => {
                if (webCtx && typeof webCtx.on === 'function') {
                    webCtx.on('webserver/index-inject', contribute);
                }
            });
        }
        catch (error) {
            ctx?.logger?.warn?.(`[dsh-futuristic-style] 启动封面订阅失败：${String(error)}`);
        }
    }
    else if (typeof ctx?.on === 'function') {
        try {
            ctx.on('webserver/index-inject', contribute);
        }
        catch (error) {
            ctx?.logger?.warn?.(`[dsh-futuristic-style] 启动封面订阅失败：${String(error)}`);
        }
    }
    if (typeof ws?.tapIndex === 'function') {
        try {
            ws.tapIndex((html) => injectCoverHtml(html, css, script));
        }
        catch (error) {
            ctx?.logger?.warn?.(`[dsh-futuristic-style] 启动封面 tapIndex 失败：${String(error)}`);
        }
    }
}
export function apply(ctx) {
    let config = loadConfig();
    try {
        saveConfig(config);
    }
    catch (error) {
        ctx?.logger?.warn?.(`[dsh-futuristic-style] 配置写入失败：${String(error)}`);
    }
    const ws = (typeof ctx?.get === 'function' ? ctx.get('webServer') : undefined) || ctx?.webServer;
    if (!ws || typeof ws.register !== 'function') {
        ctx?.logger?.warn?.('[dsh-futuristic-style] webServer 不可用，背景路由未注册');
        return;
    }
    const register = (route) => {
        const run = () => {
            try {
                ws.register(route);
            }
            catch (error) {
                ctx?.logger?.warn?.(`[dsh-futuristic-style] 路由注册失败：${String(error)}`);
            }
        };
        if (typeof ctx?.effect === 'function') {
            ctx.effect(run, 'dsh-futuristic-style: routes');
        }
        else {
            run();
        }
    };
    register({
        kind: 'exact',
        path: CONFIG_ROUTE,
        handler: async (req, res) => {
            try {
                if (req.method === 'GET') {
                    sendJson(res, 200, { ok: true, origin: serverOrigin(ws), ...toPublicConfig(config) });
                    return;
                }
                if (req.method === 'PUT' || req.method === 'POST') {
                    const body = await readJsonBody(req);
                    const record = asRecord(body) ?? {};
                    const settings = asRecord(record.settings) ?? record;
                    const background = asRecord(settings.background) ?? settings;
                    config = mergeBackgroundSettings(config, background);
                    saveConfig(config);
                    sendJson(res, 200, { ok: true, origin: serverOrigin(ws), ...toPublicConfig(config) });
                    return;
                }
                sendJson(res, 405, { ok: false, error: '只支持 GET / PUT' });
            }
            catch (error) {
                sendJson(res, 400, {
                    ok: false,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        },
    });
    register({
        kind: 'exact',
        path: VIDEO_ROUTE,
        handler: (req, res) => {
            serveAsset(req, res, VIDEO_FILE, 'video/mp4', 'no-cache');
        },
    });
    register({
        kind: 'exact',
        path: POSTER_ROUTE,
        handler: (req, res) => {
            serveAsset(req, res, POSTER_FILE, 'image/png', 'public, max-age=3600');
        },
    });
    register({
        kind: 'exact',
        path: BOOT_VIDEO_ROUTE,
        handler: (req, res) => {
            serveAsset(req, res, BOOT_VIDEO_FILE, 'video/mp4', 'no-cache');
        },
    });
    register({
        kind: 'exact',
        path: BOOT_POSTER_ROUTE,
        handler: (req, res) => {
            serveAsset(req, res, BOOT_POSTER_FILE, 'image/png', 'public, max-age=3600');
        },
    });
    installBootCover(ctx, ws);
    ctx?.logger?.info?.(`[dsh-futuristic-style] host ready · enabled=${config.background.enabled} overlay=${config.background.overlay} origin=${serverOrigin(ws) || '(none)'}`);
}
const plugin = { name, inject, apply };
export default plugin;
