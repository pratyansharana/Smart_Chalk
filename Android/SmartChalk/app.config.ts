import { ExpoConfig, ConfigContext } from 'expo/config';
import { ConfigPlugin, withAppBuildGradle } from 'expo/config-plugins';

const withPdfPackagingOptions: ConfigPlugin = (config) => withAppBuildGradle(config, (modConfig) => {
  if (modConfig.modResults.language !== 'groovy') return modConfig;
  const marker = 'react-native-pdf-packaging-options';
  if (modConfig.modResults.contents.includes(marker)) return modConfig;

  modConfig.modResults.contents = modConfig.modResults.contents.replace(
    /android\s*\{/,
    (androidBlock) => `${androidBlock}\n    // ${marker}\n    packagingOptions {\n        pickFirst 'lib/x86/libc++_shared.so'\n        pickFirst 'lib/x86_64/libjsc.so'\n        pickFirst 'lib/arm64-v8a/libjsc.so'\n        pickFirst 'lib/arm64-v8a/libc++_shared.so'\n        pickFirst 'lib/x86_64/libc++_shared.so'\n        pickFirst 'lib/armeabi-v7a/libc++_shared.so'\n    }\n`,
  );
  return modConfig;
});

export default ({ config }: ConfigContext): ExpoConfig => {
  // Ensure the slug is a string or fallback to a default
  const cleanSlug = config.slug 
    ? config.slug.replace(/-/g, '').toLowerCase() 
    : 'template';

  const companyPrefix = 'com.yourname'; // CHANGE THIS TO YOUR ACTUAL DEV NAME/COMPANY

  // Notice the parentheses ( ) directly after return
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      [
        'expo-notifications',
        {
          color: '#2D66C8',
          defaultChannel: 'smartchalk-updates',
        },
      ],
      withPdfPackagingOptions as unknown as NonNullable<ExpoConfig['plugins']>[number],
    ],
    name: config.name || 'My Expo Template',
    slug: config.slug || 'expo-starter-template',
    ios: {
      ...config.ios,
      bundleIdentifier: `${companyPrefix}.${cleanSlug}`,
      googleServicesFile: './GoogleService-Info.plist',
    },
    android: {
      ...config.android,
      package: `${companyPrefix}.${cleanSlug}`,
      googleServicesFile: './google-services.json',
    },
  };
};