/**
 * Cấu hình Expo động theo tenant (Mô hình A).
 * Build: EXPO_PUBLIC_ORG_ID=phuongchau_can_tho npm run vercel:build
 */
const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');

const LEGACY_ORG_MAP = {
  phuongchau: 'phuongchau_soc_trang',
};

const chuanHoaOrgId = (raw) => {
  const token = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (!token) return '';
  return LEGACY_ORG_MAP[token] || token;
};

const loadProfile = (orgId) => {
  const profilePath = path.join(__dirname, 'config', 'tenants', orgId, 'profile.json');
  if (!fs.existsSync(profilePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(profilePath, 'utf8'));
};

module.exports = () => {
  const orgIdRaw = process.env.EXPO_PUBLIC_ORG_ID
    || process.env.EXPO_PUBLIC_FIREBASE_ORG_ID
    || 'phuongchau_soc_trang';
  const orgId = chuanHoaOrgId(orgIdRaw);
  const profile = loadProfile(orgId) || {
    orgId,
    tenHienThi: appJson.expo.name,
    appName: appJson.expo.name,
    firebaseOrgId: orgId,
  };

  const firebaseOrgId = profile.firebaseOrgId || orgId;
  const appName = profile.appName || profile.tenDayDu || appJson.expo.name;

  const slugSuffix = orgId.replace(/_/g, '-');
  const iosBundle = `com.phuongchau.cdss.${orgId.replace(/_/g, '')}`;
  const androidPackage = iosBundle;

  return {
    expo: {
      ...appJson.expo,
      name: appName,
      slug: `${appJson.expo.slug}-${slugSuffix}`,
      ios: {
        ...appJson.expo.ios,
        bundleIdentifier: iosBundle,
      },
      android: {
        ...appJson.expo.android,
        package: androidPackage,
      },
      extra: {
        ...appJson.expo.extra,
        orgId,
        tenant: profile,
        firebase: {
          ...appJson.expo.extra?.firebase,
          orgId: firebaseOrgId,
        },
        his: {
          ...appJson.expo.extra?.his,
          ...profile.his,
          orgCode: profile.his?.orgCode || orgId,
        },
      },
    },
  };
};
