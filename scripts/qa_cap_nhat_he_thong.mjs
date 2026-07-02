#!/usr/bin/env node
/** Smoke test manifest cập nhật hệ thống. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(
  readFileSync(join(__dirname, '../ma_nguon/tien_ich/man_cap_nhat_he_thong.json'), 'utf8'),
);

assert.ok(raw.phien_ban_manifest, 'phien_ban_manifest');
assert.ok(raw.ban_phat_hanh?.id, 'ban_phat_hanh.id');
assert.ok(Array.isArray(raw.ban_phat_hanh?.muc) && raw.ban_phat_hanh.muc.length > 0, 'muc');

raw.ban_phat_hanh.muc.forEach((m, i) => {
  assert.ok(m.tieu_de, `muc[${i}].tieu_de`);
  assert.ok(Array.isArray(m.chi_tiet) && m.chi_tiet.length > 0, `muc[${i}].chi_tiet`);
});

console.log('OK: qa_cap_nhat_he_thong.mjs');
