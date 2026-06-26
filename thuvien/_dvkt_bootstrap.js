
    // === TẢI DỮ LIỆU — lazy + song song + IndexedDB cache ===
    let state = null;

    const DVKT_TAB_IDS = ['pl1', 'pl2', 'pl3', 'tt23pl1', 'tt23pl2', 'bvpcst', 'bvpcct', 'bvpsd', 'pvhnbhxh', 'quytrinhkt'];
    const DVKT_MAPFULL_DEPS = ['pl1', 'tt23pl1', 'tt23pl2', 'bvpcst', 'bvpcct', 'bvpsd'];
    const DVKT_PRIORITY_TAB = 'pl1';
    const DVKT_IDB_NAME = 'dvkt_catalog';
    const DVKT_IDB_STORE = 'kv';

    let dvktManifest = null;
    const dvktTabLoading = new Map();
    let dvktPrefetchDone = false;

    function initDvktState(columnDefs, datasetDefs) {
      state = {
        activeTab: 'pl1',
        searchTerm: '',
        filterPhanTuyen: '',
        filterTheNguon: '',
        filterPhamVi: '',
        filterIcd: '',
        currentPage: 1,
        itemsPerPage: 10,
        selectedIds: {},
        editingItem: null,
        columns: columnDefs,
        datasets: datasetDefs,
      };
    }

    function setDvktLoading(visible, message) {
      const el = document.getElementById('dvktLoadingOverlay');
      if (!el) return;
      el.classList.toggle('hidden', !visible);
      const msg = document.getElementById('dvktLoadingMessage');
      if (msg && message) msg.textContent = message;
    }

    function isRemoteDvktMode() {
      return typeof INITIAL_PL1_DATA === 'undefined';
    }

    function openDvktIdb() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(DVKT_IDB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(DVKT_IDB_STORE)) {
            db.createObjectStore(DVKT_IDB_STORE);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    async function idbGet(key) {
      try {
        const db = await openDvktIdb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(DVKT_IDB_STORE, 'readonly');
          const req = tx.objectStore(DVKT_IDB_STORE).get(key);
          req.onsuccess = () => resolve(req.result ?? null);
          req.onerror = () => reject(req.error);
        });
      } catch (_) {
        return null;
      }
    }

    async function idbSet(key, value) {
      try {
        const db = await openDvktIdb();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(DVKT_IDB_STORE, 'readwrite');
          tx.objectStore(DVKT_IDB_STORE).put(value, key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (_) { /* ignore quota */ }
    }

    function getPvhnbhxhEmbeddedPack() {
      if (typeof INITIAL_PVHN_BHXH_DATA === 'undefined' || !INITIAL_PVHN_BHXH_DATA.length) return null;
      return {
        columns: typeof INITIAL_PVHN_BHXH_COLUMNS !== 'undefined' ? [...INITIAL_PVHN_BHXH_COLUMNS] : [],
        rows: [...INITIAL_PVHN_BHXH_DATA],
      };
    }

    function applyPvhnbhxhSeed() {
      if (!state || isTabDataLoaded('pvhnbhxh')) return false;
      const pack = getPvhnbhxhEmbeddedPack();
      if (!pack) return false;
      state.columns.pvhnbhxh = pack.columns;
      state.datasets.pvhnbhxh = pack.rows;
      if (typeof renderStatsAndTabs === 'function') renderStatsAndTabs();
      return true;
    }

    async function fetchDvktDataset(tabId) {
      if (tabId === 'pvhnbhxh') {
        try {
          const res = await fetch(`/api/data/${tabId}`);
          if (res.ok) {
            const pack = await res.json();
            if (pack.rows?.length) return pack;
          }
        } catch (_) { /* dùng bản nhúng */ }
        const embedded = getPvhnbhxhEmbeddedPack();
        if (embedded) return embedded;
        throw new Error('Không tải được danh mục PVHN BHXH');
      }
      const res = await fetch(`/api/data/${tabId}`);
      if (!res.ok) throw new Error(`Không tải được ${tabId}: HTTP ${res.status}`);
      return res.json();
    }

    function isTabDataLoaded(tabId) {
      return state?.datasets?.[tabId] && state.datasets[tabId].length > 0;
    }

    async function loadTabIfNeeded(tabId) {
      if (!state || !isRemoteDvktMode()) return;
      if (isTabDataLoaded(tabId)) return;
      if (dvktTabLoading.has(tabId)) return dvktTabLoading.get(tabId);

      const job = (async () => {
        const pack = await fetchDvktDataset(tabId);
        if (pack.columns?.length) state.columns[tabId] = pack.columns;
        state.datasets[tabId] = pack.rows || [];
        if (typeof renderStatsAndTabs === 'function') renderStatsAndTabs();
      })();

      dvktTabLoading.set(tabId, job);
      try {
        await job;
      } finally {
        dvktTabLoading.delete(tabId);
      }
    }

    async function ensureTabLoaded(tabId) {
      if (!isRemoteDvktMode() || !state) return;
      if (tabId === 'baocao') {
        const src = (typeof dvktReportState !== 'undefined' && dvktReportState.sourceTab) || 'mapfull';
        await ensureTabLoaded(src);
        return;
      }
      if (tabId === 'mapfull') {
        await Promise.all(DVKT_MAPFULL_DEPS.map(t => loadTabIfNeeded(t)));
        if (typeof ensureMasterMapTab === 'function') ensureMasterMapTab();
        return;
      }
      if (DVKT_TAB_IDS.includes(tabId)) {
        await loadTabIfNeeded(tabId);
      }
    }

    async function saveDvktCacheBundle() {
      if (!dvktManifest || !state) return;
      const allLoaded = DVKT_TAB_IDS.every(isTabDataLoaded);
      if (!allLoaded) return;
      await idbSet('bundle', {
        version: dvktManifest.version,
        columns: state.columns,
        datasets: Object.fromEntries(DVKT_TAB_IDS.map(t => [t, state.datasets[t]])),
      });
    }

    async function prefetchRemainingTabs() {
      if (dvktPrefetchDone) return;
      const rest = DVKT_TAB_IDS.filter(t => t !== DVKT_PRIORITY_TAB);
      await Promise.all(rest.map(t => loadTabIfNeeded(t)));
      dvktPrefetchDone = true;
      await saveDvktCacheBundle();
      if (typeof renderStatsAndTabs === 'function') renderStatsAndTabs();
    }

    function initEmptyRemoteState(manifest) {
      const cols = {};
      const rows = {};
      DVKT_TAB_IDS.forEach(t => {
        cols[t] = manifest.columns?.[t] ? [...manifest.columns[t]] : [];
        rows[t] = [];
      });
      initDvktState(cols, rows);
    }

    async function bootstrapRemoteDvkt() {
      setDvktLoading(true, 'Đang khởi động...');
      try {
        const manifestRes = await fetch('/api/manifest');
        if (!manifestRes.ok) throw new Error('Không tải được manifest');
        dvktManifest = await manifestRes.json();

        const cached = await idbGet('bundle');
        if (cached?.version === dvktManifest.version && cached.datasets?.pl1?.length) {
          initEmptyRemoteState(dvktManifest);
          DVKT_TAB_IDS.forEach(t => {
            if (cached.columns?.[t]?.length) state.columns[t] = cached.columns[t];
            if (cached.datasets?.[t]?.length) state.datasets[t] = cached.datasets[t];
          });
          dvktPrefetchDone = DVKT_TAB_IDS.every(isTabDataLoaded);
          applyPvhnbhxhSeed();
          if (typeof loadDvktReportState === 'function') loadDvktReportState();
          setDvktLoading(false);
          renderUI();
          showToast('Đã mở từ bộ nhớ cache — không cần tải lại danh mục.', 'success');
          return;
        }

        initEmptyRemoteState(dvktManifest);
        applyPvhnbhxhSeed();

        setDvktLoading(true, 'Đang tải PL1 (danh mục chính)...');
        await loadTabIfNeeded(DVKT_PRIORITY_TAB);
        if (typeof loadDvktReportState === 'function') loadDvktReportState();
        setDvktLoading(false);
        renderUI();
        showToast('Sẵn sàng — các phụ lục khác đang tải nền.', 'info');

        prefetchRemainingTabs()
          .then(() => showToast('Đã tải đủ tất cả phụ lục.', 'success'))
          .catch(err => console.warn('Prefetch:', err));
      } catch (err) {
        console.error(err);
        setDvktLoading(false);
        showToast('Lỗi tải dữ liệu: ' + (err.message || 'không xác định'), 'error');
      }
    }

    function bootstrapEmbeddedDvkt() {
      if (typeof INITIAL_PL1_DATA === 'undefined') return false;
      initDvktState(
        {
          pl1: [...INITIAL_PL1_COLUMNS],
          pl2: [...INITIAL_PL2_COLUMNS],
          pl3: [...INITIAL_PL3_COLUMNS],
          tt23pl1: [...INITIAL_TT23_PL1_COLUMNS],
          tt23pl2: [...INITIAL_TT23_PL2_COLUMNS],
          bvpcst: [...INITIAL_BVPCST_COLUMNS],
          bvpcct: [...INITIAL_BVPCCT_COLUMNS],
          bvpsd: [...INITIAL_BVPSD_COLUMNS],
          pvhnbhxh: typeof INITIAL_PVHN_BHXH_COLUMNS !== 'undefined' ? [...INITIAL_PVHN_BHXH_COLUMNS] : [],
        },
        {
          pl1: [...INITIAL_PL1_DATA],
          pl2: [...INITIAL_PL2_DATA],
          pl3: [...INITIAL_PL3_DATA],
          tt23pl1: [...INITIAL_TT23_PL1_DATA],
          tt23pl2: [...INITIAL_TT23_PL2_DATA],
          bvpcst: [...INITIAL_BVPCST_DATA],
          bvpcct: [...INITIAL_BVPCCT_DATA],
          bvpsd: [...INITIAL_BVPSD_DATA],
          pvhnbhxh: typeof INITIAL_PVHN_BHXH_DATA !== 'undefined' ? [...INITIAL_PVHN_BHXH_DATA] : [],
        }
      );
      applyPvhnbhxhSeed();
      return true;
    }

    window.onload = async function() {
      if (bootstrapEmbeddedDvkt()) {
        if (typeof loadDvktReportState === 'function') loadDvktReportState();
        renderUI();
        showToast(`${CATALOG_QD_LABEL} + ${CATALOG_TT23_LABEL} + PVHN — Hệ thống sẵn sàng!`, 'info');
        return;
      }
      await bootstrapRemoteDvkt();
      if (typeof applyDvktDeepLinkFromUrl === 'function') {
        applyDvktDeepLinkFromUrl(state, switchTab, ensureTabLoaded);
      }
    };
