// Liên kết giữa Danh mục DVKT (Flask / dich vụ kỹ thuật.html) và Dược thư Phương Châu
(function (global) {
  const DEFAULT_LINKS = {
    dvktWebUrl: 'http://127.0.0.1:5050/',
    dvktHtmlFallback: 'dich vụ kỹ thuật.html',
    duocThuHtml: 'http://127.0.0.1:5050/duocthu',
    duocThuHtmlFile: 'Dược thư Phương Châu - CHỈ MỞ FILE NÀY (1).html',
  };

  function getPcAppLinks() {
    return Object.assign({}, DEFAULT_LINKS, global.PC_APP_LINKS || {});
  }

  function buildDvktUrl(opts) {
    opts = opts || {};
    const cfg = getPcAppLinks();
    let base = (cfg.dvktWebUrl || DEFAULT_LINKS.dvktWebUrl).trim();
    if (!/\/$/.test(base)) base += '/';
    const params = new URLSearchParams();
    if (opts.tab) params.set('tab', opts.tab);
    if (opts.icd) params.set('icd', String(opts.icd).toUpperCase());
    if (opts.q) params.set('q', opts.q);
    if (opts.maKyThuat) params.set('ma', opts.maKyThuat);
    const qs = params.toString();
    return qs ? base + '?' + qs : base;
  }

  function buildDuocThuUrl(opts) {
    opts = opts || {};
    const cfg = getPcAppLinks();
    let base = cfg.duocThuHtml || DEFAULT_LINKS.duocThuHtml;
    if (location.protocol === 'file:' && cfg.duocThuHtmlFile) {
      base = cfg.duocThuHtmlFile;
    }
    const parts = ['duocthu'];
    const params = new URLSearchParams();
    if (opts.icd) params.set('icd', String(opts.icd).toUpperCase());
    if (opts.q) params.set('q', opts.q);
    if (opts.section && opts.section !== 'duocthu') parts[0] = opts.section;
    const qs = params.toString();
    return base + '#' + parts.join('/') + (qs ? '?' + qs : '');
  }

  function openPcDvktApp(opts) {
    const url = buildDvktUrl(opts);
    try {
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      location.href = url;
    }
  }

  function openPcDuocThuApp(opts) {
    const url = buildDuocThuUrl(opts);
    try {
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      location.href = url;
    }
  }

  function openPcDuocThuByIcd(icd, q) {
    openPcDuocThuApp({ icd: icd, q: q });
  }

  function openPcDvktByIcd(icd, tab) {
    openPcDvktApp({ icd: icd, tab: tab || 'quytrinhkt' });
  }

  function parseDuocThuHashIcd() {
    try {
      const raw = (location.hash || '').replace(/^#\/?/, '');
      const qIdx = raw.indexOf('?');
      const qs = qIdx >= 0 ? raw.slice(qIdx + 1) : '';
      const params = new URLSearchParams(qs);
      return (params.get('icd') || '').trim().toUpperCase();
    } catch (e) {
      return '';
    }
  }

  function applyDuocThuDeepLinkFromHash() {
    const icd = parseDuocThuHashIcd();
    if (!icd) return;
    const search = document.getElementById('searchInput');
    if (search) {
      search.value = icd;
      if (typeof handleSearch === 'function') handleSearch(icd);
      else search.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const icdSearch = document.getElementById('icdSearchInput');
    if (icdSearch) {
      icdSearch.value = icd;
      if (typeof filterIcdCatalog === 'function') filterIcdCatalog();
    }
  }

  function applyDvktDeepLinkFromUrl(state, switchTabFn, ensureTabFn) {
    try {
      const p = new URLSearchParams(location.search);
      const tab = p.get('tab');
      const icd = (p.get('icd') || '').trim().toUpperCase();
      const q = p.get('q');
      const ma = p.get('ma');
      if (state) {
        if (q) state.searchTerm = decodeURIComponent(q);
        if (icd) state.filterIcd = icd;
        if (ma) state.searchTerm = ma;
      }
      const go = () => {
        if (tab && typeof switchTabFn === 'function') switchTabFn(tab);
        if (typeof renderUI === 'function') renderUI();
      };
      if (tab && typeof ensureTabFn === 'function') {
        ensureTabFn(tab).then(go).catch(go);
      } else {
        go();
      }
    } catch (e) {
      console.warn('applyDvktDeepLinkFromUrl', e);
    }
  }

  global.PC_APP_LINKS = global.PC_APP_LINKS || {};
  global.getPcAppLinks = getPcAppLinks;
  global.buildDvktUrl = buildDvktUrl;
  global.buildDuocThuUrl = buildDuocThuUrl;
  global.openPcDvktApp = openPcDvktApp;
  global.openPcDuocThuApp = openPcDuocThuApp;
  global.openPcDuocThuByIcd = openPcDuocThuByIcd;
  global.openPcDvktByIcd = openPcDvktByIcd;
  global.applyDuocThuDeepLinkFromHash = applyDuocThuDeepLinkFromHash;
  global.applyDvktDeepLinkFromUrl = applyDvktDeepLinkFromUrl;
  global.navigateToDvktApp = openPcDvktApp;
})(typeof window !== 'undefined' ? window : globalThis);
