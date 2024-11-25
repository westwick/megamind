import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { join } from 'path';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      sourcemap: 'inline',
      minify: false,
      outDir: join(__dirname, 'dist', 'main'),
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          entryFileNames: '[name].js',
          format: 'cjs',
        },
      },
      outDir: join(__dirname, 'dist', 'preload'),
    },
    define: {
      'process.env': {},
      __dirname: '""',
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        vue: 'vue/dist/vue.esm-bundler.js',
      },
    },
    optimizeDeps: {
      include: ['@xterm/xterm'],
    },
    plugins: [vue()],
    build: {
      outDir: join(__dirname, 'dist', 'renderer'),
    },
  },
});
