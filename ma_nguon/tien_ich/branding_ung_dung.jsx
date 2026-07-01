/**
 * Ảnh hero màn đầu (cổng triển khai / đăng nhập).
 * Web: public/branding (Vercel không upload tai_nguyen/).
 * Native: ma_nguon/assets.
 */
import { Platform } from 'react-native';

export const ANH_HERO_TRANG_DAU_URL = 'https://i.ibb.co/k2QddHbr/Gemini-Generated-Image-1yct391yct391yct.png';

const ANH_HERO_NATIVE = require('../assets/hero_trang_dau.webp');

export const layNguonAnhHeroTrangDau = () => (
  Platform.OS === 'web'
    ? { uri: '/branding/hero_trang_dau.webp' }
    : ANH_HERO_NATIVE
);

export default {
  ANH_HERO_TRANG_DAU_URL,
  layNguonAnhHeroTrangDau,
};
