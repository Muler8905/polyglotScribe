// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            // React core
            "vendor-react": ["react", "react-dom"],
            // TanStack libraries
            "vendor-tanstack": [
              "@tanstack/react-router",
              "@tanstack/react-query",
              "@tanstack/react-start",
            ],
            // Radix UI components
            "vendor-radix": [
              "@radix-ui/react-accordion",
              "@radix-ui/react-alert-dialog",
              "@radix-ui/react-avatar",
              "@radix-ui/react-checkbox",
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-label",
              "@radix-ui/react-popover",
              "@radix-ui/react-select",
              "@radix-ui/react-separator",
              "@radix-ui/react-slot",
              "@radix-ui/react-switch",
              "@radix-ui/react-tabs",
              "@radix-ui/react-tooltip",
            ],
            // i18n
            "vendor-i18n": ["i18next", "react-i18next", "i18next-browser-languagedetector"],
            // Charts & animation
            "vendor-ui": ["recharts", "framer-motion", "embla-carousel-react"],
            // ElevenLabs
            "vendor-elevenlabs": ["@elevenlabs/react", "@elevenlabs/client"],
          },
        },
      },
    },
  },
});
