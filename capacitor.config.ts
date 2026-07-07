import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl =
  process.env.CAPACITOR_SERVER_URL ||
  (process.env.CAPACITOR_DEV_SERVER === 'true' ? 'http://10.0.2.2:3000' : undefined);

const config: CapacitorConfig = {
  appId: 'com.lms.frontend',
  appName: 'LMS',
  webDir: 'out',
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith('http://'),
        },
      }
    : {}),
};

export default config;
