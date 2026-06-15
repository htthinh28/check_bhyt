import { Platform } from 'react-native';

export const propsThanhCuonDocBenPhai = {
  showsVerticalScrollIndicator: true,
  ...(Platform.OS === 'android' ? { persistentScrollbar: true } : {}),
};

export const styleThanhCuonDocBenPhai = Platform.select({
  web: {
    scrollbarWidth: 'thin',
    scrollbarColor: '#C2185B rgba(15, 23, 42, 0.16)',
  },
  default: {},
});

export const contentThanhCuonDocBenPhai = Platform.select({
  web: {
    paddingRight: 10,
  },
  default: {},
});
