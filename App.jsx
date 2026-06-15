import { Platform, Text, TextInput } from 'react-native';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DieuHuongChinh from './ma_nguon/dieu_huong/tuyen_duong';
import { ChuDeProvider } from './ma_nguon/tien_ich/chu_de_giao_dien';
import { damBaoMigrationTenant } from './ma_nguon/tien_ich/tenant_migration';
import { resolveOrgId, layTenantProfile } from './ma_nguon/tien_ich/tenant_context';

const FONT_VI_SAFE = Platform.OS === 'web'
  ? "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Roboto', 'Helvetica Neue', Arial, sans-serif"
  : 'Arial';
if (!Text.defaultProps) Text.defaultProps = {};
if (!TextInput.defaultProps) TextInput.defaultProps = {};
Text.defaultProps.style = [{ fontFamily: FONT_VI_SAFE }, Text.defaultProps.style];
TextInput.defaultProps.style = [{ fontFamily: FONT_VI_SAFE }, TextInput.defaultProps.style];

export default function App() {
  useEffect(() => {
    damBaoMigrationTenant().catch(() => {});
    const profile = layTenantProfile();
    const orgId = resolveOrgId();
    if (__DEV__) {
      console.log(`[CDSS] tenant org_id=${orgId} bv=${profile?.tenHienThi || profile?.tenDayDu || orgId}`);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ChuDeProvider>
        <DieuHuongChinh />
      </ChuDeProvider>
    </SafeAreaProvider>
  );
}
