/**
 * Expo config — production builds disable cleartext HTTP.
 * Debug/dev keeps cleartext for LAN API.
 */
const appJson = require('./app.json');

const profile = process.env.EAS_BUILD_PROFILE || '';
const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
const apiIsHttp = /^http:\/\//i.test(apiUrl);

/** LAN (http://192...) APK uchun cleartext; Render (https) uchun o‘chiq */
const allowCleartext =
  profile === 'development' ||
  (profile === 'preview' && apiIsHttp) ||
  (!profile && process.env.NODE_ENV !== 'production');

module.exports = {
  ...appJson.expo,
  android: {
    ...appJson.expo.android,
    usesCleartextTraffic: allowCleartext,
  },
  extra: {
    ...appJson.expo.extra,
    usesCleartextTrafficRelease: false,
    apiUrl: process.env.EXPO_PUBLIC_API_URL || null,
  },
};
