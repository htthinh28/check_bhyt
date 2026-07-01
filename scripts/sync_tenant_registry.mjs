/**
 * Đồng bộ config/tenants/registry.json → ma_nguon/tien_ich/tenant_registry_data.json
 * Chạy: npm run tenant:registry:sync
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = path.join(root, 'config', 'tenants', 'registry.json');
const dest = path.join(root, 'ma_nguon', 'tien_ich', 'tenant_registry_data.json');

if (!fs.existsSync(src)) {
  console.error('[tenant:registry:sync] Thiếu', src);
  process.exit(1);
}

const raw = fs.readFileSync(src, 'utf8');
const registry = JSON.parse(raw);
fs.writeFileSync(dest, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
console.log('[tenant:registry:sync] PASS →', dest);

const ids = (registry.tenants || []).map((t) => t.org_id || t.orgId).filter(Boolean);
for (const orgId of ids) {
  try {
    execSync(`node "${path.join(__dirname, 'import_tenant_pack.mjs')}" --org=${orgId}`, {
      cwd: root,
      stdio: 'inherit',
    });
  } catch (e) {
    console.warn(`[tenant:registry:sync] import pack ${orgId} skipped:`, e?.message || e);
  }
}
