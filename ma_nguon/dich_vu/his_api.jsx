/**
 * FILE: dich_vu/his_api.jsx
 * MỤC ĐÍCH:
 * - Kết nối hệ thống HIS qua REST, SOAP, WebSocket.
 * - Tiền kiểm hồ sơ realtime để chặn lỗi trước khi đi sâu vào luồng giám định.
 * - Giữ tương thích với các lời gọi cũ của module.
 */

import { Buffer } from 'buffer';
import Constants from 'expo-constants';
import appConfig from '../../app.json';
import {
  validateHoSo as validateHoSoXmlHelper,
  xuLyFileXML130 as xuLyFileXML130XmlHelper,
} from '../tien_ich/xml_helper.jsx';

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RECONNECT_MS = 5000;
const CAC_XML_REALTIME = ['xml1_base64', 'xml2_base64', 'xml3_base64', 'xml4_base64', 'xml5_base64', 'xml6_base64'];

const trimValue = (value) => String(value ?? '').trim();
const hasValue = (value) => {
  if (typeof value === 'boolean' || typeof value === 'number') return true;
  return trimValue(value) !== '';
};

const pickValue = (...values) => {
  for (const value of values) {
    if (hasValue(value)) return value;
  }
  return '';
};

const parseBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  const raw = trimValue(value).toLowerCase();
  if (!raw) return fallback;
  if (['1', 'true', 'yes', 'y', 'on'].includes(raw)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(raw)) return false;
  return fallback;
};

const getEnv = (...keys) => {
  for (const key of keys) {
    const value = globalThis?.process?.env?.[key];
    if (hasValue(value)) return value;
  }
  return '';
};

const getExtraConfig = () => {
  const runtimeExtra = Constants?.expoConfig?.extra || Constants?.manifest?.extra || {};
  const staticExtra = appConfig?.expo?.extra || {};
  return {
    runtimeExtra,
    staticExtra,
  };
};

const getWebStorage = () => {
  try {
    return typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : null;
  } catch (_error) {
    return null;
  }
};

const decodeBase64 = (base64Str) => {
  const raw = trimValue(base64Str);
  if (!raw) return '';
  try {
    if (typeof globalThis.atob === 'function') {
      const binaryStr = globalThis.atob(raw);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    }
    return Buffer.from(raw, 'base64').toString('utf-8');
  } catch (_error) {
    return '';
  }
};

const stringifySafe = (value) => {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return String(value ?? '');
  }
};

const byteLengthOf = (value) => {
  const text = typeof value === 'string' ? value : stringifySafe(value);
  try {
    return new TextEncoder().encode(text).length;
  } catch (_error) {
    return text.length;
  }
};

const safeParseJson = (input) => {
  if (typeof input !== 'string') return input;
  const raw = input.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
};

const buildFileHoSoEnvelope = (payload = {}) => {
  const fileEntries = CAC_XML_REALTIME
    .map((key) => ({ key, base64: trimValue(payload?.[key]) }))
    .filter((item) => item.base64);

  if (fileEntries.length === 0) return '';

  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<GIAMDINHHS>', '  <HOSO>'];
  fileEntries.forEach(({ key, base64 }) => {
    const xmlType = key.replace('_base64', '').toUpperCase();
    lines.push('    <FILEHOSO>');
    lines.push(`      <LOAIHOSO>${xmlType}</LOAIHOSO>`);
    lines.push(`      <NOIDUNGFILE>${base64}</NOIDUNGFILE>`);
    lines.push('    </FILEHOSO>');
  });
  lines.push('  </HOSO>');
  lines.push('</GIAMDINHHS>');
  return lines.join('\n');
};

