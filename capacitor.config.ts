import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eventsea.dev',
  appName: 'eventsea',
  webDir: 'build',
  server: {
    // url: '10.25.202.84',
    url: 'http://127.0.0.1:5173',
    cleartext: true,
  },
};

export default config;
