import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'スケジュール記録ストップウォッチ',
        short_name: 'スケジ記録',
        description: '日中のスケジュールやタスクの所要時間を日本標準時（JST）で連続記録・可視化できるライフログアプリ',
        theme_color: '#1c1917', // 背景やテーマカラー（stone-900の色）
        background_color: '#fafaf9', // 起動時の背景色（stone-50の色）
        display: 'standalone', // アプリっぽくアドレスバーを隠す設定
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
});