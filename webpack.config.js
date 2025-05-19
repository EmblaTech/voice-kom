const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const isFirstBuild = process.env.WEBPACK_FIRST_BUILD === 'true';

const createConfig = (target, outputFile, options = {}) => {
  const config = {
    mode: isProduction ? 'production' : 'development',
    entry: './src/adapter/speechPlug.ts',
    devtool: isProduction ? false : 'source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: outputFile,
      library: target === 'module' ? undefined : 'SpeechPlug',
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
    plugins: [],
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
  configs.push(createConfig('umd', 'speechplug.min.js', { clean: isFirstBuild }));
  configs.push(createConfig('commonjs2', 'speechplug.cjs.min.js'));
  configs.push(createConfig('module', 'speechplug.esm.min.js'));
} else {
  // Unminified development builds
  configs.push(createConfig('umd', 'speechplug.js', { clean: isFirstBuild }));
  configs.push(createConfig('commonjs2', 'speechplug.cjs.js'));
  configs.push(createConfig('module', 'speechplug.esm.js'));
}

module.exports = configs;