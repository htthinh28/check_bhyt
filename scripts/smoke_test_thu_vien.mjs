/**
 * Smoke test Thư viện tra cứu.
 * Mặc định: kiểm tra bản static (public/thuvien) sau npm run thuvien:prepare.
 * Flask dev: THUVIEN_BASE_URL=http://127.0.0.1:5050 npm run qa:thuvien:flask
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const STATIC_ROOT = path.join(root, 'public', 'thuvien');

const baseUrl = String(process.env.THUVIEN_BASE_URL || 'static').replace(/\/$/, '');

const fail = (msg) => {
  console.error(`[qa:thuvien] FAIL: ${msg}`);
  process.exit(1);
};

const checkStatic = () => {
  console.log(`[qa:thuvien] Mode: static (${STATIC_ROOT})`);
  const manifestPath = path.join(STATIC_ROOT, 'api', 'manifest.json');
  if (!fs.existsSync(manifestPath)) fail('Thiếu public/thuvien/api/manifest.json — chạy npm run thuvien:prepare');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const tabs = Array.isArray(manifest?.tabs) ? manifest.tabs : [];
  if (tabs.length < 1) fail('manifest.tabs rỗng');
  console.log(`[qa:thuvien] manifest OK · ${tabs.length} tabs · version=${manifest?.version || '?'}`);

  const indexHtml = path.join(STATIC_ROOT, 'index.html');
  if (!fs.existsSync(indexHtml)) fail('Thiếu public/thuvien/index.html');
  console.log('[qa:thuvien] index.html OK');

  const duocthuHtml = path.join(STATIC_ROOT, 'duocthu', 'index.html');
  if (!fs.existsSync(duocthuHtml)) fail('Thiếu public/thuvien/duocthu/index.html');
  console.log('[qa:thuvien] duocthu/index.html OK');

  const statusPath = path.join(STATIC_ROOT, 'api', 'duocthu', 'status.json');
  if (!fs.existsSync(statusPath)) fail('Thiếu api/duocthu/status.json');
  console.log('[qa:thuvien] duocthu/status OK');

  const sampleTab = tabs[0];
  const dataPath = path.join(STATIC_ROOT, 'api', 'data', `${sampleTab}.json`);
  if (!fs.existsSync(dataPath)) fail(`Thiếu dataset ${sampleTab}.json`);
  const pack = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  if (!Array.isArray(pack?.rows) || pack.rows.length < 1) fail(`Dataset ${sampleTab} không có rows`);
  console.log(`[qa:thuvien] sample dataset "${sampleTab}" OK (${pack.rows.length} rows)`);

  const bootstrapPath = path.join(STATIC_ROOT, 'static', 'js', '_dvkt_bootstrap.js');
  if (!fs.existsSync(bootstrapPath)) fail('Thiếu _dvkt_bootstrap.js');
  const bootstrapText = fs.readFileSync(bootstrapPath, 'utf8');
  if (!bootstrapText.includes('/thuvien/api/manifest')) {
    fail('_dvkt_bootstrap.js chưa patch đường dẫn /thuvien/');
  }
  console.log('[qa:thuvien] path prefix /thuvien OK');
  console.log('[qa:thuvien] PASS');
};

const fetchProbe = async (pathSuffix, accept = 'application/json, */*') => {
  const url = `${baseUrl}${pathSuffix}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const r = await fetch(url, { headers: { Accept: accept }, signal: controller.signal });
    return { url, ok: r.ok, status: r.status };
  } catch (e) {
    return { url, ok: false, status: null, err: e?.name === 'AbortError' ? 'Timeout' : (e?.message || String(e)) };
  } finally {
    clearTimeout(timer);
  }
};

const checkFlask = async () => {
  console.log(`[qa:thuvien] Mode: flask (${baseUrl})`);
  const home = await fetchProbe('/', 'text/html, */*');
  if (!home.ok) fail(home.err || `GET / → HTTP ${home.status}`);
  console.log('[qa:thuvien] GET / OK');

  const duocthu = await fetchProbe('/duocthu', 'text/html, */*');
  if (!duocthu.ok) fail(duocthu.err || `GET /duocthu → HTTP ${duocthu.status}`);
  console.log('[qa:thuvien] GET /duocthu OK');

  const manifest = await fetchProbe('/api/manifest');
  if (!manifest.ok) fail(manifest.err || `GET /api/manifest → HTTP ${manifest.status}`);
  const manifestJson = await fetch(`${baseUrl}/api/manifest`).then((r) => r.json()).catch(() => ({}));
  const tabs = Array.isArray(manifestJson?.tabs) ? manifestJson.tabs : [];
  if (tabs.length < 1) fail('manifest.tabs rỗng');
  console.log(`[qa:thuvien] manifest OK · ${tabs.length} tabs · version=${manifestJson?.version || '?'}`);

  const duocStatus = await fetchProbe('/api/duocthu/status');
  if (!duocStatus.ok) fail(duocStatus.err || `GET /api/duocthu/status → HTTP ${duocStatus.status}`);
  console.log('[qa:thuvien] duocthu/status OK');

  const sampleTab = tabs[0];
  const dataProbe = await fetchProbe(`/api/data/${sampleTab}`, 'application/json, */*');
  if (!dataProbe.ok) fail(dataProbe.err || `GET /api/data/${sampleTab} → HTTP ${dataProbe.status}`);
  console.log(`[qa:thuvien] sample dataset "${sampleTab}" OK`);
  console.log('[qa:thuvien] PASS');
};

if (baseUrl === 'static') {
  checkStatic();
} else {
  await checkFlask();
}
