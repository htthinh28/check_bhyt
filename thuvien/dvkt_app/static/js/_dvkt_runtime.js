
    const CATALOG_TT32_LABEL = 'Thông tư số 32/2023/TT-BYT — Phạm vi hành nghề';

    const PVHN_TAGS = {
      PVHN_BSYK: { label: 'BS Y khoa', full: 'TT32 — PL V — Bác sỹ y khoa', cls: 'bg-blue-100 text-blue-800 border border-blue-200' },
      PVHN_BSYHCT: { label: 'BS YHCT', full: 'TT32 — PL VI — Bác sỹ YHCT', cls: 'bg-teal-100 text-teal-800 border border-teal-200' },
      PVHN_BSYHDP: { label: 'BS YHDP', full: 'TT32 — PL VII — Bác sỹ y học dự phòng', cls: 'bg-cyan-100 text-cyan-800 border border-cyan-200' },
      PVHN_BSRHM: { label: 'BS RHM', full: 'TT32 — PL VIII — Bác sỹ RHM', cls: 'bg-indigo-100 text-indigo-800 border border-indigo-200' },
      PVHN_BSCK: { label: 'BS Chuyên khoa', full: 'TT32 — PL IX — Bác sỹ chuyên khoa (chung)', cls: 'bg-sky-100 text-sky-800 border border-sky-200' },
      PVHN_BSCK_HSCC: { label: 'BS CK — HSCC', full: 'BS chuyên khoa — Hồi sức cấp cứu', cls: 'bg-red-100 text-red-800 border border-red-200' },
      PVHN_BSCK_NOI: { label: 'BS CK — Nội', full: 'BS chuyên khoa — Nội khoa', cls: 'bg-sky-100 text-sky-900 border border-sky-200' },
      PVHN_BSCK_NGOAI: { label: 'BS CK — Ngoại', full: 'BS chuyên khoa — Ngoại khoa', cls: 'bg-indigo-100 text-indigo-900 border border-indigo-200' },
      PVHN_BSCK_UB: { label: 'BS CK — Ung bướu', full: 'BS chuyên khoa — Ung bướu', cls: 'bg-purple-100 text-purple-900 border border-purple-200' },
      PVHN_BSCK_DQ: { label: 'BS CK — Điện quang', full: 'BS chuyên khoa — Điện quang', cls: 'bg-slate-100 text-slate-800 border border-slate-200' },
      PVHN_BSCK_GMH: { label: 'BS CK — GMHS', full: 'BS chuyên khoa — Gây mê hồi sức', cls: 'bg-violet-100 text-violet-900 border border-violet-200' },
      PVHN_BSCK_HH: { label: 'BS CK — Huyết học', full: 'BS chuyên khoa — Huyết học - Truyền máu', cls: 'bg-rose-100 text-rose-900 border border-rose-200' },
      PVHN_BSCK_PS: { label: 'BS CK — Phụ sản', full: 'BS chuyên khoa — Phụ sản', cls: 'bg-pink-100 text-pink-900 border border-pink-200' },
      PVHN_BSCK_PTNS: { label: 'BS CK — PT nội soi', full: 'BS chuyên khoa — Phẫu thuật nội soi', cls: 'bg-cyan-100 text-cyan-900 border border-cyan-200' },
      PVHN_BSCK_THTM: { label: 'BS CK — THTM', full: 'BS chuyên khoa — Tạo hình thẩm mỹ', cls: 'bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-200' },
      PVHN_BSCK_YHHN: { label: 'BS CK — YHHN', full: 'BS chuyên khoa — Y học hạt nhân', cls: 'bg-amber-100 text-amber-900 border border-amber-200' },
      PVHN_BSCK_TMH: { label: 'BS CK — TMH', full: 'BS chuyên khoa — Tai Mũi Họng', cls: 'bg-teal-100 text-teal-900 border border-teal-200' },
      PVHN_BSCK_VS: { label: 'BS CK — Vi sinh', full: 'BS chuyên khoa — Vi sinh', cls: 'bg-lime-100 text-lime-900 border border-lime-200' },
      PVHN_BSCK_HOASINH: { label: 'BS CK — Hóa sinh', full: 'BS chuyên khoa — Hóa sinh', cls: 'bg-yellow-100 text-yellow-900 border border-yellow-200' },
      PVHN_BSCK_PHCN: { label: 'BS CK — PHCN', full: 'BS chuyên khoa — Phục hồi chức năng', cls: 'bg-emerald-100 text-emerald-900 border border-emerald-200' },
      PVHN_BSCK_NOITIET: { label: 'BS CK — Nội tiết', full: 'BS chuyên khoa — Nội tiết', cls: 'bg-orange-100 text-orange-900 border border-orange-200' },
      PVHN_BSCK_TDCN: { label: 'BS CK — TDCN', full: 'BS chuyên khoa — Thăm dò chức năng', cls: 'bg-stone-100 text-stone-800 border border-stone-200' },
      PVHN_BSCK_DALIEU: { label: 'BS CK — Da liễu', full: 'BS chuyên khoa — Da liễu', cls: 'bg-green-100 text-green-900 border border-green-200' },
      PVHN_BSCK_GPB: { label: 'BS CK — GPB', full: 'BS chuyên khoa — Giải phẫu bệnh', cls: 'bg-neutral-100 text-neutral-800 border border-neutral-200' },
      PVHN_BSCK_NS: { label: 'BS CK — Nội soi', full: 'BS chuyên khoa — Nội soi chẩn đoán', cls: 'bg-blue-100 text-blue-900 border border-blue-200' },
      PVHN_BSCK_TAMTHAN: { label: 'BS CK — Tâm thần', full: 'BS chuyên khoa — Tâm thần', cls: 'bg-purple-50 text-purple-800 border border-purple-200' },
      PVHN_BSCK_VIPHAU: { label: 'BS CK — Vi phẫu', full: 'BS chuyên khoa — Vi phẫu', cls: 'bg-sky-50 text-sky-800 border border-sky-200' },
      PVHN_BSCK_LAO: { label: 'BS CK — Lao', full: 'BS chuyên khoa — Lao', cls: 'bg-amber-50 text-amber-800 border border-amber-200' },
      PVHN_YSK: { label: 'Y sỹ ĐK', full: 'TT32 — PL X — Y sỹ đa khoa', cls: 'bg-lime-100 text-lime-800 border border-lime-200' },
      PVHN_YSYHCT: { label: 'Y sỹ YHCT', full: 'TT32 — PL XI — Y sỹ YHCT', cls: 'bg-emerald-100 text-emerald-900 border border-emerald-200' },
      PVHN_DD: { label: 'Điều dưỡng', full: 'TT32 — PL XII — Điều dưỡng', cls: 'bg-pink-100 text-pink-800 border border-pink-200' },
      PVHN_HS: { label: 'Hộ sinh', full: 'TT32 — PL XIII — Hộ sinh', cls: 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200' },
      PVHN_KTY: { label: 'Kỹ thuật y', full: 'TT32 — PL XIV — Kỹ thuật y', cls: 'bg-orange-100 text-orange-800 border border-orange-200' },
      PVHN_DDLS: { label: 'Dinh dưỡng LS', full: 'TT32 — PL XV — Dinh dưỡng lâm sàng', cls: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
      PVHN_TLLS: { label: 'Tâm lý LS', full: 'TT32 — PL XVI — Tâm lý lâm sàng', cls: 'bg-purple-100 text-purple-800 border border-purple-200' },
      PVHN_CCNV: { label: 'CC ngoại viện', full: 'TT32 — PL XVIII — Cấp cứu ngoại viện', cls: 'bg-red-100 text-red-800 border border-red-200' },
    };

    function renderPvhnBadges(tagsStr) {
      if (!tagsStr) return '—';
      const tags = String(tagsStr).split(';').filter(Boolean);
      if (!tags.length) return '—';
      return tags.map(tag => {
        const info = PVHN_TAGS[tag];
        if (!info) return `<span class="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">${tag}</span>`;
        return `<span class="px-1.5 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap ${info.cls}" title="${info.full}">${info.label}</span>`;
      }).join(' ');
    }

    function getPl1ByLink(ma) {
      if (!ma) return null;
      return state.datasets.pl1.find(r => r.maTuongDuong === ma) || null;
    }

    const BV_TABS = {
      bvpcst: { sourceTag: 'BV_PCST', pl1CoField: 'coTaiBV_PCST' },
      bvpcct: { sourceTag: 'BV_PCCT', pl1CoField: 'coTaiBV_PCCT' },
      bvpsd: { sourceTag: 'BV_PSD', pl1CoField: 'coTaiBV_PSD' },
    };
    const BV_TAB_IDS = Object.keys(BV_TABS);
    function isBvTab(tab) { return BV_TAB_IDS.includes(tab); }

    function getMappingContext(item, tab) {
      if (tab === 'pl1') return item;
      if (isBvTab(tab)) {
        const pl1 = getPl1ByLink(item.lienKetQD7603);
        if (pl1) {
          return {
            ...pl1,
            maKyThuatTT23: item.maKyThuatTT23 || pl1.maKyThuatTT23,
            tenKyThuatTT23: item.tenKyThuatTT23 || pl1.tenKyThuatTT23,
            theLienKetTT23: item.theLienKetTT23 || pl1.theLienKetTT23,
            thePhamViHanhNghe: item.thePhamViHanhNghe || pl1.thePhamViHanhNghe,
            maPhamViBHXH: item.maPhamViBHXH || pl1.maPhamViBHXH,
            tenChucDanhBHXH: item.tenChucDanhBHXH || pl1.tenChucDanhBHXH,
            soChucDanhBHXH: item.soChucDanhBHXH || pl1.soChucDanhBHXH,
            doTinCayBHXH: item.doTinCayBHXH || pl1.doTinCayBHXH,
          };
        }
        return item;
      }
      const link = item.lienKetQD7603 || item.maTuongDuongQD7603;
      const pl1 = getPl1ByLink(link);
      if (pl1) {
        return {
          ...pl1,
          theLienKetTT23: tab === 'tt23pl1' ? 'TT23_PL1' : (tab === 'tt23pl2' ? 'TT23_PL2' : pl1.theLienKetTT23),
          maKyThuatTT23: item.maKyThuat || pl1.maKyThuatTT23,
          tenKyThuatTT23: item.tenKyThuat || pl1.tenKyThuatTT23,
        };
      }
      return {
        theNguonGoc: '',
        theLienKetTT23: tab === 'tt23pl1' ? 'TT23_PL1' : (tab === 'tt23pl2' ? 'TT23_PL2' : ''),
        thePhamViHanhNghe: item.thePhamViHanhNghe || '',
        tenPhamViHanhNghe: item.tenPhamViHanhNghe || '',
      };
    }

    function renderBhxhBadges(maStr) {
      if (!maStr) return '';
      const codes = String(maStr).split(';').filter(Boolean);
      if (!codes.length) return '';
      return codes.map(code => `<span class="px-1.5 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap bg-blue-100 text-blue-900 border border-blue-200" title="Mã PVHN BHXH ${code}">BHXH ${code}</span>`).join(' ');
    }

    function renderFullMappingBadges(item, tab) {
      const ctx = getMappingContext(item, tab || state.activeTab);
      const parts = [];
      if (isBvTab(tab)) parts.push(renderSourceBadge(BV_TABS[tab].sourceTag));
      if (tab === 'pl1' || ctx.maTuongDuong || item.lienKetQD7603) {
        parts.push(renderSourceBadge('QD_7603'));
      }
      const tt23Tag = ctx.theLienKetTT23 || item.theLienKetTT23 || (tab === 'tt23pl1' ? 'TT23_PL1' : (tab === 'tt23pl2' ? 'TT23_PL2' : ''));
      if (tt23Tag) parts.push(renderSourceBadge(tt23Tag));
      const pvhn = renderPvhnBadges(ctx.thePhamViHanhNghe || item.thePhamViHanhNghe);
      if (pvhn && pvhn !== '—') parts.push(pvhn);
      const bhxh = renderBhxhBadges(ctx.maPhamViBHXH || item.maPhamViBHXH);
      if (bhxh) parts.push(bhxh);
      if (tab === 'pvhnbhxh' && item.maPhamVi) {
        parts.push(`<span class="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-800 border border-blue-200">PVHN_BHXH</span>`);
      }
      if (!parts.length) return '<span class="text-xs text-slate-400">Chưa gắn thẻ mapping</span>';
      return `<div class="flex flex-wrap gap-1 items-center leading-relaxed">${parts.join('')}</div>`;
    }

    function getPvhnTagLabels(tagsStr) {
      if (!tagsStr) return '';
      return String(tagsStr).split(';').filter(Boolean).map(t => PVHN_TAGS[t]?.label || t).join('; ');
    }

    // === HỆ THỐNG TRẠNG THÁI — khởi tạo qua _dvkt_bootstrap.js (initDvktState) ===
    // `state` được gán sau khi tải dữ liệu (embedded hoặc API).

    const TAB_COLORS = {
      pl1: 'bg-rose-500',
      pl2: 'bg-amber-500',
      pl3: 'bg-red-500',
      tt23pl1: 'bg-emerald-500',
      tt23pl2: 'bg-violet-500',
      bvpcst: 'bg-cyan-600',
      bvpcct: 'bg-teal-600',
      bvpsd: 'bg-emerald-700',
      pvhnbhxh: 'bg-blue-600',
      quytrinhkt: 'bg-amber-600',
      mapfull: 'bg-indigo-700',
      baocao: 'bg-indigo-600'
    };

    const TAB_SIDEBAR_ACTIVE = {
      pl1: 'bg-rose-50 text-rose-900 border-rose-500',
      pl2: 'bg-amber-50 text-amber-900 border-amber-500',
      pl3: 'bg-red-50 text-red-900 border-red-500',
      tt23pl1: 'bg-emerald-50 text-emerald-900 border-emerald-500',
      tt23pl2: 'bg-violet-50 text-violet-900 border-violet-500',
      mapfull: 'bg-indigo-50 text-indigo-900 border-indigo-600',
      baocao: 'bg-indigo-50 text-indigo-900 border-indigo-500',
      bvpcst: 'bg-cyan-50 text-cyan-900 border-cyan-600',
      bvpcct: 'bg-teal-50 text-teal-900 border-teal-600',
      bvpsd: 'bg-emerald-50 text-emerald-900 border-emerald-700',
      pvhnbhxh: 'bg-blue-50 text-blue-900 border-blue-600',
      quytrinhkt: 'bg-amber-50 text-amber-900 border-amber-600',
    };

    const TAB_SIDEBAR_LABELS = {
      pl1: 'PL1 — Danh mục đầy đủ',
      pl2: 'PL2 — Thay đổi / bổ sung',
      pl3: 'PL3 — Mã đã huỷ',
      tt23pl1: 'TT23 — Phụ lục 1',
      tt23pl2: 'TT23 — Phụ lục 2',
      mapfull: 'Mapping tổng hợp',
      baocao: 'Báo cáo tùy biến',
      bvpcst: 'BV PC Sóc Trăng',
      bvpcct: 'BV PC Cần Thơ',
      bvpsd: 'BV PC Sa Đéc',
      pvhnbhxh: 'Mã PVHN BHXH 2024',
      quytrinhkt: 'QTKT BYT (TT32 · QĐ7603)',
    };

    const TAB_SIDEBAR_COUNT_ACTIVE = {
      pl1: 'bg-rose-100 text-rose-800',
      pl2: 'bg-amber-100 text-amber-800',
      pl3: 'bg-red-100 text-red-800',
      tt23pl1: 'bg-emerald-100 text-emerald-800',
      tt23pl2: 'bg-violet-100 text-violet-800',
      mapfull: 'bg-indigo-100 text-indigo-800',
      baocao: 'bg-indigo-100 text-indigo-800',
      bvpcst: 'bg-cyan-100 text-cyan-900',
      bvpcct: 'bg-teal-100 text-teal-900',
      bvpsd: 'bg-emerald-100 text-emerald-900',
      pvhnbhxh: 'bg-blue-100 text-blue-900',
      quytrinhkt: 'bg-amber-100 text-amber-900',
    };

    const SIDEBAR_BTN_BASE = 'dvkt-sidebar-btn w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all border-l-4';
    const SIDEBAR_BTN_IDLE = 'text-slate-600 hover:bg-slate-50 border-transparent';
    const SIDEBAR_COUNT_IDLE = 'text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0';

    const ALL_TABS = ['pl1', 'pl2', 'pl3', 'tt23pl1', 'tt23pl2', 'mapfull', 'bvpcst', 'bvpcct', 'bvpsd', 'pvhnbhxh', 'quytrinhkt', 'baocao'];

    function toggleMobileSidebar() {
      const sb = document.getElementById('dvktSidebar');
      const bd = document.getElementById('dvktSidebarBackdrop');
      if (!sb || !bd) return;
      const open = sb.classList.contains('-translate-x-full');
      sb.classList.toggle('-translate-x-full', !open);
      sb.classList.toggle('translate-x-0', open);
      bd.classList.toggle('hidden', !open);
    }

    function closeMobileSidebar() {
      if (window.innerWidth >= 1024) return;
      const sb = document.getElementById('dvktSidebar');
      const bd = document.getElementById('dvktSidebarBackdrop');
      if (!sb || !bd) return;
      sb.classList.add('-translate-x-full');
      sb.classList.remove('translate-x-0');
      bd.classList.add('hidden');
    }

    function updateActiveTabLabel(tabId) {
      const el = document.getElementById('dvktActiveTabLabel');
      if (el) el.textContent = TAB_SIDEBAR_LABELS[tabId] || tabId;
    }

    function showToast(message, type = 'success') {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      let bgClass = 'bg-rose-500';
      let icon = '✓';
      if (type === 'error') { bgClass = 'bg-red-500'; icon = '✕'; }
      else if (type === 'warning') { bgClass = 'bg-amber-500'; icon = '⚠'; }
      else if (type === 'info') { bgClass = 'bg-sky-500'; icon = 'ℹ'; }
      toast.className = `${bgClass} text-white flex items-center p-4 rounded-xl shadow-lg transition-all duration-300 opacity-0 translate-y-2 pointer-events-auto max-w-sm`;
      toast.innerHTML = `<div class="mr-3 font-semibold text-lg">${icon}</div><div class="text-xs font-medium">${message}</div>`;
      container.appendChild(toast);
      setTimeout(() => toast.classList.remove('opacity-0', 'translate-y-2'), 50);
      setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-2'); setTimeout(() => toast.remove(), 300); }, 3500);
    }

    function showDialogAlert(title, message, themeClass = 'bg-rose-600') {
      const overlay = document.getElementById('dialogOverlay');
      const box = document.getElementById('dialogBox');
      document.getElementById('dialogHeader').className = `p-5 text-white font-bold text-lg ${themeClass}`;
      document.getElementById('dialogHeader').innerText = title;
      document.getElementById('dialogBody').innerText = message;
      document.getElementById('dialogFooter').innerHTML = `<button onclick="closeDialog()" class="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700">Đồng ý</button>`;
      overlay.classList.remove('hidden');
      overlay.classList.add('flex');
      setTimeout(() => box.classList.remove('scale-95'), 50);
    }

    function showDialogConfirm(title, message, onConfirm, themeClass = 'bg-rose-600') {
      const overlay = document.getElementById('dialogOverlay');
      const box = document.getElementById('dialogBox');
      document.getElementById('dialogHeader').className = `p-5 text-white font-bold text-lg ${themeClass}`;
      document.getElementById('dialogHeader').innerText = title;
      document.getElementById('dialogBody').innerText = message;
      document.getElementById('dialogFooter').innerHTML = `
        <button onclick="closeDialog()" class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100">Hủy bỏ</button>
        <button id="dialogConfirmBtn" class="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700">Xác nhận</button>`;
      document.getElementById('dialogConfirmBtn').onclick = () => { closeDialog(); onConfirm(); };
      overlay.classList.remove('hidden');
      overlay.classList.add('flex');
      setTimeout(() => box.classList.remove('scale-95'), 50);
    }

    function closeDialog() {
      const overlay = document.getElementById('dialogOverlay');
      const box = document.getElementById('dialogBox');
      box.classList.add('scale-95');
      setTimeout(() => { overlay.classList.remove('flex'); overlay.classList.add('hidden'); }, 150);
    }

    async function switchTab(tabId) {
      if (!state) return;
      if (isRemoteDvktMode()) {
        const needsLoad = tabId === 'mapfull'
          ? !DVKT_MAPFULL_DEPS.every(isTabDataLoaded)
          : (DVKT_TAB_IDS.includes(tabId) && !isTabDataLoaded(tabId));
        if (needsLoad || tabId === 'baocao') {
          setDvktLoading(true, `Đang tải ${TAB_SIDEBAR_LABELS[tabId] || tabId}...`);
          try {
            await ensureTabLoaded(tabId);
          } catch (err) {
            console.error('switchTab load:', err);
            showToast(`Lỗi tải ${TAB_SIDEBAR_LABELS[tabId] || tabId}: ${err.message || err}`, 'error');
          } finally {
            setDvktLoading(false);
          }
        }
        if (tabId === 'pvhnbhxh' && typeof applyPvhnbhxhSeed === 'function') applyPvhnbhxhSeed();
      }
      state.activeTab = tabId;
      state.currentPage = 1;
      state.selectedIds = {};
      ALL_TABS.forEach(id => {
        const btn = document.getElementById(`tabBtn-${id}`);
        const countSpan = document.getElementById(`tabCount-${id}`);
        if (!btn) return;
        if (id === tabId) {
          const active = TAB_SIDEBAR_ACTIVE[id] || 'bg-rose-50 text-rose-900 border-rose-500';
          btn.className = `${SIDEBAR_BTN_BASE} ${active}`;
          if (countSpan) {
            countSpan.className = `text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${TAB_SIDEBAR_COUNT_ACTIVE[id] || 'bg-rose-100 text-rose-800'}`;
          }
        } else {
          btn.className = `${SIDEBAR_BTN_BASE} ${SIDEBAR_BTN_IDLE}`;
          if (countSpan) countSpan.className = SIDEBAR_COUNT_IDLE;
        }
      });
      updateActiveTabLabel(tabId);
      closeMobileSidebar();
      renderUI();
    }

    function matchesTheNguonFilter(item) {
      const f = state.filterTheNguon;
      if (!f) return true;
      if (f === 'QD_7603') return item.theNguonGoc === 'QD_7603';
      if (f === 'TT23_PL1') {
        return item.theNguonGoc === 'TT23_PL1' || item.theLienKetTT23 === 'TT23_PL1';
      }
      if (f === 'TT23_PL2') {
        return item.theNguonGoc === 'TT23_PL2' || item.theLienKetTT23 === 'TT23_PL2';
      }
      if (f === 'KHONG_KHOP') {
        if (state.activeTab === 'pl1') return !item.theLienKetTT23;
        if (state.activeTab === 'tt23pl1' || state.activeTab === 'tt23pl2') return !item.lienKetQD7603;
        if (isBvTab(state.activeTab)) return !item.lienKetQD7603;
        return true;
      }
      if (f === 'DA_LIEN_KET') {
        if (state.activeTab === 'pl1') return !!item.theLienKetTT23;
        if (state.activeTab === 'tt23pl1' || state.activeTab === 'tt23pl2') return !!item.lienKetQD7603;
        if (isBvTab(state.activeTab)) return !!item.lienKetQD7603;
        return false;
      }
      if (f === 'CO_TAI_BV_PCST') {
        return state.activeTab === 'pl1' && item.coTaiBV_PCST === 'Có';
      }
      if (f === 'CO_TAI_BV_PCCT') {
        return state.activeTab === 'pl1' && item.coTaiBV_PCCT === 'Có';
      }
      if (f === 'CO_TAI_BV_PSD') {
        return state.activeTab === 'pl1' && item.coTaiBV_PSD === 'Có';
      }
      if (f === 'CO_PVHN') {
        if (state.activeTab === 'pl1' || isBvTab(state.activeTab) || state.activeTab === 'mapfull') return !!item.thePhamViHanhNghe;
        const ctx = getMappingContext(item, state.activeTab);
        return !!(ctx.thePhamViHanhNghe || item.thePhamViHanhNghe);
      }
      if (f === 'KHONG_PVHN') {
        if (state.activeTab === 'pl1' || isBvTab(state.activeTab) || state.activeTab === 'mapfull') return !item.thePhamViHanhNghe;
        const ctx = getMappingContext(item, state.activeTab);
        return !(ctx.thePhamViHanhNghe || item.thePhamViHanhNghe);
      }
      if (f === 'FULL_MAPPING') {
        if (state.activeTab === 'pl1') return !!item.theLienKetTT23 && !!item.thePhamViHanhNghe && !!item.maPhamViBHXH;
        if (isBvTab(state.activeTab)) return !!item.lienKetQD7603 && !!item.thePhamViHanhNghe && !!item.maPhamViBHXH;
        const ctx = getMappingContext(item, state.activeTab);
        return !!item.lienKetQD7603 && !!(ctx.thePhamViHanhNghe || item.thePhamViHanhNghe) && !!(ctx.maPhamViBHXH || item.maPhamViBHXH);
      }
      if (f === 'CO_BHXH') {
        if (state.activeTab === 'pvhnbhxh') return (item.soDvktDuocPhep || 0) > 0;
        if (state.activeTab === 'pl1' || isBvTab(state.activeTab) || state.activeTab === 'mapfull') return !!item.maPhamViBHXH;
        const ctx = getMappingContext(item, state.activeTab);
        return !!(ctx.maPhamViBHXH || item.maPhamViBHXH);
      }
      if (f === 'KHONG_BHXH') {
        if (state.activeTab === 'pvhnbhxh') return !(item.soDvktDuocPhep > 0);
        if (state.activeTab === 'pl1' || isBvTab(state.activeTab) || state.activeTab === 'mapfull') return !item.maPhamViBHXH;
        const ctx = getMappingContext(item, state.activeTab);
        return !(ctx.maPhamViBHXH || item.maPhamViBHXH);
      }
      if (f === 'FULL_WITH_BHXH') {
        if (state.activeTab === 'pl1') return !!item.theLienKetTT23 && !!item.thePhamViHanhNghe && !!item.maPhamViBHXH;
        if (state.activeTab === 'mapfull') return !!item.maTuongDuong && !!item.theLienKetTT23 && !!item.thePhamViHanhNghe && !!item.maPhamViBHXH;
        const ctx = getMappingContext(item, state.activeTab);
        return !!(ctx.maPhamViBHXH || item.maPhamViBHXH) && !!(ctx.thePhamViHanhNghe || item.thePhamViHanhNghe);
      }
      return true;
    }

    function matchesPhamViFilter(item) {
      const f = state.filterPhamVi;
      if (!f || !['pl1', ...BV_TAB_IDS, 'mapfull'].includes(state.activeTab)) return true;
      if (f === 'KHONG_PVHN') return !item.thePhamViHanhNghe;
      if (f === 'CO_PVHN') return !!item.thePhamViHanhNghe;
      const tags = String(item.thePhamViHanhNghe || '').split(';');
      if (f === 'PVHN_BSCK') return tags.some(t => t === 'PVHN_BSCK' || t.startsWith('PVHN_BSCK_'));
      return tags.includes(f);
    }

    function getFilteredData() {
      if (state.activeTab === 'mapfull') ensureMasterMapTab();
      let data = state.datasets[state.activeTab] || [];
      if (state.searchTerm.trim()) {
        const term = state.searchTerm.toLowerCase();
        data = data.filter(item => Object.values(item).some(val => val !== null && val !== undefined && val.toString().toLowerCase().includes(term)));
      }
      if (state.filterPhanTuyen && ['pl1', 'pl2', 'pl3'].includes(state.activeTab)) {
        data = data.filter(item => item.phanTuyen === state.filterPhanTuyen);
      }
      if (state.filterTheNguon && !['pvhnbhxh', 'baocao', 'quytrinhkt'].includes(state.activeTab)) {
        data = data.filter(item => state.activeTab === 'mapfull' ? matchesMasterMapFilter(item) : matchesTheNguonFilter(item));
      }
      if (state.filterPhamVi && !['pvhnbhxh', 'baocao', 'quytrinhkt'].includes(state.activeTab)) {
        data = data.filter(matchesPhamViFilter);
      }
      if (state.filterIcd && state.activeTab === 'quytrinhkt') {
        const icd = state.filterIcd.toUpperCase();
        data = data.filter(item => {
          const blob = [item.maICDChiDinh, item.maICDChongChiDinh, item.tenBenhICDChiDinh, item.tenBenhICDChongChiDinh].join(';');
          return blob.toUpperCase().includes(icd);
        });
      }
      return data;
    }

    function renderTableHeaders(columnsList, filteredItems) {
      const headerRow = document.getElementById('tableHeaderRow');
      headerRow.innerHTML = '';
      const thSelectAll = document.createElement('th');
      thSelectAll.className = 'p-3 w-12 text-center';
      const isAllChecked = filteredItems.length > 0 && filteredItems.every(item => state.selectedIds[getRowId(item)]);
      thSelectAll.innerHTML = `<input type="checkbox" ${isAllChecked ? 'checked' : ''} onchange="handleSelectAllToggle(this.checked)" class="rounded border-slate-300 text-rose-600 focus:ring-rose-500" />`;
      headerRow.appendChild(thSelectAll);
      const coreFields = ['stt', 'sttPl1', 'maTuongDuong', 'maDichVu', 'maKyThuat', 'maTT43', 'tenTT43', 'tenDichVu', 'tagsMapping', 'mucDoMapping', 'soBvCo', 'tenKyThuat', 'phanTuyen', 'theNguonGoc', 'theLienKetTT23', 'thePhamViHanhNghe', 'chuyenKhoaPVHN', 'chiTietChuyenKhoaPVHN', 'donGia', 'donGiaPCST', 'donGiaPCCT', 'donGiaPSD', 'chenhGiaBv', 'lyDoHuy', 'lyDoThayDoi'];
      columnsList.forEach(col => {
        const th = document.createElement('th');
        th.className = 'p-3 font-semibold whitespace-nowrap';
        th.innerHTML = `<div class="flex items-center justify-between group"><span>${col.label}</span>${!coreFields.includes(col.key) ? `<button onclick="handleDeleteColumn('${col.key}', '${col.label.replace(/'/g, "\\'")}')" class="text-red-400 hover:text-red-600 ml-2 opacity-0 group-hover:opacity-100 text-xs" title="Xóa trường">✕</button>` : ''}</div>`;
        headerRow.appendChild(th);
      });
      const thActions = document.createElement('th');
      thActions.className = 'p-3 font-semibold text-center whitespace-nowrap sticky right-0 bg-slate-100 z-10 shadow-[-4px_0_4px_rgba(0,0,0,0.05)]';
      thActions.innerText = 'Thao tác';
      headerRow.appendChild(thActions);
    }

    function renderCellValue(col, val, item) {
      if (col.key === 'tagsMapping' || col.type === 'computed') {
        if (state.activeTab === 'mapfull') return renderMasterMappingBadges(item);
        if (state.activeTab === 'quytrinhkt' && typeof renderQtktMappingBadges === 'function') return renderQtktMappingBadges(item);
        return renderFullMappingBadges(item, state.activeTab);
      }
      if ((col.key === 'maICDChiDinh' || col.key === 'maICDChongChiDinh') && val) {
        const kind = col.key === 'maICDChongChiDinh' ? 'chong' : 'chi';
        const tenKey = col.key === 'maICDChongChiDinh' ? 'tenBenhICDChongChiDinh' : 'tenBenhICDChiDinh';
        if (typeof renderQtktIcdChips === 'function') return renderQtktIcdChips(val, item[tenKey], kind);
      }
      if (col.key === 'phanTuyen') {
        return `<span class="px-2 py-0.5 text-xs font-semibold rounded-full ${val === 'A' ? 'bg-purple-100 text-purple-800' : val === 'B' ? 'bg-blue-100 text-blue-800' : val === 'C' ? 'bg-amber-100 text-amber-800' : val === 'D' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-800'}">Tuyến ${val || 'N/A'}</span>`;
      }
      if (col.key === 'mucDoMapping' && val) {
        const cls = val.includes('Đủ 7603+TT23+PVHN') ? 'text-emerald-700 bg-emerald-50' : val.includes('Chỉ BV') ? 'text-amber-700 bg-amber-50' : val.includes('chưa') ? 'text-orange-700 bg-orange-50' : 'text-slate-700 bg-slate-50';
        return `<span class="px-2 py-0.5 text-xs font-semibold rounded ${cls}">${val}</span>`;
      }
      if (col.key === 'chenhGiaBv' && val > 0) {
        return `<span class="text-xs font-semibold text-rose-700">${Number(val).toLocaleString('vi-VN')}</span>`;
      }
      if (col.key === 'theNguonGoc' || col.key === 'theLienKetTT23') {
        return renderSourceBadge(val);
      }
      if (col.key === 'thePhamViHanhNghe') {
        return renderPvhnBadges(val);
      }
      if (col.key === 'chuyenKhoaPVHN' && val) {
        return `<span class="text-xs text-slate-700" title="${String(item.chiTietChuyenKhoaPVHN || val).replace(/"/g, '&quot;')}">${val}</span>`;
      }
      if (col.key === 'chiTietChuyenKhoaPVHN' && val) {
        return `<span class="text-xs text-slate-600">${val}</span>`;
      }
      if (col.key === 'vanBanNguon' && val) {
        return `<span class="text-xs text-slate-600" title="${val}">${val.length > 48 ? val.slice(0, 48) + '…' : val}</span>`;
      }
      if (col.key === 'tenKyThuatTT23' && val) {
        const s = String(val);
        if (/^\d+\.\d+\s/i.test(s) || /quang tăng sáng quang/i.test(s)) return '—';
        return `<span class="text-xs text-emerald-800 leading-snug" title="Thông tư 23/2024/TT-BYT">${s.replace(/</g, '&lt;')}</span>`;
      }
      if (col.key === 'tenTT43' && val) {
        return `<span class="text-xs text-rose-800 leading-snug" title="QĐ 7603/QĐ-BYT">${String(val).replace(/</g, '&lt;')}</span>`;
      }
      if (col.key === 'tenDichVuBV' && val) {
        const src = item.benhVienDVKT ? ` · ${item.benhVienDVKT}` : '';
        return `<span class="text-xs text-sky-800 leading-snug" title="Danh mục bệnh viện${src}">${String(val).replace(/</g, '&lt;')}</span>`;
      }
      if (col.key === 'doTinCayMapping' || col.key === 'doTinCayPhamVi' || col.key === 'doTinCayBHXH') {
        const cls = val === 'Cao' ? 'text-emerald-700 bg-emerald-50' : val === 'Trung bình' ? 'text-amber-700 bg-amber-50' : val === 'Không khớp' || val === 'Chỉ TT23' ? 'text-red-700 bg-red-50' : 'text-slate-600 bg-slate-50';
        return `<span class="px-2 py-0.5 text-xs font-semibold rounded ${cls}">${val || '—'}</span>`;
      }
      if (col.type === 'number' && col.key.toLowerCase().includes('gia')) {
        return val ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val) : '—';
      }
      return val !== undefined && val !== null && val !== '' ? val : '—';
    }

    function renderTableRows(columnsList, paginatedData) {
      const tbody = document.getElementById('tableBody');
      tbody.innerHTML = '';
      if (!paginatedData.length) {
        tbody.innerHTML = `<tr><td colSpan="${columnsList.length + 2}" class="p-8 text-center text-slate-400"><div class="text-3xl mb-2">🔍</div><p class="font-medium text-sm">Không tìm thấy dịch vụ kỹ thuật nào phù hợp!</p></td></tr>`;
        return;
      }
      paginatedData.forEach(item => {
        const rowId = getRowId(item);
        const isSelected = !!state.selectedIds[rowId];
        const tr = document.createElement('tr');
        tr.className = `hover:bg-rose-50/40 transition-colors ${isSelected ? 'bg-rose-50/60' : ''}`;
        const tdCheck = document.createElement('td');
        tdCheck.className = 'p-3 text-center';
        tdCheck.innerHTML = `<input type="checkbox" ${isSelected ? 'checked' : ''} onchange="handleRowSelectToggle('${rowId.replace(/'/g, "\\'")}')" class="rounded border-slate-300 text-rose-600 focus:ring-rose-500" />`;
        tr.appendChild(tdCheck);
        columnsList.forEach(col => {
          const td = document.createElement('td');
          const isMappingCol = col.key === 'tagsMapping' || col.type === 'computed';
          td.className = isMappingCol
            ? 'p-3 font-normal min-w-[300px] max-w-[520px] align-top'
            : 'p-3 font-normal max-w-[320px] truncate';
          const val = item[col.key];
          const rendered = renderCellValue(col, val, item);
          td.title = col.key === 'tagsMapping' ? (item.tenPhamViHanhNghe || getPvhnTagLabels(item.thePhamViHanhNghe) || '') : (val !== undefined && val !== null ? val : '');
          td.innerHTML = rendered;
          tr.appendChild(td);
        });
        const tdActions = document.createElement('td');
        tdActions.className = 'p-3 text-center sticky right-0 bg-white z-10 shadow-[-4px_0_4px_rgba(0,0,0,0.05)]';
        const safeId = rowId.replace(/'/g, "\\'");
        tdActions.innerHTML = `<div class="flex items-center justify-center space-x-2">
          <button onclick="openEditModal('${safeId}')" class="text-sky-600 hover:text-sky-800 text-xs border border-sky-200 px-2 py-1 rounded">Sửa</button>
          <button onclick="handleDeleteSingle('${safeId}')" class="text-red-600 hover:text-red-800 text-xs border border-red-200 px-2 py-1 rounded">Xóa</button></div>`;
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
      });
    }

    function renderPagination(totalFilteredCount) {
      const totalPages = Math.ceil(totalFilteredCount / state.itemsPerPage) || 1;
      if (state.currentPage > totalPages) state.currentPage = totalPages;
      document.getElementById('currentPageIndicator').innerText = state.currentPage;
      document.getElementById('totalPagesIndicator').innerText = totalPages;
      const prevBtn = document.getElementById('prevPageBtn');
      const nextBtn = document.getElementById('nextPageBtn');
      prevBtn.disabled = state.currentPage === 1;
      prevBtn.className = state.currentPage === 1 ? 'px-3 py-1 text-xs font-semibold rounded-lg border border-slate-300 text-slate-300 bg-slate-50 cursor-not-allowed' : 'px-3 py-1 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-100';
      nextBtn.disabled = state.currentPage === totalPages;
      nextBtn.className = state.currentPage === totalPages ? 'px-3 py-1 text-xs font-semibold rounded-lg border border-slate-300 text-slate-300 bg-slate-50 cursor-not-allowed' : 'px-3 py-1 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-100';
    }

    function renderStatsAndTabs() {
      document.getElementById('statPl1').innerText = state.datasets.pl1.length;
      document.getElementById('statPl2').innerText = state.datasets.pl2.length;
      document.getElementById('statPl3').innerText = state.datasets.pl3.length;
      const fieldCount = state.activeTab === 'baocao'
        ? (typeof getFullReportCatalog === 'function' ? getFullReportCatalog().length : 0)
        : (state.columns[state.activeTab] || []).length;
      document.getElementById('statFields').innerText = fieldCount;
      ALL_TABS.forEach(id => {
        const el = document.getElementById(`tabCount-${id}`);
        if (!el) return;
        if (id === 'baocao') {
          const n = typeof getFullReportCatalog === 'function' ? getFullReportCatalog().length : 0;
          el.innerText = n ? `${n} cột` : '—';
          return;
        }
        if (state.datasets[id]) el.innerText = state.datasets[id].length;
      });
      const pl1 = state.datasets.pl1;
      const mapped = pl1.filter(r => r.theLienKetTT23).length;
      const unmapped = pl1.filter(r => !r.theLienKetTT23).length;
      const pvhnMapped = pl1.filter(r => r.thePhamViHanhNghe).length;
      const bhxhMapped = pl1.filter(r => r.maPhamViBHXH).length;
      const fullMapped = pl1.filter(r => r.theLienKetTT23 && r.thePhamViHanhNghe && r.maPhamViBHXH).length;
      const linked = state.datasets.tt23pl1.filter(r => r.lienKetQD7603).length + state.datasets.tt23pl2.filter(r => r.lienKetQD7603).length;
      document.getElementById('statTagQd7603').innerText = pl1.length;
      document.getElementById('statTagTt23Pl1').innerText = state.datasets.tt23pl1.length;
      document.getElementById('statTagTt23Pl2').innerText = state.datasets.tt23pl2.length;
      document.getElementById('statMapped').innerText = mapped;
      document.getElementById('statUnmapped').innerText = unmapped;
      document.getElementById('statLinked').innerText = linked;
      const pvhnEl = document.getElementById('statPvhnMapped');
      if (pvhnEl) pvhnEl.innerText = pvhnMapped;
      const bhxhEl = document.getElementById('statBhxhMapped');
      if (bhxhEl) bhxhEl.innerText = bhxhMapped;
      const fullEl = document.getElementById('statFullMapped');
      if (fullEl) fullEl.innerText = fullMapped;
      const bvEl = document.getElementById('statBvPcstMapped');
      if (bvEl && state.datasets.bvpcst) {
        bvEl.innerText = state.datasets.bvpcst.filter(r => r.lienKetQD7603).length;
      }
      const bvCtEl = document.getElementById('statBvPcctMapped');
      if (bvCtEl && state.datasets.bvpcct) {
        bvCtEl.innerText = state.datasets.bvpcct.filter(r => r.lienKetQD7603).length;
      }
      const bvSdEl = document.getElementById('statBvPsdMapped');
      if (bvSdEl && state.datasets.bvpsd) {
        bvSdEl.innerText = state.datasets.bvpsd.filter(r => r.lienKetQD7603).length;
      }
      if (state.activeTab === 'mapfull' || document.getElementById('tabCount-mapfull')) {
        ensureMasterMapTab();
        const mf = state.datasets.mapfull || [];
        const mfEl = document.getElementById('tabCount-mapfull');
        if (mfEl) mfEl.innerText = mf.length;
        const fullAllEl = document.getElementById('statMasterFull');
        if (fullAllEl) {
          fullAllEl.innerText = mf.filter(r => r.maTuongDuong && r.theLienKetTT23 && r.thePhamViHanhNghe && r.maPhamViBHXH && r.soBvCo >= 1).length;
        }
      }
    }

    function renderUI() {
      const isReportTab = state.activeTab === 'baocao';
      const dataPanel = document.getElementById('dvktDataPanel');
      const reportPanel = document.getElementById('dvktReportPanel');
      if (dataPanel) dataPanel.classList.toggle('hidden', isReportTab);
      if (reportPanel) {
        reportPanel.classList.toggle('hidden', !isReportTab);
        if (isReportTab && typeof renderReportTabPanel === 'function') renderReportTabPanel();
      }
      if (isReportTab) {
        renderStatsAndTabs();
        return;
      }
      const filteredData = getFilteredData();
      if (state.activeTab === 'quytrinhkt') {
        if (typeof toggleQtktToolbar === 'function') toggleQtktToolbar(true);
        if (typeof ensureQtktInfographicHost === 'function') ensureQtktInfographicHost();
        const currentCols = state.columns[state.activeTab];
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const paginated = filteredData.slice(startIndex, startIndex + state.itemsPerPage);
        document.getElementById('displayedCount').innerText = paginated.length;
        document.getElementById('totalFilteredCount').innerText = filteredData.length;
        if (typeof qtktViewMode !== 'undefined' && qtktViewMode === 'info' && typeof renderQtktInfographicView === 'function') {
          renderQtktInfographicView(paginated);
          renderPagination(filteredData.length);
          renderStatsAndTabs();
          return;
        }
        if (typeof renderQtktTableView === 'function') renderQtktTableView();
      } else if (typeof toggleQtktToolbar === 'function') {
        toggleQtktToolbar(false);
        if (typeof renderQtktTableView === 'function') renderQtktTableView();
      }
      const currentCols = state.columns[state.activeTab];
      const startIndex = (state.currentPage - 1) * state.itemsPerPage;
      const paginated = filteredData.slice(startIndex, startIndex + state.itemsPerPage);
      document.getElementById('displayedCount').innerText = paginated.length;
      document.getElementById('totalFilteredCount').innerText = filteredData.length;
      const batchDeleteBtn = document.getElementById('batchDeleteBtn');
      const selectedCount = Object.values(state.selectedIds).filter(Boolean).length;
      batchDeleteBtn.classList.toggle('hidden', selectedCount === 0);
      document.getElementById('batchCount').innerText = selectedCount;
      document.getElementById('clearFilterBtn').classList.toggle('hidden', !(state.searchTerm || state.filterPhanTuyen || state.filterTheNguon || state.filterPhamVi || state.filterIcd));
      renderTableHeaders(currentCols, paginated);
      renderTableRows(currentCols, paginated);
      renderPagination(filteredData.length);
      renderStatsAndTabs();
    }

    function handleSearch(val) { state.searchTerm = val; state.currentPage = 1; renderUI(); }
    function handleFilterPhanTuyen(val) { state.filterPhanTuyen = val; state.currentPage = 1; renderUI(); }
    function handleFilterTheNguon(val) { state.filterTheNguon = val; state.currentPage = 1; renderUI(); }
    function handleFilterPhamVi(val) { state.filterPhamVi = val; state.currentPage = 1; renderUI(); }
    function clearFilters() {
      state.searchTerm = ''; state.filterPhanTuyen = ''; state.filterTheNguon = ''; state.filterPhamVi = ''; state.filterIcd = ''; state.currentPage = 1;
      document.getElementById('searchInput').value = '';
      document.getElementById('filterPhanTuyen').value = '';
      document.getElementById('filterTheNguon').value = '';
      const fp = document.getElementById('filterPhamVi');
      if (fp) fp.value = '';
      renderUI();
    }
    function navigatePage(delta) { state.currentPage += delta; renderUI(); }
    function handleItemsPerPageChange(val) { state.itemsPerPage = parseInt(val, 10); state.currentPage = 1; renderUI(); }
    function handleRowSelectToggle(id) { state.selectedIds[id] = !state.selectedIds[id]; renderUI(); }
    function handleSelectAllToggle(checked) {
      const start = (state.currentPage - 1) * state.itemsPerPage;
      getFilteredData().slice(start, start + state.itemsPerPage).forEach(item => { state.selectedIds[getRowId(item)] = checked; });
      renderUI();
    }

    function findItemByRowId(rowId) {
      return state.datasets[state.activeTab].find(item => getRowId(item) === rowId);
    }

    function openAddModal() {
      state.editingItem = null;
      document.getElementById('editModalTitle').innerText = 'Thêm mới dịch vụ';
      buildEditForm({});
      document.getElementById('editModal').classList.remove('hidden');
      document.getElementById('editModal').classList.add('flex');
    }

    function openEditModal(rowId) {
      const item = findItemByRowId(rowId);
      if (!item) return;
      state.editingItem = item;
      document.getElementById('editModalTitle').innerText = 'Chỉnh sửa dịch vụ';
      buildEditForm(item);
      document.getElementById('editModal').classList.remove('hidden');
      document.getElementById('editModal').classList.add('flex');
    }

    function closeEditModal() {
      document.getElementById('editModal').classList.add('hidden');
      document.getElementById('editModal').classList.remove('flex');
      state.editingItem = null;
    }

    function buildEditForm(item) {
      const container = document.getElementById('editFormFields');
      container.innerHTML = '';
      state.columns[state.activeTab].forEach(col => {
        const wrap = document.createElement('div');
        wrap.className = 'flex flex-col';
        const val = item[col.key] ?? '';
        let input = '';
        if (col.type === 'select' && col.options) {
          input = `<select name="${col.key}" class="border border-slate-300 rounded-lg p-2 text-sm">${col.options.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
        } else if (col.type === 'number') {
          input = `<input type="number" name="${col.key}" value="${val}" class="border border-slate-300 rounded-lg p-2 text-sm" />`;
        } else {
          input = `<input type="text" name="${col.key}" value="${String(val).replace(/"/g, '&quot;')}" class="border border-slate-300 rounded-lg p-2 text-sm" ${col.required ? 'required' : ''} />`;
        }
        wrap.innerHTML = `<label class="text-xs font-semibold text-slate-700 mb-1">${col.label}</label>${input}`;
        container.appendChild(wrap);
      });
    }

    function handleSaveItem(e) {
      e.preventDefault();
      const form = document.getElementById('editForm');
      const data = {};
      state.columns[state.activeTab].forEach(col => {
        const el = form.elements[col.key];
        if (!el) return;
        data[col.key] = col.type === 'number' ? (el.value === '' ? 0 : Number(el.value)) : el.value;
      });
      if (!data._rowId && !data.maTuongDuong) {
        data._rowId = `custom-${Date.now()}`;
      }
      const ds = state.datasets[state.activeTab];
      if (state.editingItem) {
        const idx = ds.findIndex(item => getRowId(item) === getRowId(state.editingItem));
        if (idx >= 0) ds[idx] = { ...state.editingItem, ...data };
      } else {
        ds.push(data);
      }
      closeEditModal();
      renderUI();
      showToast('Đã lưu dữ liệu thành công!', 'success');
    }

    function handleDeleteSingle(rowId) {
      showDialogConfirm('Xác nhận xóa', 'Bạn có chắc muốn xóa bản ghi này?', () => {
        state.datasets[state.activeTab] = state.datasets[state.activeTab].filter(item => getRowId(item) !== rowId);
        delete state.selectedIds[rowId];
        renderUI();
        showToast('Đã xóa bản ghi.', 'warning');
      }, 'bg-red-600');
    }

    function handleBatchDelete() {
      const ids = Object.keys(state.selectedIds).filter(k => state.selectedIds[k]);
      if (!ids.length) return;
      showDialogConfirm('Xóa hàng loạt', `Xóa ${ids.length} bản ghi đã chọn?`, () => {
        state.datasets[state.activeTab] = state.datasets[state.activeTab].filter(item => !state.selectedIds[getRowId(item)]);
        state.selectedIds = {};
        renderUI();
        showToast(`Đã xóa ${ids.length} bản ghi.`, 'warning');
      }, 'bg-red-600');
    }

    function openFieldModal() {
      document.getElementById('fieldModal').classList.remove('hidden');
      document.getElementById('fieldModal').classList.add('flex');
    }
    function closeFieldModal() {
      document.getElementById('fieldModal').classList.add('hidden');
      document.getElementById('fieldModal').classList.remove('flex');
    }
    function syncFieldKey(label) {
      document.getElementById('newFieldKey').value = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').replace(/_+/g, '_').replace(/^(\d)/, '_$1').toLowerCase() || 'customField';
    }
    function toggleOptionsInput(type) {
      document.getElementById('optionsInputWrapper').classList.toggle('hidden', type !== 'select');
    }
    function handleAddCustomField(e) {
      e.preventDefault();
      const label = document.getElementById('newFieldName').value.trim();
      const key = document.getElementById('newFieldKey').value.trim();
      const type = document.getElementById('newFieldType').value;
      if (state.columns[state.activeTab].some(c => c.key === key)) {
        showToast('Mã trường đã tồn tại!', 'error');
        return;
      }
      const col = { key, label, type };
      if (type === 'select') {
        col.options = document.getElementById('newFieldOptions').value.split(',').map(s => s.trim()).filter(Boolean);
      }
      state.columns[state.activeTab].push(col);
      closeFieldModal();
      renderUI();
      showToast('Đã thêm trường tùy biến.', 'success');
    }
    function handleDeleteColumn(key, label) {
      showDialogConfirm('Xóa trường', `Xóa trường "${label}"?`, () => {
        state.columns[state.activeTab] = state.columns[state.activeTab].filter(c => c.key !== key);
        renderUI();
      }, 'bg-red-600');
    }

    function downloadDvktFile(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    function exportXlsx() {
      const currentCols = state.columns[state.activeTab];
      const currentData = getFilteredData();
      if (!currentData.length) { showToast('Không có dữ liệu để xuất!', 'warning'); return; }
      if (typeof XLSX === 'undefined') { showToast('Thư viện Excel chưa tải. Kiểm tra mạng.', 'error'); return; }
      const sheetRows = currentData.map(item => {
        const o = {};
        currentCols.forEach(col => {
          let v;
          if (col.key === 'tagsMapping' || col.type === 'computed') {
            const ctx = getMappingContext(item, state.activeTab);
            v = [
              'QĐ 7603',
              ctx.theLienKetTT23 ? (SOURCE_TAGS[ctx.theLienKetTT23]?.label || ctx.theLienKetTT23) : '',
              getPvhnTagLabels(ctx.thePhamViHanhNghe || item.thePhamViHanhNghe),
            ].filter(Boolean).join(' | ');
          } else {
            v = item[col.key] ?? '';
            if (col.key === 'thePhamViHanhNghe') v = getPvhnTagLabels(v) || v;
          }
          o[col.label] = v;
        });
        return o;
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetRows), state.activeTab);
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const stamp = new Date().toISOString().slice(0, 10);
      downloadDvktFile(
        new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `DanhMuc_${state.activeTab}_7603_TT23_PVHN_${stamp}.xlsx`
      );
      showToast('Đã xuất Excel!', 'success');
    }

    function triggerImport() { document.getElementById('xlsxFileInput').click(); }

    function handleImportXlsx(event) {
      const file = event.target.files[0];
      if (!file) return;
      if (typeof XLSX === 'undefined') { showToast('Thư viện Excel chưa tải.', 'error'); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          const cols = state.columns[state.activeTab];
          const labelToKey = Object.fromEntries(cols.map(c => [c.label, c.key]));
          const imported = json.map(row => {
            const obj = {};
            Object.entries(row).forEach(([label, val]) => {
              const key = labelToKey[label] || label;
              const col = cols.find(c => c.key === key);
              obj[key] = col && col.type === 'number' ? (Number(val) || 0) : val;
            });
            if (!obj._rowId && !obj.maTuongDuong) obj._rowId = `import-${Date.now()}-${Math.random()}`;
            return obj;
          });
          state.datasets[state.activeTab].push(...imported);
          renderUI();
          showToast(`Đã nhập ${imported.length} dòng từ Excel.`, 'success');
        } catch (err) {
          showToast('File Excel không hợp lệ!', 'error');
        }
      };
      reader.readAsArrayBuffer(file);
      event.target.value = null;
    }

    function downloadTemplate() {
      const cols = state.columns[state.activeTab];
      if (typeof XLSX === 'undefined') { showToast('Thư viện Excel chưa tải.', 'error'); return; }
      const sample = {};
      cols.forEach(c => { sample[c.label] = c.type === 'number' ? 1 : (c.key.includes('ma') ? '01.0001.0001' : `Mẫu ${c.label}`); });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([sample]), 'Mau');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      downloadDvktFile(
        new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `File_Mau_${state.activeTab}.xlsx`
      );
      showToast('Đã tải file mẫu Excel.', 'success');
    }

    // window.onload -> _dvkt_bootstrap.js