const parseHoSoFromPayload = (payload) => {
  if (!payload) {
    return { hoSo: null, nguon: 'none', validation: { hop_le: false, danh_sach_loi: ['Không có payload HIS realtime.'] } };
  }

  if (payload?.ho_so && typeof payload.ho_so === 'object') {
    return {
      hoSo: payload.ho_so,
      nguon: 'json.ho_so',
      validation: validateHoSoXmlHelper(payload.ho_so),
    };
  }

  if (payload?.xml_parsed && typeof payload.xml_parsed === 'object') {
    return {
      hoSo: payload.xml_parsed,
      nguon: 'json.xml_parsed',
      validation: validateHoSoXmlHelper(payload.xml_parsed),
    };
  }

  const xmlRaw = pickValue(
    payload?.xml_130,
    payload?.xml130,
    payload?.raw_xml,
    payload?.xml_content,
    payload?.xml,
    decodeBase64(payload?.xml_130_base64),
    decodeBase64(payload?.xml_base64)
  );

  const xmlTongHop = xmlRaw || buildFileHoSoEnvelope(payload);
  if (xmlTongHop) {
    const dsHoSo = xuLyFileXML130XmlHelper(xmlTongHop);
    if (Array.isArray(dsHoSo) && dsHoSo.length > 0) {
      return {
        hoSo: dsHoSo[0],
        nguon: xmlRaw ? 'xml.raw' : 'xml.base64_parts',
        validation: validateHoSoXmlHelper(dsHoSo[0]),
      };
    }

    return {
      hoSo: null,
      nguon: xmlRaw ? 'xml.raw' : 'xml.base64_parts',
      validation: { hop_le: false, danh_sach_loi: ['Không phân tích được hồ sơ XML từ payload HIS realtime.'] },
    };
  }

  return {
    hoSo: null,
    nguon: 'json.metadata_only',
    validation: { hop_le: false, danh_sach_loi: ['Payload HIS chưa chứa đủ XML hoặc ho_so để kiểm tra.'] },
  };
};

const normalizeRealtimeEvent = (rawInput) => {
  const parsed = safeParseJson(rawInput);
  const payload = parsed && typeof parsed === 'object' ? parsed : { raw_message: rawInput };
  const ketQuaHoSo = parseHoSoFromPayload(payload);
  const xml1 = ketQuaHoSo?.hoSo?.xml1 || {};
  const danhSachLoi = Array.isArray(ketQuaHoSo?.validation?.danh_sach_loi)
    ? ketQuaHoSo.validation.danh_sach_loi
    : [];
  const hopLe = ketQuaHoSo?.validation?.hop_le === true;
  const daCoHoSo = Boolean(ketQuaHoSo?.hoSo);
  const maLK = trimValue(payload?.ma_lk || payload?.maLuotKham || xml1.MA_LK || xml1.ma_lk);
  const khoaPhong = trimValue(payload?.khoa_phong || payload?.department || payload?.ma_khoa || xml1.MA_KHOA);
  const thongDiep = hopLe
    ? 'Hồ sơ HIS hợp lệ ở bước tiền kiểm.'
    : (danhSachLoi[0] || 'Hồ sơ HIS cần bổ sung dữ liệu trước khi giám định.');

  return {
    id: trimValue(payload?.event_id || payload?.id || `${Date.now()}`),
    received_at: payload?.received_at || payload?.timestamp || new Date().toISOString(),
    ma_lk: maLK || `HIS_${Date.now()}`,
    khoa_phong: khoaPhong || 'Không xác định',
    trang_thai: hopLe ? 'HỢP LỆ' : (daCoHoSo ? 'CẢNH BÁO' : 'THIẾU DỮ LIỆU'),
    thong_diep: thongDiep,
    so_loi: danhSachLoi.length,
    dung_luong_kb: Number((byteLengthOf(rawInput) / 1024).toFixed(1)),
    nguon_phan_tich: ketQuaHoSo.nguon,
    validation: ketQuaHoSo.validation,
    ho_so_parsed: ketQuaHoSo.hoSo,
    payload,
  };
};

class HisConnector {
  constructor() {
    this.ws = null;
    this.wsReconnectTimer = null;
    this.runtimeToken = '';
    this.manualClose = false;
    this.realtimeOptions = null;
    this.lastRealtimeStatus = {
      connected: false,
      ready: false,
      endpoint: '',
      mode: 'idle',
      message: 'Chưa khởi tạo kết nối realtime HIS.',
      updatedAt: new Date().toISOString(),
    };
  }

