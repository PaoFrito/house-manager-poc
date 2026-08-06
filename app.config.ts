import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'House Manager',
  slug: 'house-manager-poc',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0f1117',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.housemanager.poc',
    infoPlist: {
      NSFaceIDUsageDescription: 'Use Face ID to securely unlock the app.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0f1117',
    },
    package: 'com.housemanager.poc',
    permissions: [
      'USE_BIOMETRIC',
      'USE_FINGERPRINT',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
    ],
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    'expo-local-authentication',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#6c63ff',
        defaultChannel: 'default',
      },
    ],
  ],
  scheme: 'housemanager',
  extra: {
    eas: {
      projectId: 'YOUR_EAS_PROJECT_ID',
    },
  },
});
