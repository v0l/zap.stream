import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
//import { visualizer } from "rollup-plugin-visualizer";
import { vitePluginVersionMark } from "vite-plugin-version-mark";

export default defineConfig({
  plugins: [
    react({
      babel: {
        configFile: true,
      },
    }),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
        type: "module",
      },
    }),
    vitePluginVersionMark({
      name: "zap.stream",
      ifGitSHA: true,
      command: "git describe --always --tags",
      ifMeta: false,
    }),
    // visualizer({
    //   open: true,
    //   gzipSize: true,
    //   filename: "build/stats.html",
    // }),
  ],
  assetsInclude: ["**/*.md", "**/*.wasm"],
  build: {
    outDir: "build",
    sourcemap: true,
  },
  worker: {
    format: "es",
  },
  clearScreen: false,
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  define: {
    global: {},
  },
});
