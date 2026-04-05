export const Platform = {
  OS: 'node',
  select(options = {}) {
    if (Object.prototype.hasOwnProperty.call(options, 'default')) return options.default;
    if (Object.prototype.hasOwnProperty.call(options, 'native')) return options.native;
    if (Object.prototype.hasOwnProperty.call(options, 'android')) return options.android;
    if (Object.prototype.hasOwnProperty.call(options, 'ios')) return options.ios;
    if (Object.prototype.hasOwnProperty.call(options, 'web')) return options.web;
    return undefined;
  },
};

export const NativeModules = {};

export default { Platform, NativeModules };
