/**
 * QA: đồng bộ placeholder CHUYEN_DE (registry vs mã nguồn) + nhắc chính sách thực tiễn.
 * Chạy: node scripts/qa_chuyen_de_placeholder_engine.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'ma_nguon', 'tien_ich', 'luat_giam_dinh_chuyen_de_hardcoded.jsx');
const REG = path.join(ROOT, 'scripts', 'chuyen_de_placeholder_registry.json');

/** Cùng logic scripts/sync_chuyen_de_placeholder_registry.mjs */
function demPlaceholderTrongFile() {
  const lines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/);
  const ids = [];
  let currentId = null;
  for (const line of lines) {
    const idM = line.match(/id:\s*'(CHUYEN_DE-\d+)'/);
    if (idM) currentId = idM[1];
    if (currentId && /DIEU_KIEN:\s*CHUYEN_DE_XML130_CHO_XU_LY_SAU\s*,/.test(line)) {
      ids.push(currentId);
    }
  }
  return ids.length;
}

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  process.exit(1);
}

const reg = JSON.parse(fs.readFileSync(REG, 'utf8'));
const countScan = demPlaceholderTrongFile();

if (countScan !== reg.placeholder_count) {
  fail(
    `Số quy tắc placeholder quét được (${countScan}) ≠ registry (${reg.placeholder_count}). Chạy: node scripts/sync_chuyen_de_placeholder_registry.mjs`,
  );
}

const text = fs.readFileSync(SRC, 'utf8');
const mExport = text.match(/export const CHUYEN_DE_XML130_CHO_XU_LY_SAU = '([^']+)';/);
if (!mExport) fail('Không tìm thấy export CHUYEN_DE_XML130_CHO_XU_LY_SAU trong luat_giam_dinh_chuyen_de_hardcoded.jsx');

console.log(`[OK] Placeholder registry khớp mã nguồn: ${reg.placeholder_count} quy tắc.`);
console.log(`[OK] Hằng placeholder đã export — engine bỏ qua qua laDieuKienChuyenDeXml130Placeholder (không phát cảnh báo).`);
console.log('');
console.log('Chính sách: không có hệ tự động nào đạt 100% không dương giả và không âm giả trên mọi hồ sơ.');
console.log('Placeholder = không cảnh báo trên XML có MA_LK (tránh dương giả). Chuyển XML130 thật: kiểm thử vàng + ON/OFF.');
process.exit(0);
