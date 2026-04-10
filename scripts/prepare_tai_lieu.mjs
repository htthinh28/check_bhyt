/**
 * Đồng bộ thư mục tai_lieu/ → public/tai_lieu/ (phục vụ web/Electron) và sinh manifest.
 * - File .html: copy giữ nguyên đường dẫn tương đối.
 * - File .md: chuyển sang .html (render Markdown) cùng cấu trúc thư mục.
 *
 * Chạy: npm run tai_lieu:prepare
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const SRC = path.join(root, 'tai_lieu');
const OUT = path.join(root, 'public', 'tai_lieu');
const MANIFEST = path.join(root, 'ma_nguon', 'tien_ich', 'tai_lieu_manifest.json');

const shouldSkip = (name) => name === '.git' || name === 'node_modules';

function walk(dir, baseRel = '') {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (shouldSkip(ent.name)) continue;
    const rel = baseRel ? `${baseRel}/${ent.name}` : ent.name;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walk(full, rel));
    } else if (ent.isFile()) {
      out.push({ full, rel: rel.replace(/\\/g, '/') });
    }
  }
  return out;
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapHtmlPage({ title, bodyHtml, sourceRel }) {
  const t = escapeHtml(title);
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${t}</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: system-ui, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.55; margin: 0; padding: 24px; background: #f6f7f9; color: #1a1a2e; }
    main { max-width: 900px; margin: 0 auto; background: #fff; padding: 28px 32px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
    h1, h2, h3 { line-height: 1.25; }
    code, pre { font-family: ui-monospace, Consolas, monospace; font-size: 0.92em; }
    pre { overflow: auto; padding: 12px; background: #f0f1f3; border-radius: 8px; }
    blockquote { border-left: 4px solid #c2185b; margin: 0; padding-left: 16px; color: #444; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
    a { color: #1565c0; }
  </style>
</head>
<body>
  <main>
    <div class="meta">Nguồn: <code>${escapeHtml(sourceRel)}</code> · Thư viện CDSS BHYT</div>
    ${bodyHtml}
  </main>
</body>
</html>
`;
}

function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const items = [];
  const files = walk(SRC);

  if (!fs.existsSync(SRC)) {
    console.warn('[prepare_tai_lieu] Không có thư mục tai_lieu/. Tạo manifest rỗng.');
    fs.writeFileSync(
      MANIFEST,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), items: [] }, null, 2)}\n`,
      'utf8',
    );
    return;
  }

  for (const { full, rel } of files) {
    const lower = rel.toLowerCase();
    if (lower.endsWith('.html')) {
      const dest = path.join(OUT, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(full, dest);
      const base = path.basename(rel, '.html');
      items.push({
        id: `html:${rel}`,
        relPath: rel.replace(/\\/g, '/'),
        title: base.replace(/_/g, ' '),
        nguon: 'html',
      });
      continue;
    }
    if (lower.endsWith('.md')) {
      const md = fs.readFileSync(full, 'utf8');
      const htmlBody = marked.parse(md, { async: false });
      const titleMatch = md.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : path.basename(rel, '.md').replace(/_/g, ' ');
      const outRel = `${rel.slice(0, -3)}.html`;
      const dest = path.join(OUT, outRel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const page = wrapHtmlPage({ title, bodyHtml: htmlBody, sourceRel: rel });
      fs.writeFileSync(dest, page, 'utf8');
      items.push({
        id: `md:${rel}`,
        relPath: outRel.replace(/\\/g, '/'),
        title,
        nguon: 'markdown',
      });
    }
  }

  items.sort((a, b) => a.relPath.localeCompare(b.relPath, 'vi'));

  fs.writeFileSync(
    MANIFEST,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), items }, null, 2)}\n`,
    'utf8',
  );

  console.log(`[prepare_tai_lieu] Đã xử lý ${items.length} tài liệu → public/tai_lieu/ và ${path.relative(root, MANIFEST)}`);
}

main();
