/**
 * Đồng bộ thuvien/ → public/thuvien/ (static, cùng origin với web CDSS).
 * Không cần Flask — phục vụ Vercel / expo export / Electron.
 *
 * Chạy: npm run thuvien:prepare
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const THUVIEN = path.join(root, 'thuvien');
const SRC_STATIC = path.join(THUVIEN, 'dvkt_app', 'static');
const SRC_DATA = path.join(THUVIEN, 'dvkt_app', 'data');
const SRC_DUOC_DATA = path.join(THUVIEN, 'duocthu_data');
const SRC_CHANDOAN = path.join(THUVIEN, 'chandoan-html');
const OUT = path.join(root, 'public', 'thuvien');

const BASE = '/thuvien';

/** Thay đường dẫn tuyệt đối Flask → static cùng origin. */
function patchWebPaths(text) {
  let s = String(text);
  s = s.replace(/https?:\/\/127\.0\.0\.1:5050\/?/g, `${BASE}/`);
  s = s.replace(/https?:\/\/localhost:5050\/?/gi, `${BASE}/`);
  s = s.replace(/(['"`])\/static\//g, `$1${BASE}/static/`);
  s = s.replace(/(['"`])\/api\//g, `$1${BASE}/api/`);
  s = s.replace(/(['"`])\/duocthu_data\//g, `$1${BASE}/duocthu_data/`);
  s = s.replace(/(['"`])\/chandoan-html\//g, `$1${BASE}/chandoan-html/`);
  s = s.replace(/(['"`])\/duocthu(['"`/])/g, `$1${BASE}/duocthu$2`);
  return s;
}

function rmDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest, { patchText = false, extFilter = null } = {}) {
  if (!fs.existsSync(src)) return 0;
  mkdirp(dest);
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyDir(srcPath, destPath, { patchText, extFilter });
    } else {
      if (extFilter && !extFilter(entry.name)) continue;
      if (patchText && /\.(html|js|json|mjs)$/i.test(entry.name)) {
        const raw = fs.readFileSync(srcPath, 'utf8');
        fs.writeFileSync(destPath, patchWebPaths(raw), 'utf8');
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
      count += 1;
    }
  }
  return count;
}

function decompressGzipDatasets() {
  const outData = path.join(OUT, 'api', 'data');
  mkdirp(outData);
  if (!fs.existsSync(SRC_DATA)) return 0;
  let count = 0;
  for (const file of fs.readdirSync(SRC_DATA)) {
    if (!file.endsWith('.json.gz')) continue;
    const tabId = file.replace(/\.json\.gz$/, '');
    const gz = fs.readFileSync(path.join(SRC_DATA, file));
    const json = zlib.gunzipSync(gz).toString('utf8');
    // Flask: GET /api/data/<tab_id> — giữ tên không đuôi cho fetch tương thích
    fs.writeFileSync(path.join(outData, tabId), json, 'utf8');
    fs.writeFileSync(path.join(outData, `${tabId}.json`), json, 'utf8');
    count += 1;
  }
  return count;
}

function writeManifest() {
  const src = path.join(SRC_DATA, 'manifest.json');
  const outApi = path.join(OUT, 'api');
  mkdirp(outApi);
  if (!fs.existsSync(src)) {
    console.warn('[thuvien:prepare] Thiếu manifest.json — bỏ qua');
    return;
  }
  const raw = fs.readFileSync(src, 'utf8');
  fs.writeFileSync(path.join(outApi, 'manifest.json'), raw, 'utf8');
  // Flask route /api/manifest (không đuôi) — tạo bản không extension cho tương thích
  fs.writeFileSync(path.join(outApi, 'manifest'), raw, 'utf8');
}

function writeDuocthuStatus() {
  const hasHtml = fs.existsSync(path.join(SRC_STATIC, 'duocthu', 'index.html'));
  const dataFiles = fs.existsSync(SRC_DUOC_DATA)
    ? fs.readdirSync(SRC_DUOC_DATA).filter((f) => f.endsWith('.js')).length
    : 0;
  const status = {
    static_html: hasHtml,
    source_html: false,
    data_dir: fs.existsSync(SRC_DUOC_DATA),
    data_files: dataFiles,
    url: `${BASE}/duocthu`,
    mode: 'static',
  };
  const dir = path.join(OUT, 'api', 'duocthu');
  mkdirp(dir);
  const json = JSON.stringify(status, null, 2);
  fs.writeFileSync(path.join(dir, 'status.json'), json, 'utf8');
  fs.writeFileSync(path.join(dir, 'status'), json, 'utf8');
}

function main() {
  if (!fs.existsSync(SRC_STATIC)) {
    console.error('[thuvien:prepare] FAIL: thiếu thuvien/dvkt_app/static');
    process.exit(1);
  }

  console.log('[thuvien:prepare] Xóa public/thuvien cũ…');
  rmDir(OUT);
  mkdirp(OUT);

  let staticFiles = 0;
  const indexSrc = path.join(SRC_STATIC, 'index.html');
  fs.writeFileSync(path.join(OUT, 'index.html'), patchWebPaths(fs.readFileSync(indexSrc, 'utf8')), 'utf8');
  staticFiles += 1;

  staticFiles += copyDir(path.join(SRC_STATIC, 'js'), path.join(OUT, 'static', 'js'), { patchText: true });
  const pcAppsSrc = path.join(SRC_STATIC, 'pc_apps.json');
  if (fs.existsSync(pcAppsSrc)) {
    mkdirp(path.join(OUT, 'static'));
    fs.writeFileSync(
      path.join(OUT, 'static', 'pc_apps.json'),
      patchWebPaths(fs.readFileSync(pcAppsSrc, 'utf8')),
      'utf8',
    );
    staticFiles += 1;
  }
  staticFiles += copyDir(path.join(SRC_STATIC, 'duocthu'), path.join(OUT, 'duocthu'), { patchText: true });
  const duocDataFiles = copyDir(SRC_DUOC_DATA, path.join(OUT, 'duocthu_data'));
  const chandoanFiles = copyDir(SRC_CHANDOAN, path.join(OUT, 'chandoan-html'), {
    patchText: true,
    extFilter: (name) => /\.(js|json|html)$/i.test(name),
  });

  const datasetCount = decompressGzipDatasets();
  writeManifest();
  writeDuocthuStatus();

  console.log(`[thuvien:prepare] static: ${staticFiles} file · duocthu_data: ${duocDataFiles} · chandoan: ${chandoanFiles}`);
  console.log(`[thuvien:prepare] datasets JSON: ${datasetCount} · base: ${BASE}`);
  console.log('[thuvien:prepare] PASS');
}

main();
