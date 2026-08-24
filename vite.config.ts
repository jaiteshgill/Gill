import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig(({ command }) => ({
  // GitHub Pages serves this as a project site at /Gill/, so asset URLs
  // need that prefix in production; the dev server stays at the root.
  base: command === 'build' ? '/Gill/' : '/',
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}))
