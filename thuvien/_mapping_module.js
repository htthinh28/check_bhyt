        // --- MAPPING / BÁO CÁO LINH HOẠT (Dược thư × ICD × BYT × BV) ---
        const MAPPING_STORAGE_KEY = 'duocThuMappingReportV1';
        const MAPPING_BYT_COLUMNS = [
            { key: 'soDangKy', label: 'Số đăng ký' },
            { key: 'tenThuoc', label: 'Tên thuốc' },
            { key: 'hoatChat', label: 'Hoạt chất' },
            { key: 'hoatChatTheoSoDangKy', label: 'Hoạt chất theo SĐK' },
            { key: 'duongDung', label: 'Đường dùng' },
            { key: 'hamLuong', label: 'Hàm lượng' },
            { key: 'dongGoi', label: 'Đóng gói' },
            { key: 'hangSx', label: 'Hãng SX' },
            { key: 'nuocSx', label: 'Nước SX' },
            { key: 'maHoatChat', label: 'Mã hoạt chất (MA_HC)' },
        ];
        const MAPPING_BV_COLUMNS = [
            { key: 'ma', label: 'Mã BV' },
            { key: 'tenBietDuoc', label: 'Tên biệt dược' },
            { key: 'hoatChat', label: 'Hoạt chất' },
            { key: 'bhyt', label: 'BHYT' },
            { key: 'tenBH', label: 'Tên BH' },
            { key: 'nhom', label: 'Nhóm' },
            { key: 'soDangKy', label: 'Số ĐK' },
            { key: 'hamLuong', label: 'Hàm lượng' },
        ];
        const MAPPING_ROW_MODES = [
            { id: 'drug', label: '1 dòng / hoạt chất', desc: 'Tổng hợp theo monograph' },
            { id: 'byt', label: '1 dòng / sản phẩm BYT', desc: 'Mở rộng danh mục Bộ Y tế' },
            { id: 'bv', label: '1 dòng / biệt dược BV', desc: 'Mở rộng danh mục bệnh viện' },
            { id: 'icd_chi_dinh', label: '1 dòng / ICD chỉ định', desc: 'Tách từng mã gợi ý chỉ định' },
            { id: 'icd_chong', label: '1 dòng / ICD chống CĐ', desc: 'Tách từng mã gợi ý chống chỉ định' },
            { id: 'icd_all', label: '1 dòng / mọi ICD gợi ý', desc: 'Cả chỉ định và chống chỉ định' },
            { id: 'byt_icd', label: 'BYT × ICD chỉ định', desc: 'Mỗi cặp sản phẩm BYT + mã ICD' },
        ];
        const MAPPING_PRESETS = {
            icd_chi_tiet: {
                label: 'ICD-10 chi tiết ↔ Dược thư',
                rowMode: 'icd_all',
                columns: ['drug.tenHoatChat', 'drug.nhomThuoc', 'icd.loai', 'icd.ma', 'icd.ten', 'icd.dinhNghia', 'icd.flags', 'icd.whoGuide', 'icd.raw', 'drug.maThuocBYT', 'byt.tenThuoc', 'byt.soDangKy', 'bv.tenBietDuoc', 'bv.ma', 'bv.bhyt'],
            },
            danh_muc_byt: {
                label: 'Danh mục BYT (mã, tên, SĐK…)',
                rowMode: 'byt',
                columns: ['drug.tenHoatChat', 'drug.maThuocBYT', 'byt.soDangKy', 'byt.tenThuoc', 'byt.hoatChat', 'byt.duongDung', 'byt.hamLuong', 'byt.dongGoi', 'byt.hangSx', 'byt.nuocSx'],
            },
            danh_muc_bv: {
                label: 'Danh mục BV + BHYT',
                rowMode: 'bv',
                columns: ['drug.tenHoatChat', 'bv.ma', 'bv.tenBietDuoc', 'bv.hoatChat', 'bv.bhyt', 'bv.tenBH', 'bv.nhom', 'bv.soDangKy', 'bv.hamLuong'],
            },
            mapping_day_du: {
                label: 'Mapping đầy đủ 3 nguồn',
                rowMode: 'drug',
                columns: ['drug.tenHoatChat', 'drug.nhomThuoc', 'drug.chiDinh', 'drug.goiYMaICDChiDinh', 'drug.goiYMaICDChongChiDinh', 'drug.maThuocBYT', 'byt.tenThuoc', 'byt.soDangKy', 'bv.tenBietDuoc', 'bv.ma', 'bv.bhyt', 'icd.ma', 'icd.ten', 'icd.dinhNghia'],
            },
        };
        let mappingReportState = {
            rowMode: 'icd_all',
            useSidebarFilters: true,
            onlyWithByt: false,
            onlyWithBv: false,
            onlyWithIcd: false,
            enrichIcd: true,
            selectedColumns: [...MAPPING_PRESETS.icd_chi_tiet.columns],
        };

        function getMaThuocBYTFromDrug(drug) {
            return (drug?.danhMucBYT || [])[0]?.maHoatChat || drug?.maThuocBYT || '';
        }

        function formatBhytExport(tag) {
            if (tag === 'co_bhyt') return 'Có BHYT';
            if (tag === 'khong_bhyt') return 'Không BHYT';
            return tag || '';
        }

        function loadMappingReportState() {
            try {
                const raw = localStorage.getItem(MAPPING_STORAGE_KEY);
                if (!raw) return;
                const s = JSON.parse(raw);
                if (s.rowMode) mappingReportState.rowMode = s.rowMode;
                if (typeof s.useSidebarFilters === 'boolean') mappingReportState.useSidebarFilters = s.useSidebarFilters;
                if (typeof s.onlyWithByt === 'boolean') mappingReportState.onlyWithByt = s.onlyWithByt;
                if (typeof s.onlyWithBv === 'boolean') mappingReportState.onlyWithBv = s.onlyWithBv;
                if (typeof s.onlyWithIcd === 'boolean') mappingReportState.onlyWithIcd = s.onlyWithIcd;
                if (typeof s.enrichIcd === 'boolean') mappingReportState.enrichIcd = s.enrichIcd;
                if (Array.isArray(s.selectedColumns) && s.selectedColumns.length) {
                    mappingReportState.selectedColumns = s.selectedColumns.filter(Boolean);
                }
            } catch (_) { /* ignore */ }
        }

        function saveMappingReportState() {
            try {
                localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(mappingReportState));
            } catch (_) { /* ignore */ }
        }

        function formatIcdFlagsText(flags) {
            if (!flags) return '';
            return String(flags).split(',').map(s => s.trim()).filter(Boolean)
                .map(f => ICD_FLAG_LABELS[f] || f).join('; ');
        }

        function parseIcdSuggestionList(text, kind) {
            if (!text) return [];
            return String(text).split(';').map(part => {
                part = part.trim();
                if (!part) return null;
                const ma = parseIcdMaFromBadgeText(part)
                    || (part.match(/^([A-TV-ZU]\d{2}(?:\.\d{1,2})?)/i)?.[1]?.toUpperCase() || '');
                if (!ma) return null;
                return { ma, raw: part, kind };
            }).filter(Boolean);
        }

        function ensureIcdCatalogMapReady() {
            if (!icdCatalogMap && icdCatalog.length) buildIcdChapterIndex();
        }

        function getIcdDetailForMa(ma) {
            if (!ma || !mappingReportState.enrichIcd) return null;
            ensureIcdCatalogMapReady();
            return icdCatalogMap?.get(String(ma).toUpperCase()) || null;
        }

        function getMappingColumnCatalog() {
            const drugCols = getAllFields().map(f => ({
                id: `drug.${f.key}`,
                group: 'duoc',
                groupLabel: 'Dược thư (monograph)',
                label: f.label,
                get: (ctx) => {
                    if (f.key === 'maThuocBYT') return getMaThuocBYTFromDrug(ctx.drug);
                    if (f.key === 'tagNguoiCoThai' || f.key === 'tagChoConBu') {
                        const tag = ctx.drug[f.key];
                        return TAG_CONFIG[tag]?.label || tag || '';
                    }
                    return ctx.drug[f.key] || '';
                },
            }));
            if (!drugCols.some(c => c.id === 'drug.maThuocBYT')) {
                drugCols.push({
                    id: 'drug.maThuocBYT',
                    group: 'duoc',
                    groupLabel: 'Dược thư (monograph)',
                    label: 'Mã thuốc theo Bộ Y tế (MA_HC)',
                    get: (ctx) => getMaThuocBYTFromDrug(ctx.drug),
                });
            }
            const bytCols = MAPPING_BYT_COLUMNS.map(c => ({
                id: `byt.${c.key}`,
                group: 'byt',
                groupLabel: 'Danh mục BYT',
                label: `BYT — ${c.label}`,
                get: (ctx) => {
                    if (c.key === 'hoatChat') return ctx.bytItem?.hoatChatTheoSoDangKy || ctx.bytItem?.hoatChat || '';
                    return ctx.bytItem?.[c.key] || '';
                },
            }));
            const bvCols = MAPPING_BV_COLUMNS.map(c => ({
                id: `bv.${c.key}`,
                group: 'bv',
                groupLabel: 'Danh mục Bệnh viện',
                label: `BV — ${c.label}`,
                get: (ctx) => {
                    if (c.key === 'bhyt') return formatBhytExport(ctx.bvItem?.tagBHYT);
                    return ctx.bvItem?.[c.key] || '';
                },
            }));
            const icdCols = [
                { id: 'icd.loai', group: 'icd', groupLabel: 'ICD-10 chi tiết', label: 'ICD — Loại gợi ý', get: ctx => ctx.icd?.kind === 'chi_dinh' ? 'Chỉ định' : (ctx.icd?.kind === 'chong_chi_dinh' ? 'Chống chỉ định' : '') },
                { id: 'icd.ma', group: 'icd', groupLabel: 'ICD-10 chi tiết', label: 'ICD — Mã', get: ctx => ctx.icd?.ma || '' },
                { id: 'icd.ten', group: 'icd', groupLabel: 'ICD-10 chi tiết', label: 'ICD — Tên TT06', get: ctx => (ctx.icdDetail && typeof icdTen === 'function' ? icdTen(ctx.icdDetail) : '') || ctx.icd?.raw || '' },
                { id: 'icd.dinhNghia', group: 'icd', groupLabel: 'ICD-10 chi tiết', label: 'ICD — Định nghĩa VN (Tập 1)', get: ctx => ctx.icdDetail?.dv || ctx.icdDetail?.d || '' },
                { id: 'icd.dinhNghiaEn', group: 'icd', groupLabel: 'ICD-10 chi tiết', label: 'ICD — Definition (EN)', get: ctx => ctx.icdDetail?.de || '' },
                { id: 'icd.flags', group: 'icd', groupLabel: 'ICD-10 chi tiết', label: 'ICD — Cờ mã hóa / PL', get: ctx => formatIcdFlagsText(ctx.icdDetail?.f) },
                { id: 'icd.whoGuide', group: 'icd', groupLabel: 'ICD-10 chi tiết', label: 'ICD — Hướng dẫn WHO 2019', get: ctx => ctx.icdDetail?.whoGuide || '' },
                { id: 'icd.raw', group: 'icd', groupLabel: 'ICD-10 chi tiết', label: 'ICD — Ghi chú gốc (dược thư)', get: ctx => ctx.icd?.raw || '' },
            ];
            const map = new Map();
            [...drugCols, ...bytCols, ...bvCols, ...icdCols].forEach(c => { if (!map.has(c.id)) map.set(c.id, c); });
            return [...map.values()];
        }

        function getActiveMappingColumns() {
            const catalog = getMappingColumnCatalog();
            const byId = new Map(catalog.map(c => [c.id, c]));
            return mappingReportState.selectedColumns.map(id => byId.get(id)).filter(Boolean);
        }

        function getDrugsForMappingReport() {
            const allFields = getAllFields();
            return drugs.filter(d => {
                if (mappingReportState.useSidebarFilters && !drugMatchesSearch(d, allFields)) return false;
                if (mappingReportState.useSidebarFilters && !drugMatchesFilters(d)) return false;
                if (mappingReportState.onlyWithByt && !(d.danhMucBYT || []).length) return false;
                if (mappingReportState.onlyWithBv && !(d.danhMucBenhVien || []).length) return false;
                if (mappingReportState.onlyWithIcd && !d.goiYMaICDChiDinh && !d.goiYMaICDChongChiDinh) return false;
                return true;
            });
        }

        function expandDrugToMappingContexts(drug, rowMode) {
            const emptyCtx = (extra = {}) => ({ drug, bytItem: null, bvItem: null, icd: null, icdDetail: null, ...extra });
            const icdChi = parseIcdSuggestionList(drug.goiYMaICDChiDinh, 'chi_dinh');
            const icdChong = parseIcdSuggestionList(drug.goiYMaICDChongChiDinh, 'chong_chi_dinh');
            const withIcd = (icd) => emptyCtx({ icd, icdDetail: getIcdDetailForMa(icd.ma) });
            switch (rowMode) {
                case 'byt':
                    return (drug.danhMucBYT || []).length ? drug.danhMucBYT.map(bytItem => emptyCtx({ bytItem })) : [emptyCtx()];
                case 'bv':
                    return (drug.danhMucBenhVien || []).length ? drug.danhMucBenhVien.map(bvItem => emptyCtx({ bvItem })) : [emptyCtx()];
                case 'icd_chi_dinh':
                    return icdChi.length ? icdChi.map(withIcd) : [emptyCtx()];
                case 'icd_chong':
                    return icdChong.length ? icdChong.map(withIcd) : [emptyCtx()];
                case 'icd_all': {
                    const all = [...icdChi, ...icdChong];
                    return all.length ? all.map(withIcd) : [emptyCtx()];
                }
                case 'byt_icd': {
                    const bytList = drug.danhMucBYT || [];
                    if (!bytList.length || !icdChi.length) return [emptyCtx()];
                    const rows = [];
                    bytList.forEach(bytItem => icdChi.forEach(icd => rows.push(emptyCtx({ bytItem, icd, icdDetail: getIcdDetailForMa(icd.ma) }))));
                    return rows;
                }
                default:
                    return [emptyCtx({ bytItem: (drug.danhMucBYT || [])[0] || null, bvItem: (drug.danhMucBenhVien || [])[0] || null })];
            }
        }

        function buildMappingReportRows() {
            const columns = getActiveMappingColumns();
            if (!columns.length) return { columns: [], rows: [] };
            const contexts = [];
            getDrugsForMappingReport().forEach(drug => {
                expandDrugToMappingContexts(drug, mappingReportState.rowMode).forEach(ctx => contexts.push(ctx));
            });
            const rows = contexts.map(ctx => {
                const row = {};
                columns.forEach(col => { row[col.id] = col.get(ctx) ?? ''; });
                return row;
            });
            return { columns, rows };
        }

        function applyMappingPreset(presetId) {
            const preset = MAPPING_PRESETS[presetId];
            if (!preset) return;
            mappingReportState.rowMode = preset.rowMode;
            mappingReportState.selectedColumns = [...preset.columns];
            saveMappingReportState();
            renderMappingPanel();
            showNotification(`Đã áp dụng mẫu: ${preset.label}`);
        }

        function toggleMappingColumn(colId, checked) {
            const set = new Set(mappingReportState.selectedColumns);
            if (checked) set.add(colId); else set.delete(colId);
            mappingReportState.selectedColumns = [...set];
            saveMappingReportState();
            renderMappingPreview();
        }

        function moveMappingColumn(colId, dir) {
            const cols = [...mappingReportState.selectedColumns];
            const idx = cols.indexOf(colId);
            if (idx < 0) return;
            const next = idx + dir;
            if (next < 0 || next >= cols.length) return;
            [cols[idx], cols[next]] = [cols[next], cols[idx]];
            mappingReportState.selectedColumns = cols;
            saveMappingReportState();
            renderMappingPanel();
        }

        function renderMappingConfigPanel() {
            const panel = document.getElementById('mappingConfigPanel');
            if (!panel) return;
            const catalog = getMappingColumnCatalog();
            const groups = [
                { id: 'duoc', label: 'Dược thư' },
                { id: 'byt', label: 'Danh mục BYT' },
                { id: 'bv', label: 'Danh mục BV' },
                { id: 'icd', label: 'ICD-10 chi tiết' },
            ];
            const presetsHtml = Object.entries(MAPPING_PRESETS).map(([id, p]) =>
                `<button type="button" class="mapping-preset-btn" onclick="applyMappingPreset('${id}')">${escapeHTML(p.label)}</button>`
            ).join('');
            const rowModeHtml = MAPPING_ROW_MODES.map(m => `
                <label class="flex items-start gap-2 py-1.5 cursor-pointer text-xs">
                    <input type="radio" name="mappingRowMode" value="${m.id}" ${mappingReportState.rowMode === m.id ? 'checked' : ''}
                        onchange="mappingReportState.rowMode=this.value; saveMappingReportState(); renderMappingPreview();" class="mt-0.5">
                    <span><strong class="text-gray-800">${escapeHTML(m.label)}</strong><br><span class="text-gray-500">${escapeHTML(m.desc)}</span></span>
                </label>`).join('');
            const selectedSet = new Set(mappingReportState.selectedColumns);
            let colsHtml = '';
            groups.forEach(g => {
                const items = catalog.filter(c => c.group === g.id);
                if (!items.length) return;
                colsHtml += `<div class="mapping-section-title">${escapeHTML(g.label)}</div>`;
                items.forEach(c => {
                    colsHtml += `<label class="mapping-col-item"><input type="checkbox" ${selectedSet.has(c.id) ? 'checked' : ''} onchange="toggleMappingColumn('${c.id}', this.checked)"><span>${escapeHTML(c.label)}</span></label>`;
                });
            });
            const orderHtml = mappingReportState.selectedColumns.map(id => {
                const col = catalog.find(c => c.id === id);
                if (!col) return '';
                return `<div class="flex items-center gap-1 text-[11px] py-0.5">
                    <span class="flex-1 truncate">${escapeHTML(col.label)}</span>
                    <button type="button" class="px-1 text-gray-500 hover:text-pink-700" onclick="moveMappingColumn('${id}', -1)" title="Lên">↑</button>
                    <button type="button" class="px-1 text-gray-500 hover:text-pink-700" onclick="moveMappingColumn('${id}', 1)" title="Xuống">↓</button>
                </div>`;
            }).join('');
            panel.innerHTML = `
                <div class="mb-3"><div class="mapping-section-title" style="margin-top:0">Mẫu nhanh</div>${presetsHtml}</div>
                <div class="mb-3"><div class="mapping-section-title">Kiểu dòng báo cáo</div>${rowModeHtml}</div>
                <div class="mb-3 space-y-1.5 text-xs">
                    <div class="mapping-section-title">Phạm vi dữ liệu</div>
                    <label class="flex items-center gap-2"><input type="checkbox" ${mappingReportState.useSidebarFilters ? 'checked' : ''} onchange="mappingReportState.useSidebarFilters=this.checked; saveMappingReportState(); renderMappingPreview();"> Áp dụng tìm kiếm &amp; bộ lọc sidebar</label>
                    <label class="flex items-center gap-2"><input type="checkbox" ${mappingReportState.onlyWithByt ? 'checked' : ''} onchange="mappingReportState.onlyWithByt=this.checked; saveMappingReportState(); renderMappingPreview();"> Chỉ thuốc có danh mục BYT</label>
                    <label class="flex items-center gap-2"><input type="checkbox" ${mappingReportState.onlyWithBv ? 'checked' : ''} onchange="mappingReportState.onlyWithBv=this.checked; saveMappingReportState(); renderMappingPreview();"> Chỉ thuốc có danh mục BV</label>
                    <label class="flex items-center gap-2"><input type="checkbox" ${mappingReportState.onlyWithIcd ? 'checked' : ''} onchange="mappingReportState.onlyWithIcd=this.checked; saveMappingReportState(); renderMappingPreview();"> Chỉ thuốc có gợi ý ICD</label>
                    <label class="flex items-center gap-2"><input type="checkbox" ${mappingReportState.enrichIcd ? 'checked' : ''} onchange="mappingReportState.enrichIcd=this.checked; saveMappingReportState(); renderMappingPreview();"> Bổ sung ICD từ danh mục TT06</label>
                </div>
                <div class="mb-3"><div class="mapping-section-title">Chọn cột xuất báo cáo</div>${colsHtml}</div>
                <div><div class="mapping-section-title">Thứ tự cột đã chọn</div>${orderHtml || '<p class="text-xs text-gray-400">Chưa chọn cột nào.</p>'}</div>`;
        }

        function renderMappingPreview() {
            const meta = document.getElementById('mappingPreviewMeta');
            const tableWrap = document.getElementById('mappingPreviewTable');
            if (!meta || !tableWrap) return;
            const { columns, rows } = buildMappingReportRows();
            const drugCount = getDrugsForMappingReport().length;
            const icdNote = mappingReportState.enrichIcd && !icdReady
                ? ' · ICD TT06 chưa tải — mở tab ICD-10 một lần để nạp đủ chi tiết.'
                : '';
            meta.innerHTML = `<strong>${rows.length.toLocaleString('vi-VN')}</strong> dòng · <strong>${columns.length}</strong> cột · <strong>${drugCount.toLocaleString('vi-VN')}</strong> hoạt chất${icdNote}`;
            if (!columns.length) {
                tableWrap.innerHTML = '<p class="text-sm text-gray-500 p-4">Chọn ít nhất một cột để xem trước báo cáo.</p>';
                return;
            }
            const previewCap = 250;
            const shown = rows.slice(0, previewCap);
            const head = columns.map(c => `<th class="border border-slate-200 px-2 py-1.5 text-left">${escapeHTML(c.label)}</th>`).join('');
            const body = shown.map(row => `<tr>${columns.map(c => `<td class="border border-slate-200 px-2 py-1.5">${escapeHTML(String(row[c.id] ?? ''))}</td>`).join('')}</tr>`).join('');
            tableWrap.innerHTML = `<table class="catalog-table mapping-preview-table min-w-full border-collapse"><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${columns.length}" class="text-center text-gray-400 py-6">Không có dòng phù hợp.</td></tr>`}</tbody></table>${rows.length > previewCap ? `<p class="text-xs text-gray-500 mt-2 text-center">Xem trước ${previewCap.toLocaleString('vi-VN')} / ${rows.length.toLocaleString('vi-VN')} dòng.</p>` : ''}`;
        }

        const MAPPING_SPLIT_KEY = 'duocThuMappingSplitPct';
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
                window.addEventListener('blur', stop, { once: true });
            });
            splitter.addEventListener('touchstart', (e) => {
                if (!e.touches[0]) return;
                start(e.touches[0].clientY);
                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', stop);
                document.addEventListener('touchcancel', stop);
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
        }

        async function toggleDuocMappingMode(forceOpen) {
            if (typeof forceOpen === 'boolean') duocMappingActive = forceOpen;
            else duocMappingActive = !duocMappingActive;
            const section = document.getElementById('sectionDuocThu');
            const panel = document.getElementById('duocMappingPanel');
            const btn = document.getElementById('btnDuocMapping');
            if (section) section.classList.toggle('mapping-mode', duocMappingActive);
            if (panel) {
                panel.classList.toggle('hidden', !duocMappingActive);
                panel.classList.toggle('is-active', duocMappingActive);
            }
            if (btn) {
                btn.classList.toggle('btn-primary', duocMappingActive);
                btn.classList.toggle('btn-secondary', !duocMappingActive);
            }
            saveUiState();
            if (duocMappingActive) {
                if (!icdReady && typeof initIcdCatalog === 'function') {
                    try { await initIcdCatalog(); } catch (_) { /* ignore */ }
                }
                renderMappingPanel();
            } else {
                updateUI();
            }
        }

        function mappingEscapeCsv(val) {
            if (val === null || val === undefined) return '';
            const strVal = String(val);
            if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n') || strVal.includes('\r')) {
                return `"${strVal.replace(/"/g, '""')}"`;
            }
            return strVal;
        }

        function downloadMappingFile(blob, filename) {
            const a = document.createElement('a');
            const url = URL.createObjectURL(blob);
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
        }

        function exportMappingReport(format) {
            try {
                const { columns, rows } = buildMappingReportRows();
                if (!columns.length) return showNotification('Chọn ít nhất một cột trước khi xuất.');
                if (!rows.length) return showNotification('Không có dữ liệu phù hợp để xuất.');
                const exportCols = columns.map(c => ({ key: c.id, label: c.label }));
                const stamp = new Date().toISOString().slice(0, 10);
                const baseName = `Mapping_DuocThu_${mappingReportState.rowMode}_${stamp}`;
                if (format === 'csv' || format === 'xlsx') {
                    const header = exportCols.map(c => mappingEscapeCsv(c.label)).join(',');
                    const lines = rows.map(r => exportCols.map(c => mappingEscapeCsv(r[c.key])).join(','));
                    const csvBlob = new Blob(['\ufeff' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
                    if (format === 'csv') {
                        downloadMappingFile(csvBlob, `${baseName}.csv`);
                        showNotification(`Đã xuất CSV (${rows.length.toLocaleString('vi-VN')} dòng).`);
                        return;
                    }
                    if (typeof XLSX === 'undefined') {
                        downloadMappingFile(csvBlob, `${baseName}.csv`);
                        showNotification(`Excel chưa tải — đã xuất CSV (${rows.length.toLocaleString('vi-VN')} dòng).`);
                        return;
                    }
                    try {
                        const sheetRows = rows.map(r => {
                            const o = {};
                            exportCols.forEach(c => { o[c.label] = r[c.key] ?? ''; });
                            return o;
                        });
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetRows), 'Mapping');
                        XLSX.writeFile(wb, `${baseName}.xlsx`);
                        showNotification(`Đã xuất Excel (${rows.length.toLocaleString('vi-VN')} dòng).`);
                    } catch (_) {
                        downloadMappingFile(csvBlob, `${baseName}.csv`);
                        showNotification(`Không ghi được Excel — đã xuất CSV (${rows.length.toLocaleString('vi-VN')} dòng).`);
                    }
                }
            } catch (err) {
                console.error('exportMappingReport', err);
                showNotification('Lỗi xuất báo cáo: ' + (err?.message || 'không xác định'));
            }
        }

        loadMappingReportState();
