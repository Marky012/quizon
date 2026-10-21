import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/favicon.svg', 'assets/brand/*.svg', 'assets/brand/*.png', 'assets/fx/*.svg'],
      manifest: {
        name: 'QuizOn! - The Quezon Challenge',
        short_name: 'QuizOn!',
        description:
          'The offline-first game for Grade 5 learners in Barangay Quezon, Tagbina. Learn, earn your Woof helpers, and take on the challenge.',
        lang: 'en',
        theme_color: '#1A237E',
        background_color: '#FFFDF4',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['education', 'games', 'kids'],
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/assets/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // NO VIDEO. The reference app was 142 MB purely from lesson video and
        // that is the single biggest memory win available. Total budget here
        // is ~12 MB so a cheap Android phone precaches in seconds.
        //
        // THE PATTERNS MUST BE `**/*.ext`, NOT `ext`.
        //
        // These used to be bare extensions: ['js', 'css', 'html', ...]. Workbox
        // resolves a globPattern against globDirectory, so 'js' means "a file
        // literally named js" and matched nothing at all. The build only warned
        // about it; nothing failed. The result was a service worker whose entire
        // precache manifest was two files - a logo and the webmanifest - and no
        // JavaScript, no CSS and no HTML.
        //
        // That is worse than a cosmetic warning, because navigateFallback below
        // points at /index.html. With index.html absent from the precache, the
        // first offline navigation had nothing to serve, so "offline-first" was
        // the one claim this app could not actually keep.
        //
        // Code splitting makes this pattern matter more, not less: there are now
        // ~20 separate route chunks, and every one of them has to be precached
        // or a learner who loses connection on the Reading Trail gets a blank
        // screen for the screen they were trying to open.
        // JPEG AND WEBP MATTER, and their absence here was a real defect worth
        // naming. The app backdrop is a photograph, so it is JPEG rather than
        // SVG, and this list used to stop at png. A JPEG outside the precache is
        // worse than a missing one: the build says nothing, the app looks
        // correct on wifi, and the first learner to open QuizOn! on the school
        // wifi with no signal gets a flat cream page instead of the world.
        //
        // `maxEnt` is deliberately absent on globPatterns. Workbox precaches all
        // matches, and this app's whole offline promise depends on every route
        // chunk being in there, not on the newest few.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2,ico}'],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'quizon-documents',
              expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'quizon-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    // LAN-reachable so a real phone on the same wifi can load the dev build.
    host: true,
    port: 8080,
  },
  preview: { host: true, port: 8080 },

  /* ===========================================================================
     THE `@/` ALIAS. This has to be declared HERE, not just in tsconfig.json.

     tsconfig.json maps "@/*" to "./src/*" via `paths`, which is what makes
     `tsc --noEmit` and vitest happy. It does NOT make the dev server happy.
     Vite 8's build happens to resolve the alias through tsconfig, so
     `npm run build` succeeds and hides the gap; the dev server's
     vite:import-analysis plugin does not, and every aliased import dies with
     "Failed to resolve import @/components/ScreenFrame" before a single screen
     renders. A build that passes while the dev server cannot serve the app is
     the worst version of this bug, so the alias is stated explicitly instead
     of being inherited.

     Kept identical to the alias in vitest.config.ts on purpose. One alias, one
     spelling, two configs - if these ever drift, tests pass against paths the
     app cannot actually resolve.
     =========================================================================== */
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
