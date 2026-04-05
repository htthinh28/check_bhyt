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
    || ''
  ).trim();

  if (!hostUri) return '';

  const [hostPort] = hostUri.split('/');
  const [host] = hostPort.split(':');
  return String(host || '').trim();
};

const resolvePythonServiceBaseUrl = () => {
  const extra = layExtraExpo();
  const configuredBaseUrl = String(extra?.pythonService?.baseUrl || '').trim();
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/$/, '');

  const devHost = layHostMayPhatTrien();
  if (devHost) return `http://${devHost}:8000`;
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  return 'http://127.0.0.1:8000';
};

const resolvePythonServiceTimeoutMs = () => {
  const extra = layExtraExpo();
  const timeoutMs = Number(extra?.pythonService?.timeoutMs);
  return Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 20000;
};

const fetchJsonWithTimeout = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), resolvePythonServiceTimeoutMs());

  try {
    const response = await fetch(`${resolvePythonServiceBaseUrl()}${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.detail || `Python service HTTP ${response.status}`;
      throw new Error(message);
    }
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const pythonServiceConfig = () => ({
  ...layExtraExpo()?.pythonService,
  baseUrl: resolvePythonServiceBaseUrl(),
  timeoutMs: resolvePythonServiceTimeoutMs(),
});

export const healthCheckPythonService = async () => fetchJsonWithTimeout('/health');

export const auditClaimsBangPythonService = async ({ claims = [], options = {} } = {}) => {
  return fetchJsonWithTimeout('/api/v1/audit/claims', {
    method: 'POST',
    body: { claims, options },
  });
};