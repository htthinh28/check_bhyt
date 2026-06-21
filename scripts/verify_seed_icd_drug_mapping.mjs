/**
 * Kiểm tra seed ICD_DRUG khớp 86 quy tắc «Kiểm tra Chỉ định ICD-10».
 * Chạy: node scripts/verify_seed_icd_drug_mapping.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const muc8Text = fs.readFileSync(path.join(ROOT, 'ma_nguon/tien_ich/du_lieu_luat_thuoc_muc8.jsx'), 'utf8');
const seedMuc8 = eval(muc8Text.match(/export const DU_LIEU_SEED_LUAT_THUOC_MUC8 = (\[[\s\S]*?\]);/)[1]);
const rules = seedMuc8.filter((r) => (r.DIEU_KIEN || '').includes('CO_CO_DONG_MAPPING_ICD_THUOC'));

const seedDrug = JSON.parse(fs.readFileSync(path.join(ROOT, 'ma_nguon/tien_ich/seed_icd_drug_bhyt.json'), 'utf8'));

const byDrug = new Map();
for (const row of seedDrug) {
  if (row.mapping_type !== 'ICD_DRUG' || row.is_active === false) continue;
  const ma = String(row.target_code || '').trim();
  if (!byDrug.has(ma)) byDrug.set(ma, row);
}

let ok = 0;
const missing = [];
for (const r of rules) {
  const ma = r.DIEU_KIEN.match(/XML2\.MA_THUOC == '([^']+)'/)?.[1];
  if (!ma) continue;
  const row = byDrug.get(ma);
  if (!row) {
    missing.push({ ma_luat: r.MA_LUAT, ma });
    continue;
  }
  const icds = row.metadata?.source_icd_codes || [];
  if (!icds.length) {
    missing.push({ ma_luat: r.MA_LUAT, ma, reason: 'empty icd' });
    continue;
  }
  ok++;
}

console.log('Rules:', rules.length);
console.log('Seed ICD_DRUG rows:', seedDrug.length);
console.log('Covered:', ok);
if (missing.length) {
  console.error('MISSING:', missing);
  process.exit(1);
}

// Simulate CO_CO_DONG gate
const setMa = new Set(seedDrug.filter((r) => r.is_active !== false).flatMap((r) => r.metadata?.target_codes || [r.target_code]));
let gateOk = 0;
for (const r of rules) {
  const ma = r.DIEU_KIEN.match(/XML2\.MA_THUOC == '([^']+)'/)?.[1];
  if (setMa.has(ma)) gateOk++;
}
console.log('CO_CO_DONG_MAPPING_ICD_THUOC gate pass:', gateOk, '/', rules.length);
if (gateOk !== rules.length) process.exit(1);
console.log('OK');
