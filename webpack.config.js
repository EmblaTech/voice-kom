require('dotenv').config();

const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const isFirstBuild = process.env.WEBPACK_FIRST_BUILD === 'true';


const createConfig = (target, outputFile, options = {}) => {
  const config = {
    mode: isProduction ? 'production' : 'development',
    entry: './src/index.ts',
    devtool: isProduction ? false : 'source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: outputFile,
      library: target === 'module' ? undefined : 'VoiceKom',
      libraryTarget: target,
      libraryExport: 'default',
      globalObject: 'this',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        // --- START: ADDED THIS RULE ---
        {
          // This rule will match any .html or .css file you import
          test: /\.(html|css)$/i,
          // 'asset/source' is a built-in Webpack 5 feature.
          // It exports the raw source code of the asset as a string.
          // This means no extra loaders are needed.
          type: 'asset/source',
        },
        // --- END: ADDED THIS RULE ---
      ],
    },
    optimization: {
      minimize: isProduction,
      minimizer: isProduction
        ? [
            new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: false,
                },
              },
            }),
          ]
        : [],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.VOICEKOM_API_BASE_URL': JSON.stringify(process.env.VOICEKOM_API_BASE_URL)
      })
    ],
    experiments: target === 'module' ? { outputModule: true } : {},
  };

  // Special plugin injection
  if (options.clean) {
    config.plugins.push(
      new CleanWebpackPlugin({
        cleanStaleWebpackAssets: false,
      })
    );
  }

  return config;
};

const configs = [];

if (isProduction) {
  // Minified production builds
  configs.push(createConfig('umd', 'voicekom.min.js', { clean: isFirstBuild }));
  configs.push(createConfig('commonjs2', 'voicekom.cjs.min.js'));
  configs.push(createConfig('module', 'voicekom.esm.min.js'));
} else {
  // Unminified development builds
  configs.push(createConfig('umd', 'voicekom.js', { clean: isFirstBuild }));
  configs.push(createConfig('commonjs2', 'voicekom.cjs.js'));
  configs.push(createConfig('module', 'voicekom.esm.js'));
}

module.exports = configs;