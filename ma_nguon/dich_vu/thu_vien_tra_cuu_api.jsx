import Constants from 'expo-constants';
import { Alert, Linking, Platform } from 'react-native';

const THUVIEN_WEB_PREFIX = '/thuvien';

const layExtraExpo = () => (
  Constants.expoConfig?.extra
  || Constants.manifest2?.extra
  || Constants.manifest?.extra
  || {}
);

const layOriginWeb = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return '';
  return String(window.location?.origin || '').trim().replace(/\/$/, '');
};

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

/** Web/Vercel: static cùng origin. Native dev: Flask tùy chọn qua baseUrl. */
export const thuVienTraCuuConfig = () => {
  const extra = layExtraExpo();
  const cfg = extra?.thuvienTraCuu || {};
  const port = Number(cfg.port) > 0 ? Number(cfg.port) : 5050;
  const configured = String(cfg.baseUrl || '').trim().replace(/\/$/, '');
  const webOrigin = layOriginWeb();
  let baseUrl;
  let mode = 'static';

  if (webOrigin) {
    baseUrl = `${webOrigin}${THUVIEN_WEB_PREFIX}`;
  } else if (configured) {
    baseUrl = configured;
    mode = 'flask';
  } else {
    const devHost = layHostMayPhatTrien();
    if (devHost) baseUrl = `http://${devHost}:${port}`;
    else if (Platform.OS === 'android') baseUrl = `http://10.0.2.2:${port}`;
    else baseUrl = `http://127.0.0.1:${port}`;
    mode = 'flask';
  }
  baseUrl = mayAnhLoopbackAndroidGiaLap(baseUrl);
  const timeoutMs = Number(cfg.timeoutMs) > 0 ? Number(cfg.timeoutMs) : 12000;
  return {
    enabled: cfg.enabled !== false,
    baseUrl,
    mode,
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
      mode: cfg.mode,
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
        : cfg.mode === 'static'
          ? 'Thư viện chưa sẵn sàng — chạy npm run thuvien:prepare rồi build lại web.'
          : 'Thư viện chưa phản hồi — chạy npm run thuvien:start (Flask dev).',
    };
  } catch (error) {
    const msg = error?.name === 'AbortError' ? 'Timeout' : (error?.message || String(error));
    return {
      ok: false,
      mode: cfg.mode,
      baseUrl: cfg.baseUrl,
      dvktUrl: cfg.dvktUrl,
      duocThuUrl: cfg.duocThuUrl,
      message: cfg.mode === 'static'
        ? `Không tải được Thư viện: ${msg}. Chạy: npm run thuvien:prepare`
        : `Không kết nối Flask: ${msg}. Chạy: npm run thuvien:start`,
    };
  }
};

/** Mở DVKT hoặc Dược thư trong tab/cửa sổ trình duyệt mới. */
export const moThuVienTraCuuTabMoi = async (loai) => {
  const cfg = thuVienTraCuuConfig();
  const url = loai === 'duocthu' ? cfg.duocThuUrl : cfg.dvktUrl;
  const label = loai === 'duocthu' ? 'Dược thư' : 'DM DVKT';
  const trimmed = String(url || '').trim();
  if (!trimmed) {
    Alert.alert('Thiếu URL', `Chưa cấu hình ${label}.`);
    return;
  }
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(trimmed, '_blank', 'noopener,noreferrer');
      return;
    }
    const supported = await Linking.canOpenURL(trimmed);
    if (supported) await Linking.openURL(trimmed);
    else Alert.alert('Không mở được', trimmed);
  } catch (e) {
    Alert.alert('Lỗi mở liên kết', String(e?.message || e));
  }
};
