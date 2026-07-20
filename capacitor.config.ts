import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.consumptiontracker',
  appName: '消耗品比价',
  webDir: 'dist',
  // SQLite plugin needs to be bundled as a Capacitor plugin on native;
  // on web it falls back to IndexedDB automatically.
  server: {
    androidScheme: 'https',
  },
};

export default config;
