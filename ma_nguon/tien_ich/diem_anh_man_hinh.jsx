import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** Chiều rộng tham chiếu (iPhone 12/13) để scale font/spacing vừa mắt trên tablet & điện thoại */
const BASE_WIDTH_REF = 390;

/**
 * Co giãn nhẹ theo độ phân giải — clamp để tránh chữ quá to/nhỏ.
 * Dùng cho chip/tab cần đọc lâu trên màn nhỏ.
 */
export function useScaleGiaoDien() {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const raw = width / BASE_WIDTH_REF;
    const scale = Math.min(Math.max(raw, 0.88), 1.14);
    const font = (px) => Math.max(11, Math.round(px * scale));
    const space = (px) => Math.max(4, Math.round(px * scale));
    return { width, height, scale, font, space };
  }, [width, height]);
}
