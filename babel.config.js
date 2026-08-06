module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json', '.native.js'],
        alias: {
          '@': './src',
          '@db': './src/db',
          '@screens': './src/screens',
          '@components': './src/components',
          '@theme': './src/theme',
          '@services': './src/services',
          '@store': './src/store',
          '@i18n': './src/i18n',
          '@navigation': './src/navigation',
        },
      }],
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      'react-native-reanimated/plugin',
    ],
  };
};
