/**
 * Rà soát tính toàn vẹn seed tương tác thuốc: mọi dòng ON phải sinh ≥1 cặp mã cho MAP_TUONG_TAC_CAP.
 *
 * Chạy: node scripts/qa_tuong_tac_seed_integrity.mjs
 * Hoặc: npm run qa:tuong-tac-seed-integrity
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chuanHoaBangTuongTacKhongTrungKey } from '../ma_nguon/chuyen_mon/tuong_tac_thuoc/chuan_hoa_bang_tuong_tac.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SEED_PATH = path.join(ROOT, 'ma_nguon/chuyen_mon/tuong_tac_thuoc/du_lieu_tuong_tac_thuoc.seed.json');

const UPPER = (s) => String(s || '').trim().toUpperCase();
const reBracket = /\[([^\]]+)\]/g;

const trichMa = (text) => {
  const out = [];
  const seen = new Set();
  reBracket.lastIndex = 0;
  let m;
  while ((m = reBracket.exec(String(text || ''))) !== null) {
    const code = UPPER(m[1]);
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
};

const tachVs = (nd) => {
  const match = String(nd || '').match(/\s+vs\s+/i);
  if (!match || match.index === undefined) return null;
  return {
    trai: nd.slice(0, match.index),
    phai: nd.slice(match.index + match[0].length),
  };
};

/** Mirror dong_co_giam_dinh.jsx — taoDanhSachCapMaTuHangTuongTacThuoc */
const taoCapTuHang = (r) => {
  const a = UPPER(r?.MA_THUOC_A);
  const b = UPPER(r?.MA_THUOC_B);
  const nd = String(r?.NOI_DUNG_TUONG_TAC || '');
  const capSet = new Set();
  const themCap = (x, y) => {
    if (!x || !y || x === y) return;
    capSet.add([x, y].sort().join('|'));
  };
  const hai = tachVs(nd);
  if (hai) {
    let maTrai = trichMa(hai.trai);
    let maPhai = trichMa(hai.phai);
    if (maTrai.length === 0 && a) maTrai = [a];
    if (maPhai.length === 0 && b) maPhai = [b];
    if (maTrai.length > 0 && maPhai.length > 0) {
      maTrai.forEach((x) => maPhai.forEach((y) => themCap(x, y)));
      return Array.from(capSet);
    }
  }
  if (a && b) {
    themCap(a, b);
    return Array.from(capSet);
  }
  const tat = trichMa(nd);
  for (let i = 0; i < tat.length; i += 1) {
    for (let j = i + 1; j < tat.length; j += 1) {
      themCap(tat[i], tat[j]);
    }
  }
  return Array.from(capSet);
};

function main() {
  if (!fs.existsSync(SEED_PATH)) {
    console.error(`[qa:tuong-tac-seed] Thiếu seed: ${SEED_PATH}`);
    process.exit(1);
  }
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  const rows = chuanHoaBangTuongTacKhongTrungKey(Array.isArray(seed?.data) ? seed.data : []);
  const onRows = rows.filter((r) => !['OFF', '0', 'FALSE', 'TAT'].includes(UPPER(r.TRANG_THAI)));

  const khongSinhCap = [];
  const capMap = new Map();
  let tongCapOn = 0;

  for (const r of onRows) {
    const caps = taoCapTuHang(r);
    tongCapOn += caps.length;
    if (caps.length === 0) {
      khongSinhCap.push(r.MA_TUONG_TAC || r.id);
      continue;
    }
    caps.forEach((pk) => {
      if (!capMap.has(pk)) capMap.set(pk, []);
      capMap.get(pk).push(r.MA_TUONG_TAC);
    });
  }

  const capTrung = [...capMap.entries()].filter(([, arr]) => arr.length > 1);

  console.log(`[qa:tuong-tac-seed] phien_ban=${seed.phien_ban || '—'} rows=${rows.length} ON=${onRows.length}`);
  console.log(`[qa:tuong-tac-seed] cặp từ ON: ${tongCapOn} (phân biệt: ${capMap.size}), trùng cặp: ${capTrung.length}`);

  let failed = false;
  if (khongSinhCap.length > 0) {
    failed = true;
    console.error(`[qa:tuong-tac-seed] FAIL — ${khongSinhCap.length} dòng ON không sinh cặp: ${khongSinhCap.join(', ')}`);
  }
  if (failed) process.exit(1);
  console.log('[qa:tuong-tac-seed] OK — mọi dòng ON sinh ≥1 cặp mã.');
}

main();