  getConfig() {
    const { runtimeExtra, staticExtra } = getExtraConfig();
    const runtimeCfg = runtimeExtra?.his || {};
    const staticCfg = staticExtra?.his || {};
    const storage = getWebStorage();
    const tokenFromStorage = storage?.getItem('his_token') || '';
    const token = trimValue(this.runtimeToken || tokenFromStorage || getEnv('EXPO_PUBLIC_HIS_TOKEN', 'REACT_APP_HIS_TOKEN'));
    const restBaseUrl = trimValue(
      pickValue(runtimeCfg.restBaseUrl, staticCfg.restBaseUrl, getEnv('EXPO_PUBLIC_HIS_REST_BASE_URL', 'REACT_APP_HIS_REST_BASE_URL'))
    );
    const soapWsdlUrl = trimValue(
      pickValue(runtimeCfg.soapWsdlUrl, staticCfg.soapWsdlUrl, getEnv('EXPO_PUBLIC_HIS_SOAP_WSDL_URL', 'REACT_APP_HIS_SOAP_WSDL_URL'))
    );
    const websocketUrl = trimValue(
      pickValue(runtimeCfg.websocketUrl, staticCfg.websocketUrl, getEnv('EXPO_PUBLIC_HIS_WEBSOCKET_URL', 'REACT_APP_HIS_WEBSOCKET_URL'))
    );
    const orgCode = trimValue(pickValue(runtimeCfg.orgCode, staticCfg.orgCode, getEnv('EXPO_PUBLIC_HIS_ORG_CODE', 'REACT_APP_HIS_ORG_CODE')));
    const enabled = parseBoolean(
      pickValue(runtimeCfg.enabled, staticCfg.enabled, getEnv('EXPO_PUBLIC_HIS_ENABLED', 'REACT_APP_HIS_ENABLED')),
      Boolean(restBaseUrl || websocketUrl || soapWsdlUrl)
    );
    const timeoutMs = Number(pickValue(runtimeCfg.timeoutMs, staticCfg.timeoutMs, DEFAULT_TIMEOUT_MS)) || DEFAULT_TIMEOUT_MS;
    const reconnectDelayMs = Number(pickValue(runtimeCfg.reconnectDelayMs, staticCfg.reconnectDelayMs, DEFAULT_RECONNECT_MS)) || DEFAULT_RECONNECT_MS;

    return {
      enabled,
      restBaseUrl,
      soapWsdlUrl,
      websocketUrl,
      token,
      orgCode,
      timeoutMs,
      reconnectDelayMs,
    };
  }

  setAuthToken(token) {
    const normalizedToken = trimValue(token);
    this.runtimeToken = normalizedToken;
    const storage = getWebStorage();
    if (!storage) return;

    if (normalizedToken) storage.setItem('his_token', normalizedToken);
    else storage.removeItem('his_token');
  }

  getRealtimeStatus() {
    const cfg = this.getConfig();
    return {
      ...this.lastRealtimeStatus,
      ready: cfg.enabled && Boolean(cfg.websocketUrl),
      endpoint: cfg.websocketUrl || this.lastRealtimeStatus.endpoint || '',
    };
  }

