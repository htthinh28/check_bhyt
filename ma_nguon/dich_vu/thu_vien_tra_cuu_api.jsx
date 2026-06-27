import Constants from 'expo-constants';
import { Platform } from 'react-native';

const layExtraExpo = () => (
  Constants.expoConfig?.extra
  || Constants.manifest2?.extra
  || Constants.manifest?.extra
  || {}
);

const layHostMayPhatTrien = () => {
  const hostUri = String(
    Constants.expoConfig?.hostUri
    || Constants.manifest2?.extra?.expoClient?.hostUri
    || Constants.manifest?.debuggerHost
    || '',
  ).trim();
  if (!hostUri) return '';
  const [hostPort] = hostUri.split('/');
  const [host] = hostPort.split(':');
  return String(host || '').trim();
};

const mayAnhLoopbackAndroidGiaLap = (baseUrl) => {
  const trimmed = String(baseUrl || '').trim().replace(/\/$/, '');
  if (!trimmed || Platform.OS !== 'android') return trimmed;
  if (Constants.isDevice === true) return trimmed;
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    const u = new URL(withScheme);
    const host = (u.hostname || '').toLowerCase();
    if (host === '127.0.0.1' || host === 'localhost') {
      u.hostname = '10.0.2.2';
      return u.toString().replace(/\/$/, '');
    }
  } catch {
    /* ignore */
  }
  return trimmed;
};

export const thuVienTraCuuConfig = () => {
  const extra = layExtraExpo();
  const cfg = extra?.thuvienTraCuu || {};
  const port = Number(cfg.port) > 0 ? Number(cfg.port) : 5050;
  const configured = String(cfg.baseUrl || '').trim().replace(/\/$/, '');
  let baseUrl;
  if (configured) {
    baseUrl = configured;
  } else {
    const devHost = layHostMayPhatTrien();
    if (devHost) baseUrl = `http://${devHost}:${port}`;
    else if (Platform.OS === 'android') baseUrl = `http://10.0.2.2:${port}`;
    else baseUrl = `http://127.0.0.1:${port}`;
  }
  baseUrl = mayAnhLoopbackAndroidGiaLap(baseUrl);
  const timeoutMs = Number(cfg.timeoutMs) > 0 ? Number(cfg.timeoutMs) : 12000;
  return {
    enabled: cfg.enabled !== false,
    baseUrl,
    dvktUrl: `${baseUrl}/`,
    duocThuUrl: `${baseUrl}/duocthu`,
    timeoutMs,
  };
};

const fetchJsonWithTimeout = async (url, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json, */*' },
      signal: controller.signal,
    });
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text?.slice(0, 200) };
    }
    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timer);
  }
};

export const healthCheckThuVienTraCuu = async () => {
  const cfg = thuVienTraCuuConfig();
  if (!cfg.enabled) {
    return { ok: false, disabled: true, message: 'Thư viện tra cứu đang tắt (thuvienTraCuu.enabled=false).' };
  }
  try {
    const manifest = await fetchJsonWithTimeout(`${cfg.baseUrl}/api/manifest`, cfg.timeoutMs);
    const duocthu = await fetchJsonWithTimeout(`${cfg.baseUrl}/api/duocthu/status`, cfg.timeoutMs);
    const tabs = Array.isArray(manifest.data?.tabs) ? manifest.data.tabs : [];
    const ok = manifest.ok && duocthu.ok;
    return {
      ok,
      baseUrl: cfg.baseUrl,
      dvktUrl: cfg.dvktUrl,
      duocThuUrl: cfg.duocThuUrl,
      manifest: {
        ok: manifest.ok,
        status: manifest.status,
        tabCount: tabs.length,
        version: manifest.data?.version || '',
        tabs,
      },
      duocthu: {
        ok: duocthu.ok,
        status: duocthu.status,
        ...duocthu.data,
      },
      message: ok
        ? `Thư viện tra cứu sẵn sàng (${tabs.length} tab DVKT).`
        : 'Thư viện tra cứu chưa phản hồi đủ — chạy npm run thuvien:start trên máy chủ.',
    };
  } catch (error) {
    const msg = error?.name === 'AbortError' ? 'Timeout' : (error?.message || String(error));
    return {
      ok: false,
      baseUrl: cfg.baseUrl,
      dvktUrl: cfg.dvktUrl,
      duocThuUrl: cfg.duocThuUrl,
      message: `Không kết nối được Thư viện tra cứu: ${msg}. Chạy: npm run thuvien:start`,
    };
  }
};
