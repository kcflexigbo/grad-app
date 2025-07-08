import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Caching strategies
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
      },
      // Web App Manifest
      manifest: {
        name: 'RateMyPix',
        short_name: 'RateMyPix',
        description: 'RateMyPix - Share, rate, and discover photos with our community of photographers and enthusiasts',
        theme_color: '#ffffff', // A light theme color
        background_color: '#ffffff', // A light background color
        display: 'standalone',
        start_url: '.',
        icons: [
          {
            src: 'logo-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'logo-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // This helps your icon look good on all devices
          }
        ]
      }
    })
  ],
})