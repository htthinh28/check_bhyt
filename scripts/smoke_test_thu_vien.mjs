/**
 * Smoke test Thư viện tra cứu (Flask thuvien/) — cổng 5050 mặc định.
 * Chạy: npm run qa:thuvien
 */
const baseUrl = String(process.env.THUVIEN_BASE_URL || 'http://127.0.0.1:5050').replace(/\/$/, '');

const fetchProbe = async (path, accept = 'application/json, */*') => {
  const url = `${baseUrl}${path}`;
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

const fail = (msg) => {
  console.error(`[qa:thuvien] FAIL: ${msg}`);
  process.exit(1);
};

console.log(`[qa:thuvien] Base URL: ${baseUrl}`);

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
