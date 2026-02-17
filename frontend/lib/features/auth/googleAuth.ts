import Constants from 'expo-constants';

export type GoogleClientIds = {
  expoClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
  webClientId?: string;
};

const readEnvValue = (envKey: string): string | undefined => {
  const env = process.env as Record<string, string | undefined> | undefined;
  const value = env?.[envKey];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
};

const readExtraValue = (extraKey: string): string | undefined => {
  const extra = (Constants.expoConfig?.extra ?? Constants.manifest2?.extra ?? {}) as Record<string, unknown>;
  const value = extra?.[extraKey];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
};

const resolveValue = (envKey: string, extraKey: string) => readEnvValue(envKey) ?? readExtraValue(extraKey);

export const getGoogleClientIds = (): GoogleClientIds => {
  const ids = {
    expoClientId: resolveValue('EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID', 'googleExpoClientId'),
    iosClientId: resolveValue('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', 'googleIosClientId'),
    androidClientId: resolveValue('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', 'googleAndroidClientId'),
    webClientId: resolveValue('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'googleWebClientId'),
  };

  if (__DEV__) {
    console.log('[Google Auth] Client IDs loaded:', {
      expoClientId: ids.expoClientId ? '✓' : '✗',
      iosClientId: ids.iosClientId ? '✓' : '✗',
      androidClientId: ids.androidClientId ? '✓' : '✗',
      webClientId: ids.webClientId ? '✓' : '✗',
    });
  }

  return ids;
};

export const getGoogleClientIdIssue = (platform: string, ids: GoogleClientIds): string | null => {
  if (platform === 'web' && !ids.webClientId) {
    return 'Google Sign-In requires a Web client ID. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID or googleWebClientId in app.json.';
  }

  const hasExpoClientId = Boolean(ids.expoClientId);
  const hasIosClientId = Boolean(ids.iosClientId);
  const hasAndroidClientId = Boolean(ids.androidClientId);

  if (platform === 'ios' && !hasIosClientId && !hasExpoClientId) {
    return 'Provide EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID or googleIosClientId to enable Google Sign-In on iOS.';
  }

  if (platform === 'android' && !hasAndroidClientId && !hasExpoClientId) {
    return 'Provide EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID or googleAndroidClientId to enable Google Sign-In on Android.';
  }

  if (platform !== 'web' && !hasExpoClientId && !hasIosClientId && !hasAndroidClientId) {
    return 'Add at least one Google OAuth client ID (Expo, iOS, or Android) to enable Google Sign-In.';
  }

  return null;
};

export const buildGoogleAuthRequestConfig = (platform: string, ids: GoogleClientIds) => {
  const config: Record<string, unknown> = {
    scopes: ['profile', 'email'],
  };

  if (ids.expoClientId) config.expoClientId = ids.expoClientId;
  if (ids.iosClientId) config.iosClientId = ids.iosClientId;
  if (ids.androidClientId) config.androidClientId = ids.androidClientId;

  if (platform === 'web') {
    if (ids.webClientId) {
      config.webClientId = ids.webClientId;
      config.useProxy = true;
      const port = typeof window !== 'undefined' && window.location.port ? `:${window.location.port}` : '';
      const baseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}${port}` : 'http://localhost:8082';
      config.redirectUrl = `${baseUrl}/`;
    }
  } else if (ids.webClientId) {
    config.webClientId = ids.webClientId;
  }

  if (__DEV__) {
    console.log('[Google Auth] Config for platform', platform, ':', {
      webClientId: config.webClientId ? '✓' : '✗',
      redirectUrl: config.redirectUrl,
      scopes: config.scopes,
      useProxy: config.useProxy,
    });
  }

  return config;
};
