import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    'process.env': '{}',
    'process': 'undefined',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    lib: {
      entry: path.resolve(__dirname, 'src/main.tsx'),
      name: 'HeYiRecords',
      formats: ['umd'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        chunkFileNames: 'index.js',
        assetFileNames: 'index.[ext]',
      },
    },
  },
  publicDir: 'public',
})