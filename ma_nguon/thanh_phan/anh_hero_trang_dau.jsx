import { Image, Platform, StyleSheet, View } from 'react-native';
import { layNguonAnhHeroTrangDau } from '../tien_ich/branding_ung_dung';

/**
 * Ảnh giao diện đầu — panel trái (web) hoặc banner (mobile).
 */
export const AnhHeroTrangDau = ({
  style,
  variant = 'panel',
  showOverlay = true,
}) => {
  const laPanel = variant === 'panel';
  const laFullscreen = variant === 'fullscreen';
  return (
    <View style={[
      laFullscreen ? styles.fullscreen : (laPanel ? styles.panel : styles.banner),
      style,
    ]}>
      <Image
        source={layNguonAnhHeroTrangDau()}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityLabel="CDSS Bảo hiểm y tế"
      />
      {showOverlay ? (
        <View style={[
          laFullscreen ? styles.overlayFullscreen : (laPanel ? styles.overlayPanel : styles.overlayBanner),
        ]} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  panel: {
    flex: 1,
    minHeight: 320,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      web: { minHeight: '100vh' },
    }),
  },
  banner: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  overlayFullscreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 15, 30, 0.42)',
  },
  overlayPanel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  overlayBanner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
});

export default AnhHeroTrangDau;
