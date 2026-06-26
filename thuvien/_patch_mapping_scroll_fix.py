# -*- coding: utf-8 -*-
"""Definitive mapping scroll fix: viewport-sized scroll area + sync on resize."""
from pathlib import Path

dst = next(Path(r"C:\Users\admin\Desktop\Thu vien").glob("*(1)*.html"))
text = dst.read_text(encoding="utf-8")

CSS_OLD = """        #duocMappingPanel { display: none; flex: 1; min-height: 0; flex-direction: column; overflow: hidden; background: #f8fafc; }
        #duocMappingPanel.is-active { display: flex; }
        #sectionDuocThu.mapping-mode { overflow: hidden; }
        #sectionDuocThu.mapping-mode #workspace { display: none !important; }
        #sectionDuocThu.mapping-mode #duocDrugHeader { display: none !important; }
        #sectionDuocThu.mapping-mode #duocMappingPanel.is-active { flex: 1; min-height: 0; }
        .mapping-scroll-area {
            flex: 1; min-height: 0; overflow-y: scroll; overflow-x: hidden;
            -webkit-overflow-scrolling: touch; scrollbar-gutter: stable;
            background: #f8fafc;
        }
        .mapping-scroll-area::-webkit-scrollbar { width: 10px; }
        .mapping-scroll-area::-webkit-scrollbar-track { background: #f1f5f9; }
        .mapping-scroll-area::-webkit-scrollbar-thumb { background: #f472b6; border-radius: 8px; border: 2px solid #f1f5f9; }
        .mapping-scroll-area::-webkit-scrollbar-thumb:hover { background: #db2777; }"""

CSS_NEW = """        #duocMappingPanel { display: none; flex: 1 1 0; min-height: 0; flex-direction: column; overflow: hidden; background: #f8fafc; }
        #duocMappingPanel.is-active { display: flex; }
        #sectionDuocThu.mapping-mode {
            overflow: hidden;
            min-height: 0;
            flex: 1 1 0;
        }
        #sectionDuocThu.mapping-mode #workspace { display: none !important; }
        #sectionDuocThu.mapping-mode #duocDrugHeader { display: none !important; }
        #sectionDuocThu.mapping-mode #duocMappingPanel.is-active {
            flex: 1 1 0;
            min-height: 0;
            max-height: 100%;
            overflow: hidden;
        }
        #mappingScrollArea {
            flex: 1 1 0;
            min-height: 0;
            height: 0;
            overflow-y: scroll !important;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-gutter: stable;
            background: #f8fafc;
            scrollbar-width: thin;
            scrollbar-color: #f472b6 #f1f5f9;
        }
        #mappingScrollArea::-webkit-scrollbar { width: 12px; }
        #mappingScrollArea::-webkit-scrollbar-track { background: #f1f5f9; border-left: 1px solid #e2e8f0; }
        #mappingScrollArea::-webkit-scrollbar-thumb { background: #f472b6; border-radius: 8px; border: 3px solid #f1f5f9; min-height: 48px; }
        #mappingScrollArea::-webkit-scrollbar-thumb:hover { background: #db2777; }"""

HTML_OLD = '    <div id="duocMappingPanel" class="hidden" aria-label="Mapping dược thư ICD BYT BV">'
HTML_NEW = '    <div id="duocMappingPanel" class="hidden flex flex-col flex-1 min-h-0 overflow-hidden" aria-label="Mapping dược thư ICD BYT BV">'

HTML_SCROLL_OLD = '        <div id="mappingScrollArea" class="mapping-scroll-area scrollbar-thin">'
HTML_SCROLL_NEW = '        <div id="mappingScrollArea" class="flex-1 min-h-0">'

JS_OLD = """        function renderMappingPanel() {
            document.body.classList.remove('mapping-split-drag');
            renderMappingConfigPanel();
            renderMappingPreview();
            safeLucideIcons();
        }"""

JS_NEW = """        function syncMappingScrollLayout() {
            const scroll = document.getElementById('mappingScrollArea');
            const panel = document.getElementById('duocMappingPanel');
            if (!scroll || !panel || !duocMappingActive) return;
            const top = scroll.getBoundingClientRect().top;
            const maxH = Math.max(240, Math.floor(window.innerHeight - top - 4));
            scroll.style.maxHeight = maxH + 'px';
            scroll.style.height = maxH + 'px';
            scroll.style.overflowY = 'scroll';
        }

        function renderMappingPanel() {
            document.body.classList.remove('mapping-split-drag');
            renderMappingConfigPanel();
            renderMappingPreview();
            safeLucideIcons();
            requestAnimationFrame(() => {
                syncMappingScrollLayout();
                requestAnimationFrame(syncMappingScrollLayout);
            });
        }"""

JS_TOGGLE_OLD = """                renderMappingPanel();
            } else {
                updateUI();
            }
        }

        function downloadMappingFile(blob, filename) {"""

JS_TOGGLE_NEW = """                renderMappingPanel();
            } else {
                updateUI();
            }
        }

        if (!window.__mappingScrollResizeBound) {
            window.__mappingScrollResizeBound = true;
            window.addEventListener('resize', () => { if (duocMappingActive) syncMappingScrollLayout(); });
        }

        function downloadMappingFile(blob, filename) {"""

for label, old, new in [
    ("CSS", CSS_OLD, CSS_NEW),
    ("HTML panel", HTML_OLD, HTML_NEW),
    ("HTML scroll", HTML_SCROLL_OLD, HTML_SCROLL_NEW),
    ("JS render", JS_OLD, JS_NEW),
    ("JS resize", JS_TOGGLE_OLD, JS_TOGGLE_NEW),
]:
    if old not in text:
        if label == "CSS" and "#mappingScrollArea {" in text and "height: 0" in text:
            print(f"skip {label}")
            continue
        raise SystemExit(f"MISSING {label}")
    text = text.replace(old, new, 1)
    print(f"patched {label}")

dst.write_text(text, encoding="utf-8")
print("OK", "syncMappingScrollLayout" in text, "height: 0" in text)
