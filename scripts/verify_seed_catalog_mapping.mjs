/**
 * Kiểm tra logic phục hồi shard catalog_mapping từ seed.
 * Chạy: node scripts/verify_seed_catalog_mapping.mjs
 */
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hopNhatBanGhiMappingShard } from '../ma_nguon/tien_ich/catalog_mapping_seed_merge.pure.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const seedDrug = JSON.parse(fs.readFileSync(path.join(ROOT, 'ma_nguon/tien_ich/seed_icd_drug_bhyt.json'), 'utf8'));
const seedContra = JSON.parse(fs.readFileSync(path.join(ROOT, 'ma_nguon/tien_ich/seed_icd_drug_contra_bhyt.json'), 'utf8'));

const emptyDrug = hopNhatBanGhiMappingShard([], seedDrug);
assert.strictEqual(emptyDrug.mergedRows.length, seedDrug.length, 'empty shard gets all ICD_DRUG seed');

const emptyContra = hopNhatBanGhiMappingShard([], seedContra);
assert.strictEqual(emptyContra.mergedRows.length, seedContra.length, 'empty shard gets all ICD_DRUG_CONTRA seed');

const userOff = [{ ...seedDrug[0], is_active: false }];
const mergedOff = hopNhatBanGhiMappingShard(userOff, seedDrug);
const offRow = mergedOff.mergedRows.find((r) => r.metadata?.ma_luat === seedDrug[0].metadata?.ma_luat);
assert.strictEqual(offRow?.is_active, false, 'user OFF preserved');

const custom = {
  id: 'custom_1',
  mapping_type: 'ICD_DVKT',
  source_code: 'J06.9',
  target_code: '01.0001',
  is_active: true,
};
const withCustom = hopNhatBanGhiMappingShard([custom], seedDrug);
assert.ok(withCustom.mergedRows.some((r) => r.id === 'custom_1'), 'custom row kept');

console.log('OK: verify_seed_catalog_mapping');
console.log('  ICD_DRUG seed:', seedDrug.length);
console.log('  ICD_DRUG_CONTRA seed:', seedContra.length);
