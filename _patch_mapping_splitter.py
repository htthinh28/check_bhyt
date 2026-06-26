# -*- coding: utf-8 -*-
from pathlib import Path

dst = next(Path(r"C:\Users\admin\Desktop\Thu vien").glob("*(1)*.html"))
text = dst.read_text(encoding="utf-8")

CSS_OLD = """        .mapping-layout { display: flex; flex: 1; min-height: 0; overflow: hidden; }
        .mapping-config { width: min(100%, 20rem); flex-shrink: 0; border-right: 1px solid #e2e8f0; background: #fff; overflow-y: auto; }
        @media (max-width: 1023px) {
            .mapping-layout { flex-direction: column; }
            .mapping-config { width: 100%; max-height: 42vh; border-right: none; border-bottom: 1px solid #e2e8f0; }
        }
        .mapping-preview { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }"""

CSS_NEW = """        .mapping-layout { display: flex; flex: 1; min-height: 0; overflow: hidden; flex-direction: column; }
        .mapping-config {
            width: 100%; flex-shrink: 0; flex-grow: 0;
            height: var(--mapping-config-h, 38%);
            min-height: 7rem; max-height: calc(100% - 7rem);
            background: #fff; overflow-y: auto;
        }
        .mapping-splitter {
            flex-shrink: 0; height: 0.625rem; cursor: row-resize; touch-action: none;
            background: linear-gradient(to bottom, #e2e8f0, #cbd5e1, #e2e8f0);
            border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;
            display: flex; align-items: center; justify-content: center; user-select: none; z-index: 3;
        }
        .mapping-splitter::after {
            content: ''; width: 2.5rem; height: 0.2rem; border-radius: 999px;
            background: #94a3b8; box-shadow: 0 0.125rem 0 rgb(100 116 139 / 0.25);
        }
        .mapping-splitter:hover, .mapping-splitter.is-dragging {
            background: linear-gradient(to bottom, #fce7f3, #f9a8d4, #fce7f3);
        }
        .mapping-splitter:hover::after, .mapping-splitter.is-dragging::after { background: #db2777; }
        body.mapping-split-drag { cursor: row-resize !important; user-select: none !important; }
        body.mapping-split-drag * { cursor: row-resize !important; }
        .mapping-preview { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }"""

HTML_OLD = """        <div class="mapping-layout flex-1 min-h-0">
            <aside class="mapping-config scrollbar-thin p-3 sm:p-4" id="mappingConfigPanel"></aside>
            <div class="mapping-preview">"""

HTML_NEW = """        <div class="mapping-layout flex-1 min-h-0" id="mappingLayout">
            <aside class="mapping-config scrollbar-thin p-3 sm:p-4" id="mappingConfigPanel"></aside>
            <div class="mapping-splitter" id="mappingSplitter" role="separator" aria-orientation="horizontal" aria-label="Kéo lên hoặc xuống để đổi chiều cao khung cấu hình" tabindex="0"></div>
            <div class="mapping-preview">"""

JS_OLD = """        function renderMappingPanel() {
            renderMappingConfigPanel();
            renderMappingPreview();
            safeLucideIcons();
        }"""

JS_NEW = """        const MAPPING_SPLIT_KEY = 'duocThuMappingSplitPct';
        let mappingSplitterBound = false;

        function applyMappingConfigHeight(pct) {
            const layout = document.getElementById('mappingLayout');
            if (!layout) return;
            const clamped = Math.min(75, Math.max(18, pct));
            layout.style.setProperty('--mapping-config-h', clamped + '%');
            try { localStorage.setItem(MAPPING_SPLIT_KEY, String(clamped)); } catch (_) { /* ignore */ }
        }

        function loadMappingSplitHeight() {
            try {
                const v = parseFloat(localStorage.getItem(MAPPING_SPLIT_KEY));
                if (!Number.isNaN(v)) applyMappingConfigHeight(v);
            } catch (_) { /* ignore */ }
        }

        function initMappingSplitter() {
            const layout = document.getElementById('mappingLayout');
            const splitter = document.getElementById('mappingSplitter');
            if (!layout || !splitter) return;
            loadMappingSplitHeight();
            if (mappingSplitterBound) return;
            mappingSplitterBound = true;
            let dragging = false;
            const onMove = (clientY) => {
                const rect = layout.getBoundingClientRect();
                if (rect.height <= 0) return;
                applyMappingConfigHeight(((clientY - rect.top) / rect.height) * 100);
            };
            const stop = () => {
                if (!dragging) return;
                dragging = false;
                splitter.classList.remove('is-dragging');
                document.body.classList.remove('mapping-split-drag');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', stop);
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', stop);
            };
            const onMouseMove = (e) => { if (dragging) { e.preventDefault(); onMove(e.clientY); } };
            const onTouchMove = (e) => { if (dragging && e.touches[0]) { e.preventDefault(); onMove(e.touches[0].clientY); } };
            const start = (clientY) => {
                dragging = true;
                splitter.classList.add('is-dragging');
                document.body.classList.add('mapping-split-drag');
                onMove(clientY);
            };
            splitter.addEventListener('mousedown', (e) => {
                e.preventDefault();
                start(e.clientY);
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', stop);
            });
            splitter.addEventListener('touchstart', (e) => {
                if (!e.touches[0]) return;
                start(e.touches[0].clientY);
                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', stop);
            }, { passive: true });
            splitter.addEventListener('keydown', (e) => {
                const cur = parseFloat(localStorage.getItem(MAPPING_SPLIT_KEY)) || 38;
                if (e.key === 'ArrowUp') { e.preventDefault(); applyMappingConfigHeight(cur - 2); }
                if (e.key === 'ArrowDown') { e.preventDefault(); applyMappingConfigHeight(cur + 2); }
            });
        }

        function renderMappingPanel() {
            renderMappingConfigPanel();
            renderMappingPreview();
            initMappingSplitter();
            safeLucideIcons();
        }"""

for name, old, new in [
    ("CSS", CSS_OLD, CSS_NEW),
    ("HTML", HTML_OLD, HTML_NEW),
    ("JS", JS_OLD, JS_NEW),
]:
    if name == "HTML" and 'id="mappingSplitter"' in text:
        print(f"skip {name} (already patched)")
        continue
    if name == "CSS" and ".mapping-splitter {" in text and 'body.mapping-split-drag' in text:
        print(f"skip {name} (already patched)")
        continue
    if name == "JS" and "initMappingSplitter" in text:
        print(f"skip {name} (already patched)")
        continue
    if old not in text:
        raise SystemExit(f"{name} anchor missing")
    text = text.replace(old, new, 1)
    print(f"patched {name}")

dst.write_text(text, encoding="utf-8")
print("OK", "mappingSplitter" in text, "initMappingSplitter" in text)
