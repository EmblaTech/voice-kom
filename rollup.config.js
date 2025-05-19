// rollup.config.js
const path = require('path');
const typescript = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const { babel } = require('@rollup/plugin-babel');
const cleanup = require('rollup-plugin-cleanup');

const packageJson = require('./package.json');

// Helper function to create build configurations
const createBuildConfig = (format, outputFile, isMinified = false) => {
  const extensions = ['.ts', '.js'];
  
  let plugins = [
    resolve({ extensions }),
    commonjs(),
    typescript({ 
      tsconfig: './tsconfig.json',
      declaration: false,
    }),
    babel({
      babelHelpers: 'bundled',
      extensions,
      exclude: 'node_modules/**'
    }),
    cleanup()
  ];
  
  if (isMinified) {
    plugins.push(terser({
      format: {
        comments: false
      },
      compress: {
        drop_console: false
      }
    }));
  }
  
  return {
    input: 'src/Adapter/speechAdapter.ts',
    output: {
      file: path.resolve(__dirname, 'dist', outputFile),
      format,
      name: format === 'umd' ? 'SpeechPlug' : undefined,
      exports: 'default',
      sourcemap: !isMinified,
      globals: {}
    },
    external: Object.keys(packageJson.dependencies || {}),
    plugins
  };
};

// Create all build configurations
module.exports = [
  // ESM builds
  createBuildConfig('es', 'speechplug.esm.js'),
  createBuildConfig('es', 'speechplug.esm.min.js', true),
  
  // CommonJS builds
  createBuildConfig('cjs', 'speechplug.cjs.js'),
  createBuildConfig('cjs', 'speechplug.cjs.min.js', true),
  
  // UMD builds
  createBuildConfig('umd', 'speechplug.js'),
  createBuildConfig('umd', 'speechplug.min.js', true)
];