import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { tenantGetItem, tenantSetItem, tenantRemoveItem } from './tenant_storage';

const SESSION_ACCOUNT_KEY = 'USER_ACCOUNT';
const SESSION_ROLE_KEY = 'USER_ROLE';

const laMoiTruongWeb = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;

const docGiaTriPhien = tenantGetItem;

const ghiGiaTriPhien = tenantSetItem;

const xoaGiaTriPhien = tenantRemoveItem;

export const docPhienDangNhap = async () => {
  const [email, role] = await Promise.all([
    docGiaTriPhien(SESSION_ACCOUNT_KEY),
    docGiaTriPhien(SESSION_ROLE_KEY),
  ]);

  return {
    email: String(email || '').trim().toLowerCase(),
    role: String(role || '').trim().toUpperCase(),
  };
};

export const coPhienDangNhapHopLe = async () => {
  const session = await docPhienDangNhap();
  return Boolean(session.email && session.role);
};

export const luuPhienDangNhap = async (email, role) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedRole = String(role || 'USER').trim().toUpperCase() || 'USER';
  await Promise.all([
    ghiGiaTriPhien(SESSION_ACCOUNT_KEY, normalizedEmail),
    ghiGiaTriPhien(SESSION_ROLE_KEY, normalizedRole),
  ]);
  return { email: normalizedEmail, role: normalizedRole };
};

export const xoaPhienDangNhap = async () => {
  await Promise.all([
    xoaGiaTriPhien(SESSION_ACCOUNT_KEY),
    xoaGiaTriPhien(SESSION_ROLE_KEY),
  ]);
};