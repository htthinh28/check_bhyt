
    // === BÁO CÁO TÙY BIẾN — TAB ĐẦY ĐỦ ===
    const DVKT_REPORT_STORAGE_KEY = 'dvkt_report_state_v2';

    const REPORT_SOURCE_TABS = [
      { id: 'mapfull', label: 'Mapping tổng hợp (7603+TT23+PVHN+3 BV)', short: 'Tổng hợp' },
      { id: 'pl1', label: 'QĐ 7603 — Phụ lục 01', short: 'PL1' },
      { id: 'pl2', label: 'QĐ 7603 — Phụ lục 02', short: 'PL2' },
      { id: 'pl3', label: 'QĐ 7603 — Phụ lục 03', short: 'PL3' },
      { id: 'tt23pl1', label: 'TT23 — Phụ lục 1', short: 'TT23-PL1' },
      { id: 'tt23pl2', label: 'TT23 — Phụ lục 2', short: 'TT23-PL2' },
      { id: 'bvpcst', label: 'BV PC Sóc Trăng', short: 'PCST' },
      { id: 'bvpcct', label: 'BV PC Cần Thơ', short: 'PCCT' },
      { id: 'bvpsd', label: 'BV Sa Đéc', short: 'Sa Đéc' },
      { id: 'pvhnbhxh', label: 'PVHN BHXH 2024 — Chức danh CM', short: 'BHXH' },
    ];

    const DVKT_REPORT_PRESETS = {
      tat_ca_tong_hop: {
        label: 'Tất cả cột — Mapping tổng hợp',
        sourceTab: 'mapfull',
        allColumns: true,
      },
      day_du: {
        label: 'Mapping đầy đủ 7603 + TT23 + PVHN + BHXH',
        sourceTab: 'pl1',
        columns: [
          'pl1::maTuongDuong', 'pl1::maTT43', 'pl1::tenTT43', 'pl1::phanTuyen',
          'pl1::maKyThuatTT23', 'pl1::tenKyThuatTT23', 'pl1::theLienKetTT23',
          'pl1::thePhamViHanhNghe', 'pl1::tenPhamViHanhNghe', 'pl1::chuyenKhoaPVHN',
          'pl1::maPhamViBHXH', 'pl1::tenChucDanhBHXH', 'pl1::soChucDanhBHXH', 'pl1::doTinCayBHXH',
          'pl1::doTinCayMapping', 'pl1::doTinCayPhamVi',
        ],
      },
      map_chi_tiet: {
        label: 'Đối chiếu đa BV + QĐ7603 + TT23 + PVHN + BHXH',
        sourceTab: 'mapfull',
        columns: [
          'mapfull::mucDoMapping', 'mapfull::soBvCo', 'mapfull::maTuongDuong', 'mapfull::maTT43', 'mapfull::tenTT43',
          'mapfull::maKyThuatTT23', 'mapfull::tenKyThuatTT23', 'mapfull::thePhamViHanhNghe', 'mapfull::chuyenKhoaPVHN',
          'mapfull::maPhamViBHXH', 'mapfull::tenChucDanhBHXH', 'mapfull::doTinCayBHXH',
          'mapfull::maDichVuPCST', 'mapfull::donGiaPCST', 'mapfull::maDichVuPCCT', 'mapfull::donGiaPCCT',
          'mapfull::maDichVuPSD', 'mapfull::donGiaPSD', 'mapfull::chenhGiaBv',
        ],
      },
      gia_3_bv: {
        label: 'So sánh đơn giá 3 bệnh viện',
        sourceTab: 'mapfull',
        columns: [
          'mapfull::maTuongDuong', 'mapfull::tenTT43', 'mapfull::soBvCo',
          'mapfull::maDichVuPCST', 'mapfull::tenDichVuPCST', 'mapfull::donGiaPCST',
          'mapfull::maDichVuPCCT', 'mapfull::tenDichVuPCCT', 'mapfull::donGiaPCCT',
          'mapfull::maDichVuPSD', 'mapfull::tenDichVuPSD', 'mapfull::donGiaPSD',
          'mapfull::chenhGiaBv',
        ],
      },
      phamvi_bsyk: {
        label: 'Kỹ thuật BS Y khoa',
        sourceTab: 'pl1',
        filterPhamVi: 'PVHN_BSYK',
        columns: ['pl1::maTT43', 'pl1::tenTT43', 'pl1::thePhamViHanhNghe', 'pl1::doTinCayPhamVi'],
      },
      chua_pvhn: {
        label: 'Chưa gắn phạm vi hành nghề',
        sourceTab: 'pl1',
        onlyNoPvhn: true,
        columns: ['pl1::maTT43', 'pl1::tenTT43', 'pl1::maKyThuatTT23', 'pl1::doTinCayMapping'],
      },
      bhxh_day_du: {
        label: 'DVKT đã map BHXH (đầy đủ)',
        sourceTab: 'pl1',
        columns: [
          'pl1::maTT43', 'pl1::tenTT43', 'pl1::thePhamViHanhNghe', 'pl1::chuyenKhoaPVHN',
          'pl1::maPhamViBHXH', 'pl1::tenChucDanhBHXH', 'pl1::soChucDanhBHXH', 'pl1::doTinCayBHXH',
          'pl1::maKyThuatTT23', 'pl1::doTinCayMapping',
        ],
      },
      chua_bhxh: {
        label: 'DVKT chưa có mã BHXH',
        sourceTab: 'pl1',
        onlyNoBhxh: true,
        columns: ['pl1::maTT43', 'pl1::tenTT43', 'pl1::thePhamViHanhNghe', 'pl1::maKyThuatTT23'],
      },
      bhxh_chuc_danh: {
        label: 'Danh mục chức danh BHXH + DVKT',
        sourceTab: 'pvhnbhxh',
        allColumns: true,
      },
      bhxh_crosswalk: {
        label: 'Crosswalk BHXH ↔ QĐ7603',
        sourceTab: 'pvhnbhxh',
        columns: [
          'pvhnbhxh::maPhamVi', 'pvhnbhxh::chucDanh', 'pvhnbhxh::pvhnTagTT32',
          'pvhnbhxh::soDvktDuocPhep', 'pvhnbhxh::soDvktTT23', 'pvhnbhxh::soDvktTaiBV',
          'pvhnbhxh::maDvktMau', 'pvhnbhxh::maTuongDuongMau', 'pvhnbhxh::tenDvktMau',
        ],
      },
      tt23_bhxh: {
        label: 'TT23 + PVHN + BHXH',
        sourceTab: 'tt23pl1',
        columns: [
          'tt23pl1::maKyThuat', 'tt23pl1::tenKyThuat', 'tt23pl1::lienKetQD7603',
          'tt23pl1::thePhamViHanhNghe', 'tt23pl1::maPhamViBHXH', 'tt23pl1::tenChucDanhBHXH', 'tt23pl1::doTinCayBHXH',
        ],
      },
      bv_bhxh: {
        label: 'BV + PVHN + BHXH',
        sourceTab: 'bvpcst',
        columns: [
          'bvpcst::maDichVu', 'bvpcst::tenDichVu', 'bvpcst::lienKetQD7603', 'bvpcst::maTT43',
          'bvpcst::thePhamViHanhNghe', 'bvpcst::maPhamViBHXH', 'bvpcst::tenChucDanhBHXH', 'bvpcst::donGia',
        ],
      },
    };

    let dvktReportState = {
      sourceTab: 'mapfull',
      selectedColumnIds: [],
      columnSearch: '',
      searchTerm: '',
      filterPhamVi: '',
      filterTheNguon: '',
      filterPhanTuyen: '',
      onlyNoPvhn: false,
      onlyWithPvhn: false,
      onlyNoBhxh: false,
      onlyWithBhxh: false,
      onlyMappedTT23: false,
    };

    function reportTabMeta(tabId) {
      return REPORT_SOURCE_TABS.find(t => t.id === tabId) || { id: tabId, label: tabId, short: tabId };
    }

    function ensureReportSourceData(tabId) {
      if (tabId === 'mapfull') ensureMasterMapTab();
      if (tabId === 'pvhnbhxh' && typeof ensureTabLoaded === 'function') {
        return ensureTabLoaded('pvhnbhxh');
      }
    }

    function getReportColumnDefs(tabId) {
      ensureReportSourceData(tabId);
      if (tabId === 'mapfull' && typeof MASTER_MAP_COLUMNS !== 'undefined') {
        return MASTER_MAP_COLUMNS;
      }
      return (state.columns[tabId] || []).slice();
    }

    function formatReportExportValue(key, row, sourceTab) {
      const val = row[key];
      if (val === undefined || val === null) return '';
      if (key === 'tagsMapping') {
        if (sourceTab === 'mapfull' && typeof renderMasterMappingBadges === 'function') {
          return reportBadgesToText(row, 'mapfull');
        }
        return reportBadgesToText(row, sourceTab);
      }
      if (key === 'thePhamViHanhNghe') return getPvhnTagLabels(val) || val;
      if (key === 'maPhamViBHXH' || key === 'tenChucDanhBHXH') return val;
      if (key === 'pvhnTagTT32') return getPvhnTagLabels(val) || val;
      if (key === 'theNguonGoc' || key === 'theLienKetTT23') {
        return (SOURCE_TAGS[val] && SOURCE_TAGS[val].label) || val;
      }
      if (typeof val === 'number' && String(key).toLowerCase().includes('gia')) {
        return val;
      }
      return val;
    }

    function reportBadgesToText(row, tab) {
      const parts = [];
      if (tab === 'mapfull' || row.maTuongDuong || row.lienKetQD7603) parts.push('QĐ7603');
      if (row.theLienKetTT23) parts.push(row.theLienKetTT23 === 'TT23_PL1' ? 'TT23-PL1' : row.theLienKetTT23 === 'TT23_PL2' ? 'TT23-PL2' : row.theLienKetTT23);
      const pv = getPvhnTagLabels(row.thePhamViHanhNghe);
      if (pv) parts.push(pv);
      const bhxh = row.maPhamViBHXH || (row.maPhamVi ? `CD:${row.maPhamVi}` : '');
      if (bhxh) parts.push(String(bhxh).split(';').join(', '));
      if (tab === 'mapfull') {
        if (row.coPCST === 'Có') parts.push('PCST');
        if (row.coPCCT === 'Có') parts.push('PCCT');
        if (row.coPSD === 'Có') parts.push('Sa Đéc');
      }
      return parts.join(' | ');
    }

    function buildFullReportCatalog(sourceTab) {
      const meta = reportTabMeta(sourceTab);
      const defs = getReportColumnDefs(sourceTab);
      return defs.map(col => ({
        id: `${sourceTab}::${col.key}`,
        sourceTab,
        key: col.key,
        group: sourceTab,
        groupLabel: meta.label,
        label: `${meta.short} — ${col.label}`,
        shortLabel: col.label,
        type: col.type || 'text',
        get: row => formatReportExportValue(col.key, row, sourceTab),
      }));
    }

    function getFullReportCatalog() {
      return buildFullReportCatalog(dvktReportState.sourceTab);
    }

    function loadDvktReportState() {
      try {
        const raw = localStorage.getItem(DVKT_REPORT_STORAGE_KEY);
        if (!raw) return;
        const s = JSON.parse(raw);
        if (Array.isArray(s.selectedColumnIds)) dvktReportState.selectedColumnIds = s.selectedColumnIds;
        ['sourceTab', 'columnSearch', 'searchTerm', 'filterPhamVi', 'filterTheNguon', 'filterPhanTuyen',
          'onlyNoPvhn', 'onlyWithPvhn', 'onlyNoBhxh', 'onlyWithBhxh', 'onlyMappedTT23'].forEach(k => {
          if (s[k] !== undefined) dvktReportState[k] = s[k];
        });
      } catch (_) { /* ignore */ }
    }

    function saveDvktReportState() {
      try {
        localStorage.setItem(DVKT_REPORT_STORAGE_KEY, JSON.stringify(dvktReportState));
      } catch (_) { /* ignore */ }
    }

    function getActiveReportColumns() {
      const catalog = getFullReportCatalog();
      const byId = new Map(catalog.map(c => [c.id, c]));
      const selected = dvktReportState.selectedColumnIds.length
        ? dvktReportState.selectedColumnIds
        : catalog.map(c => c.id);
      return selected.map(id => byId.get(id)).filter(Boolean);
    }

    function applyReportRowFilters(rows, tab) {
      let data = rows.slice();
      const st = dvktReportState;

      if (st.searchTerm.trim()) {
        const term = st.searchTerm.toLowerCase();
        data = data.filter(item => Object.values(item).some(val => val != null && String(val).toLowerCase().includes(term)));
      }
      if (st.filterPhanTuyen && ['pl1', 'pl2', 'pl3', 'mapfull'].includes(tab)) {
        data = data.filter(item => item.phanTuyen === st.filterPhanTuyen);
      }
      if (st.filterPhamVi) {
        const f = st.filterPhamVi;
        data = data.filter(item => {
          const tags = String(item.thePhamViHanhNghe || '').split(';');
          if (f === 'PVHN_BSCK') return tags.some(t => t === 'PVHN_BSCK' || t.startsWith('PVHN_BSCK_'));
          if (f === 'CO_PVHN') return !!item.thePhamViHanhNghe;
          if (f === 'KHONG_PVHN') return !item.thePhamViHanhNghe;
          return tags.includes(f);
        });
      }
      if (st.filterTheNguon) {
        const f = st.filterTheNguon;
        data = data.filter(item => {
          if (f === 'FULL_ALL') return !!item.maTuongDuong && !!item.theLienKetTT23 && !!item.thePhamViHanhNghe && !!item.maPhamViBHXH && (item.soBvCo >= 1);
          if (f === 'FULL_7603_TT23_PVHN') return !!item.maTuongDuong && !!item.theLienKetTT23 && !!item.thePhamViHanhNghe;
          if (f === 'FULL_7603_TT23_PVHN_BHXH') return !!item.maTuongDuong && !!item.theLienKetTT23 && !!item.thePhamViHanhNghe && !!item.maPhamViBHXH;
          if (f === 'CO_BHXH') return tab === 'pvhnbhxh' ? (item.soDvktDuocPhep > 0) : !!item.maPhamViBHXH;
          if (f === 'KHONG_BHXH') return tab === 'pvhnbhxh' ? !(item.soDvktDuocPhep > 0) : !item.maPhamViBHXH;
          if (f === 'CO_CA_3_BV') return item.soBvCo === 3;
          if (f === 'CO_IT_NHAT_1_BV') return item.soBvCo >= 1;
          if (f === 'CHENH_GIA_BV') return item.chenhGiaBv > 0;
          if (f === 'CHUA_DU_MAPPING') return !item.theLienKetTT23 || !item.thePhamViHanhNghe || item.soBvCo === 0;
          if (f === 'CHI_BV_CHUA_MAP') return item.loaiDong && item.loaiDong !== 'QĐ7603';
          if (f === 'KHONG_TT23') return item.loaiDong === 'QĐ7603' && !item.theLienKetTT23;
          if (f === 'CO_TAI_BV_PCST') return item.coPCST === 'Có' || item.coTaiBV_PCST === 'Có';
          if (f === 'CO_TAI_BV_PCCT') return item.coPCCT === 'Có' || item.coTaiBV_PCCT === 'Có';
          if (f === 'CO_TAI_BV_PSD') return item.coPSD === 'Có' || item.coTaiBV_PSD === 'Có';
          if (f === 'DA_LIEN_KET') return tab.startsWith('bv') ? !!item.lienKetQD7603 : !!item.theLienKetTT23;
          if (f === 'KHONG_KHOP') return tab.startsWith('bv') ? !item.lienKetQD7603 : !item.theLienKetTT23;
          if (f === 'FULL_MAPPING') return !!item.theLienKetTT23 && !!item.thePhamViHanhNghe && !!item.maPhamViBHXH;
          if (f === 'CO_PVHN') return !!item.thePhamViHanhNghe;
          if (f === 'KHONG_PVHN') return !item.thePhamViHanhNghe;
          if (f === 'QD_7603') return !!item.maTuongDuong;
          if (f === 'TT23_PL1') return item.theLienKetTT23 === 'TT23_PL1';
          if (f === 'TT23_PL2') return item.theLienKetTT23 === 'TT23_PL2';
          return true;
        });
      }
      if (st.onlyNoPvhn) data = data.filter(r => !r.thePhamViHanhNghe);
      if (st.onlyWithPvhn) data = data.filter(r => !!r.thePhamViHanhNghe);
      if (st.onlyNoBhxh) data = data.filter(r => tab === 'pvhnbhxh' ? !(r.soDvktDuocPhep > 0) : !r.maPhamViBHXH);
      if (st.onlyWithBhxh) data = data.filter(r => tab === 'pvhnbhxh' ? (r.soDvktDuocPhep > 0) : !!r.maPhamViBHXH);
      if (st.onlyMappedTT23) {
        data = data.filter(r => tab === 'mapfull' ? !!r.theLienKetTT23 : tab.startsWith('bv') ? !!r.lienKetQD7603 : !!r.theLienKetTT23);
      }
      return data;
    }

    function getDvktReportRows() {
      const tab = dvktReportState.sourceTab || 'mapfull';
      ensureReportSourceData(tab);
      const raw = state.datasets[tab] || [];
      const filtered = applyReportRowFilters(raw, tab);
      const columns = getActiveReportColumns();
      const rows = filtered.map(r => {
        const o = {};
        columns.forEach(c => { o[c.id] = c.get(r); });
        return o;
      });
      return { columns, rows, sourceCount: filtered.length, sourceTab: tab };
    }

    function applyDvktReportPreset(presetId) {
      const preset = DVKT_REPORT_PRESETS[presetId];
      if (!preset) return;
      dvktReportState.sourceTab = preset.sourceTab || 'mapfull';
      if (preset.allColumns) {
        dvktReportState.selectedColumnIds = buildFullReportCatalog(dvktReportState.sourceTab).map(c => c.id);
      } else {
        dvktReportState.selectedColumnIds = [...(preset.columns || [])];
      }
      dvktReportState.filterPhamVi = preset.filterPhamVi || '';
      dvktReportState.onlyNoPvhn = !!preset.onlyNoPvhn;
      dvktReportState.onlyWithPvhn = !!preset.onlyWithPvhn;
      dvktReportState.onlyNoBhxh = !!preset.onlyNoBhxh;
      dvktReportState.onlyWithBhxh = !!preset.onlyWithBhxh;
      dvktReportState.onlyMappedTT23 = !!preset.onlyMappedTT23;
      saveDvktReportState();
      renderReportTabPanel();
    }

    function toggleReportColumn(colId, checked) {
      if (checked) {
        if (!dvktReportState.selectedColumnIds.includes(colId)) {
          dvktReportState.selectedColumnIds.push(colId);
        }
      } else {
        dvktReportState.selectedColumnIds = dvktReportState.selectedColumnIds.filter(id => id !== colId);
      }
      saveDvktReportState();
      updateDvktReportPreview();
      updateReportSelectedCount();
    }

    function selectAllReportColumns(checked) {
      const catalog = getFilteredReportCatalog();
      const ids = catalog.map(c => c.id);
      if (checked) {
        const set = new Set([...dvktReportState.selectedColumnIds, ...ids]);
        dvktReportState.selectedColumnIds = [...set];
      } else {
        const remove = new Set(ids);
        dvktReportState.selectedColumnIds = dvktReportState.selectedColumnIds.filter(id => !remove.has(id));
      }
      saveDvktReportState();
      updateDvktReportPreview();
      updateReportSelectedCount();
      renderReportColumnPicker();
    }

    function moveReportColumn(colId, dir) {
      const arr = dvktReportState.selectedColumnIds;
      const idx = arr.indexOf(colId);
      if (idx < 0) return;
      const next = idx + dir;
      if (next < 0 || next >= arr.length) return;
      const copy = arr.slice();
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      dvktReportState.selectedColumnIds = copy;
      saveDvktReportState();
      renderReportSelectedColumns();
      updateDvktReportPreview();
    }

    function getFilteredReportCatalog() {
      const q = (dvktReportState.columnSearch || '').toLowerCase().trim();
      const catalog = getFullReportCatalog();
      if (!q) return catalog;
      return catalog.filter(c =>
        c.label.toLowerCase().includes(q) ||
        c.key.toLowerCase().includes(q) ||
        c.shortLabel.toLowerCase().includes(q)
      );
    }

    function updateReportSelectedCount() {
      const el = document.getElementById('reportSelectedColCount');
      if (el) el.textContent = String(dvktReportState.selectedColumnIds.length);
      const totalEl = document.getElementById('reportTotalColCount');
      if (totalEl) totalEl.textContent = String(getFullReportCatalog().length);
    }

    function renderReportSelectedColumns() {
      const wrap = document.getElementById('reportSelectedColumns');
      if (!wrap) return;
      const catalog = getFullReportCatalog();
      const byId = new Map(catalog.map(c => [c.id, c]));
      const items = dvktReportState.selectedColumnIds.map(id => byId.get(id)).filter(Boolean);
      if (!items.length) {
        wrap.innerHTML = '<p class="text-xs text-slate-400 p-2">Chưa chọn cột nào — tick bên trái hoặc dùng preset.</p>';
        return;
      }
      wrap.innerHTML = items.map(c => `
        <div class="flex items-center justify-between gap-2 py-1 px-2 bg-white border border-slate-200 rounded-lg text-xs">
          <span class="truncate flex-1" title="${c.label}">${c.shortLabel}</span>
          <span class="flex gap-1 shrink-0">
            <button type="button" onclick="moveReportColumn('${c.id}', -1)" class="px-1.5 py-0.5 border rounded hover:bg-slate-100" title="Lên">↑</button>
            <button type="button" onclick="moveReportColumn('${c.id}', 1)" class="px-1.5 py-0.5 border rounded hover:bg-slate-100" title="Xuống">↓</button>
            <button type="button" onclick="toggleReportColumn('${c.id}', false); renderReportColumnPicker();" class="px-1.5 py-0.5 border rounded text-red-600 hover:bg-red-50" title="Bỏ">✕</button>
          </span>
        </div>`).join('');
    }

    function renderReportColumnPicker() {
      const wrap = document.getElementById('reportColumnPicker');
      if (!wrap) return;
      const catalog = getFilteredReportCatalog();
      if (!catalog.length) {
        wrap.innerHTML = '<p class="text-xs text-slate-400 p-3">Không tìm thấy cột phù hợp.</p>';
        return;
      }
      wrap.innerHTML = catalog.map(c => {
        const checked = dvktReportState.selectedColumnIds.includes(c.id) ? 'checked' : '';
        const typeBadge = c.type === 'number' ? '🔢' : c.type === 'computed' ? '⚙' : '📝';
        return `<label class="flex items-start gap-2 text-xs text-slate-700 py-1 px-1 hover:bg-white rounded cursor-pointer">
          <input type="checkbox" ${checked} onchange="toggleReportColumn('${c.id}', this.checked)" class="mt-0.5 rounded border-slate-300 text-indigo-600" />
          <span><span class="opacity-60">${typeBadge}</span> ${c.shortLabel}</span>
        </label>`;
      }).join('');
      updateReportSelectedCount();
    }

    function onReportSourceTabChange(tabId) {
      dvktReportState.sourceTab = tabId;
      dvktReportState.selectedColumnIds = [];
      saveDvktReportState();
      if (typeof ensureTabLoaded === 'function') {
        ensureTabLoaded(tabId).then(() => renderReportTabPanel()).catch(console.error);
      } else {
        renderReportTabPanel();
      }
    }

    function renderReportTabPanel() {
      const root = document.getElementById('dvktReportPanel');
      if (!root) return;
      loadDvktReportState();
      ensureReportSourceData(dvktReportState.sourceTab);

      const sourceOptions = REPORT_SOURCE_TABS.map(t =>
        `<option value="${t.id}" ${dvktReportState.sourceTab === t.id ? 'selected' : ''}>${t.label}</option>`
      ).join('');
      const presetsHtml = Object.entries(DVKT_REPORT_PRESETS).map(([id, p]) =>
        `<button type="button" onclick="applyDvktReportPreset('${id}')" class="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 text-slate-700 whitespace-nowrap">${p.label}</button>`
      ).join('');
      const pvhnOptions = Object.entries(PVHN_TAGS).map(([id, t]) =>
        `<option value="${id}" ${dvktReportState.filterPhamVi === id ? 'selected' : ''}>${t.label}</option>`
      ).join('');

      root.innerHTML = `
        <div class="space-y-4">
          <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <h2 class="text-base font-bold text-indigo-900 mb-1">Báo cáo tùy biến</h2>
            <p class="text-xs text-indigo-700">Chọn nguồn dữ liệu, tick bất kỳ trường nào, sắp xếp thứ tự cột và xuất file Excel (.xlsx).</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="lg:col-span-1 space-y-3">
              <div>
                <label class="text-xs font-semibold text-slate-600">Nguồn dữ liệu</label>
                <select onchange="onReportSourceTabChange(this.value)" class="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm">${sourceOptions}</select>
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-600">Preset nhanh</label>
                <div class="flex flex-wrap gap-1.5 mt-1 max-h-24 overflow-y-auto">${presetsHtml}</div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-semibold text-slate-600">Chọn cột (<span id="reportSelectedColCount">0</span>/<span id="reportTotalColCount">0</span>)</label>
                  <div class="flex gap-1">
                    <button type="button" onclick="selectAllReportColumns(true)" class="text-[10px] px-2 py-0.5 border rounded bg-white hover:bg-slate-50">Tất cả</button>
                    <button type="button" onclick="selectAllReportColumns(false)" class="text-[10px] px-2 py-0.5 border rounded bg-white hover:bg-slate-50">Bỏ hết</button>
                  </div>
                </div>
                <input type="text" placeholder="Lọc tên cột..." value="${dvktReportState.columnSearch || ''}"
                  oninput="dvktReportState.columnSearch=this.value; saveDvktReportState(); renderReportColumnPicker();"
                  class="w-full mb-2 border border-slate-300 rounded-lg p-2 text-xs" />
                <div id="reportColumnPicker" class="max-h-52 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50"></div>
              </div>
            </div>

            <div class="lg:col-span-1 space-y-3">
              <div>
                <label class="text-xs font-semibold text-slate-600">Thứ tự cột đã chọn (xuất Excel theo thứ tự này)</label>
                <div id="reportSelectedColumns" class="max-h-72 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50 mt-1 space-y-1"></div>
              </div>
              <div class="grid grid-cols-1 gap-2 text-xs">
                <label class="text-xs font-semibold text-slate-600">Lọc tìm kiếm dòng</label>
                <input type="text" placeholder="Tìm trong dữ liệu báo cáo..." value="${dvktReportState.searchTerm || ''}"
                  oninput="dvktReportState.searchTerm=this.value; saveDvktReportState(); updateDvktReportPreview();"
                  class="border border-slate-300 rounded-lg p-2 text-sm" />
                <select onchange="dvktReportState.filterTheNguon=this.value; saveDvktReportState(); updateDvktReportPreview();" class="border border-slate-300 rounded-lg p-2 text-sm">
                  <option value="">— Mọi trạng thái mapping —</option>
                  <option value="FULL_ALL" ${dvktReportState.filterTheNguon === 'FULL_ALL' ? 'selected' : ''}>Đủ 7603+TT23+PVHN+có BV</option>
                  <option value="FULL_7603_TT23_PVHN_BHXH" ${dvktReportState.filterTheNguon === 'FULL_7603_TT23_PVHN_BHXH' ? 'selected' : ''}>Đủ 7603+TT23+PVHN+BHXH</option>
                  <option value="CO_BHXH" ${dvktReportState.filterTheNguon === 'CO_BHXH' ? 'selected' : ''}>Đã có mã BHXH</option>
                  <option value="KHONG_BHXH" ${dvktReportState.filterTheNguon === 'KHONG_BHXH' ? 'selected' : ''}>Chưa có mã BHXH</option>
                  <option value="CO_CA_3_BV" ${dvktReportState.filterTheNguon === 'CO_CA_3_BV' ? 'selected' : ''}>Có tại cả 3 BV</option>
                  <option value="CHENH_GIA_BV" ${dvktReportState.filterTheNguon === 'CHENH_GIA_BV' ? 'selected' : ''}>Chênh giá giữa BV</option>
                  <option value="CHUA_DU_MAPPING" ${dvktReportState.filterTheNguon === 'CHUA_DU_MAPPING' ? 'selected' : ''}>Chưa đủ mapping</option>
                  <option value="CHI_BV_CHUA_MAP" ${dvktReportState.filterTheNguon === 'CHI_BV_CHUA_MAP' ? 'selected' : ''}>Chỉ BV chưa QĐ7603</option>
                </select>
                <select onchange="dvktReportState.filterPhamVi=this.value; saveDvktReportState(); updateDvktReportPreview();" class="border border-slate-300 rounded-lg p-2 text-sm">
                  <option value="">— Mọi PVHN —</option>${pvhnOptions}
                </select>
                <select onchange="dvktReportState.filterPhanTuyen=this.value; saveDvktReportState(); updateDvktReportPreview();" class="border border-slate-300 rounded-lg p-2 text-sm">
                  <option value="">— Mọi phân tuyến —</option>
                  <option value="A" ${dvktReportState.filterPhanTuyen === 'A' ? 'selected' : ''}>Tuyến A</option>
                  <option value="B" ${dvktReportState.filterPhanTuyen === 'B' ? 'selected' : ''}>Tuyến B</option>
                  <option value="C" ${dvktReportState.filterPhanTuyen === 'C' ? 'selected' : ''}>Tuyến C</option>
                  <option value="D" ${dvktReportState.filterPhanTuyen === 'D' ? 'selected' : ''}>Tuyến D</option>
                </select>
                <label class="flex items-center gap-2"><input type="checkbox" ${dvktReportState.onlyWithPvhn ? 'checked' : ''} onchange="dvktReportState.onlyWithPvhn=this.checked; dvktReportState.onlyNoPvhn=false; saveDvktReportState(); updateDvktReportPreview();" class="rounded" /> Chỉ có PVHN</label>
                <label class="flex items-center gap-2"><input type="checkbox" ${dvktReportState.onlyNoPvhn ? 'checked' : ''} onchange="dvktReportState.onlyNoPvhn=this.checked; dvktReportState.onlyWithPvhn=false; saveDvktReportState(); updateDvktReportPreview();" class="rounded" /> Chỉ chưa PVHN</label>
                <label class="flex items-center gap-2"><input type="checkbox" ${dvktReportState.onlyMappedTT23 ? 'checked' : ''} onchange="dvktReportState.onlyMappedTT23=this.checked; saveDvktReportState(); updateDvktReportPreview();" class="rounded" /> Chỉ đã map TT23</label>
                <label class="flex items-center gap-2"><input type="checkbox" ${dvktReportState.onlyWithBhxh ? 'checked' : ''} onchange="dvktReportState.onlyWithBhxh=this.checked; dvktReportState.onlyNoBhxh=false; saveDvktReportState(); updateDvktReportPreview();" class="rounded" /> Chỉ có BHXH</label>
                <label class="flex items-center gap-2"><input type="checkbox" ${dvktReportState.onlyNoBhxh ? 'checked' : ''} onchange="dvktReportState.onlyNoBhxh=this.checked; dvktReportState.onlyWithBhxh=false; saveDvktReportState(); updateDvktReportPreview();" class="rounded" /> Chỉ chưa BHXH</label>
              </div>
            </div>

            <div class="lg:col-span-1 flex flex-col gap-3">
              <div class="flex flex-wrap gap-2">
                <button type="button" onclick="exportDvktReport()" class="flex-1 min-w-[140px] px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md">📤 Xuất Excel (.xlsx)</button>
              </div>
              <div class="flex-1 min-h-[200px]">
                <p class="text-xs font-semibold text-slate-600 mb-1">Xem trước — <span id="reportPreviewCount">0</span> dòng</p>
                <div id="reportPreviewTable" class="overflow-x-auto border border-slate-200 rounded-lg text-xs max-h-80 bg-white"></div>
              </div>
            </div>
          </div>
        </div>`;

      renderReportColumnPicker();
      renderReportSelectedColumns();
      updateDvktReportPreview();
    }

    function updateDvktReportPreview() {
      const { columns, rows, sourceCount } = getDvktReportRows();
      const countEl = document.getElementById('reportPreviewCount');
      if (countEl) countEl.textContent = String(sourceCount);
      const wrap = document.getElementById('reportPreviewTable');
      if (!wrap) return;
      if (!columns.length) {
        wrap.innerHTML = '<p class="p-3 text-slate-400">Chọn ít nhất một cột.</p>';
        return;
      }
      if (!rows.length) {
        wrap.innerHTML = '<p class="p-3 text-slate-400">Không có dữ liệu phù hợp bộ lọc.</p>';
        return;
      }
      const preview = rows.slice(0, 12);
      const th = columns.map(c => `<th class="p-2 text-left bg-slate-100 border-b whitespace-nowrap">${c.shortLabel || c.label}</th>`).join('');
      const tr = preview.map(r => `<tr>${columns.map(c => {
        const v = r[c.id] ?? '';
        const disp = typeof v === 'number' && String(c.key).toLowerCase().includes('gia') ? Number(v).toLocaleString('vi-VN') : String(v);
        return `<td class="p-2 border-b truncate max-w-[160px]" title="${disp.replace(/"/g, '&quot;')}">${disp || '—'}</td>`;
      }).join('')}</tr>`).join('');
      wrap.innerHTML = `<table class="w-full"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
    }

    function openReportModal() {
      switchTab('baocao');
    }

    function closeReportModal() {
      switchTab('pl1');
    }

    async function exportDvktReport() {
      try {
        if (typeof ensureTabLoaded === 'function') {
          setDvktLoading(true, 'Đang chuẩn bị dữ liệu báo cáo...');
          await ensureTabLoaded(dvktReportState.sourceTab || 'mapfull');
          setDvktLoading(false);
        }
        const { columns, rows, sourceCount, sourceTab } = getDvktReportRows();
        if (!columns.length) return showToast('Chọn ít nhất một cột báo cáo.', 'warning');
        if (!rows.length) return showToast('Không có dữ liệu phù hợp để xuất.', 'warning');
        if (typeof XLSX === 'undefined') return showToast('Thư viện Excel chưa tải. Kiểm tra mạng.', 'error');
        const sheetRows = rows.map(r => {
          const o = {};
          columns.forEach(c => { o[c.label] = r[c.id] ?? ''; });
          return o;
        });
        const wb = XLSX.utils.book_new();
        const meta = reportTabMeta(sourceTab);
        const sheetName = (meta.short || 'BaoCao').substring(0, 31);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetRows), sheetName);
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const stamp = new Date().toISOString().slice(0, 10);
        downloadDvktFile(
          new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
          `BaoCao_DVKT_${sourceTab}_${stamp}.xlsx`
        );
        showToast(`Đã xuất ${sourceCount.toLocaleString('vi-VN')} dòng · ${columns.length} cột.`, 'success');
      } catch (err) {
        console.error(err);
        showToast('Lỗi xuất báo cáo: ' + (err?.message || 'không xác định'), 'error');
      }
    }
