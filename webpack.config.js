// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/adapter/speechAdapter.ts',
  output: {
    filename: 'speech-plug.js',
    path: path.resolve(__dirname, 'dist'),    
    // Export as a proper module
    library: {
        type: 'module' 
    },
    globalObject: 'this', // Works in both browser and Node.js
    clean: true, // Clean the output directory before emit
  },
  experiments: {
    outputModule: true,
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
  resolve: {
    extensions: ['.ts', '.js'],
  },
  mode: 'development',
  devServer: {
    static: {
      directory: path.join(__dirname, '.'),
    },
    compress: true,
    port: 9000,
  }
};