  _updateRealtimeStatus(partial = {}) {
    this.lastRealtimeStatus = {
      ...this.lastRealtimeStatus,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    const onStatus = this.realtimeOptions?.onStatus;
    if (typeof onStatus === 'function') onStatus(this.getRealtimeStatus());
  }

  async _fetchWithTimeout(url, options, timeoutMs) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      const response = await fetch(url, controller ? { ...options, signal: controller.signal } : options);
      return response;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  _buildHeaders(contentType = 'application/json') {
    const cfg = this.getConfig();
    const headers = {
      'Content-Type': contentType,
    };
    if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;
    if (cfg.orgCode) headers['X-HIS-ORG-CODE'] = cfg.orgCode;
    return headers;
  }

  async fetchREST(endpoint, method = 'GET', data = null) {
    const cfg = this.getConfig();
    if (!cfg.enabled) throw new Error('Tích hợp HIS đang tắt (his.enabled=false).');
    if (!cfg.restBaseUrl) throw new Error('Chưa cấu hình HIS REST base URL.');

    const cleanEndpoint = String(endpoint || '').startsWith('/') ? endpoint : `/${endpoint || ''}`;
    const url = `${cfg.restBaseUrl}${cleanEndpoint}`;
    const response = await this._fetchWithTimeout(
      url,
      {
        method,
        headers: this._buildHeaders('application/json'),
        body: data ? JSON.stringify(data) : null,
      },
      cfg.timeoutMs
    );

    if (!response.ok) {
      throw new Error(`Lỗi khi gọi HIS REST API: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async fetchSOAP(actionName, xmlBody) {
    const cfg = this.getConfig();
    if (!cfg.enabled) throw new Error('Tích hợp HIS đang tắt (his.enabled=false).');
    if (!cfg.soapWsdlUrl) throw new Error('Chưa cấu hình HIS SOAP WSDL URL.');

    const response = await this._fetchWithTimeout(
      cfg.soapWsdlUrl,
      {
        method: 'POST',
        headers: {
          ...this._buildHeaders('text/xml; charset=utf-8'),
          SOAPAction: actionName,
        },
        body: xmlBody,
      },
      cfg.timeoutMs
    );

    if (!response.ok) {
      throw new Error(`Lỗi khi gọi HIS SOAP API: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }

  async checkRealtimeConnection() {
    const cfg = this.getConfig();
    if (!cfg.enabled) {
      return { ok: false, reason: 'HIS đang tắt (his.enabled=false).' };
    }
    if (!cfg.websocketUrl) {
      return { ok: false, reason: 'Chưa cấu hình HIS websocket URL.' };
    }
    return {
      ok: true,
      reason: 'Sẵn sàng mở kênh realtime HIS.',
      endpoint: cfg.websocketUrl,
    };
  }

  analyzeRealtimePayload(rawPayload) {
    return normalizeRealtimeEvent(rawPayload);
  }

  connectWebSocket(callbackOrOptions) {
    const options = typeof callbackOrOptions === 'function'
      ? { onMessage: callbackOrOptions }
      : (callbackOrOptions || {});
    const cfg = this.getConfig();

    this.realtimeOptions = {
      autoReconnect: options.autoReconnect !== false,
      onMessage: options.onMessage,
      onStatus: options.onStatus,
      onError: options.onError,
    };

    if (!cfg.enabled) {
      this._updateRealtimeStatus({
        connected: false,
        ready: false,
        endpoint: '',
        mode: 'disabled',
        message: 'HIS đang tắt (his.enabled=false).',
      });
      return false;
    }

    if (!cfg.websocketUrl) {
      this._updateRealtimeStatus({
        connected: false,
        ready: false,
        endpoint: '',
        mode: 'missing-config',
        message: 'Chưa cấu hình HIS websocket URL.',
      });
      return false;
    }

    if (typeof WebSocket !== 'function') {
      this._updateRealtimeStatus({
        connected: false,
        ready: false,
        endpoint: cfg.websocketUrl,
        mode: 'unsupported',
        message: 'Môi trường hiện tại không hỗ trợ WebSocket.',
      });
      return false;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this._updateRealtimeStatus({
        connected: this.ws.readyState === WebSocket.OPEN,
        ready: true,
        endpoint: cfg.websocketUrl,
        mode: this.ws.readyState === WebSocket.OPEN ? 'connected' : 'connecting',
        message: this.ws.readyState === WebSocket.OPEN ? 'Kênh realtime HIS đang hoạt động.' : 'Đang kết nối kênh realtime HIS...',
      });
      return true;
    }

    this.manualClose = false;
    this._updateRealtimeStatus({
      connected: false,
      ready: true,
      endpoint: cfg.websocketUrl,
      mode: 'connecting',
      message: 'Đang kết nối kênh realtime HIS...',
    });

    try {
      this.ws = new WebSocket(cfg.websocketUrl);
    } catch (error) {
      const message = error?.message || 'Không khởi tạo được WebSocket HIS.';
      this._updateRealtimeStatus({
        connected: false,
        ready: true,
        endpoint: cfg.websocketUrl,
        mode: 'error',
        message,
      });
      if (typeof this.realtimeOptions?.onError === 'function') {
        this.realtimeOptions.onError(error);
      }
      return false;
    }

    this.ws.onopen = () => {
      this._updateRealtimeStatus({
        connected: true,
        ready: true,
        endpoint: cfg.websocketUrl,
        mode: 'connected',
        message: 'Đã kết nối realtime HIS. Hồ sơ mới sẽ được tiền kiểm ngay khi phát sinh.',
      });
    };

    this.ws.onmessage = (event) => {
      const normalizedEvent = normalizeRealtimeEvent(event?.data);
      if (typeof this.realtimeOptions?.onMessage === 'function') {
        this.realtimeOptions.onMessage(normalizedEvent);
      }
    };

    this.ws.onerror = (error) => {
      this._updateRealtimeStatus({
        connected: false,
        ready: true,
        endpoint: cfg.websocketUrl,
        mode: 'error',
        message: 'Kênh realtime HIS gặp lỗi kết nối.',
      });
      if (typeof this.realtimeOptions?.onError === 'function') {
        this.realtimeOptions.onError(error);
      }
    };

    this.ws.onclose = () => {
      this._updateRealtimeStatus({
        connected: false,
        ready: true,
        endpoint: cfg.websocketUrl,
        mode: 'disconnected',
        message: this.manualClose ? 'Đã dừng lắng nghe realtime HIS.' : 'Mất kết nối realtime HIS. Hệ thống sẽ tự thử kết nối lại.',
      });

      if (!this.manualClose && this.realtimeOptions?.autoReconnect) {
        clearTimeout(this.wsReconnectTimer);
        this.wsReconnectTimer = setTimeout(() => {
          this.connectWebSocket(this.realtimeOptions);
        }, cfg.reconnectDelayMs);
      }
    };

    return true;
  }

  disconnectWebSocket() {
    this.manualClose = true;
    clearTimeout(this.wsReconnectTimer);
    this.wsReconnectTimer = null;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._updateRealtimeStatus({
      connected: false,
      mode: 'idle',
      message: 'Đã dừng lắng nghe realtime HIS.',
    });
  }

  async getAndParseXML130FromHIS(maLuotKham) {
    try {
      const response = await this.fetchREST(`/hoso130/${maLuotKham}`, 'GET');
      const rawXml = response?.data;
      if (!rawXml) {
        return { success: false, message: 'Không tìm thấy dữ liệu hồ sơ XML 130.' };
      }

      const danhSachHoSo = xuLyFileXML130XmlHelper(rawXml);
      if (!danhSachHoSo || danhSachHoSo.length === 0) {
        return { success: false, message: 'Không thể phân tích dữ liệu XML 130 từ HIS.' };
      }

      return {
        success: true,
        data: danhSachHoSo[0],
        message: 'Lấy và phân tích hồ sơ XML 130 thành công.',
      };
    } catch (error) {
      console.error('Lỗi khi lấy hồ sơ từ HIS:', error);
      return { success: false, message: error?.message || 'Không thể lấy hồ sơ từ HIS.' };
    }
  }
}

export const xuLyFileXML130 = (...args) => xuLyFileXML130XmlHelper(...args);
export const validateHoSo = (...args) => validateHoSoXmlHelper(...args);
export const phanTichSuKienRealtimeHIS = (rawPayload) => normalizeRealtimeEvent(rawPayload);
export const HisAPI = new HisConnector();