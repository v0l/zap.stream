import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"
import tailwindcss from "@tailwindcss/vite"
import { type Plugin, defineConfig } from "vite"
//import { visualizer } from "rollup-plugin-visualizer";
import { vitePluginVersionMark } from "vite-plugin-version-mark"
import formatjs from "@formatjs/unplugin/vite"
import { fileURLToPath } from "node:url"

const alertShell: Plugin = {
  name: "alert-shell",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url?.startsWith("/alert/")) req.url = "/alert.html"
      next()
    })
  },
}

export default defineConfig({
  plugins: [
    alertShell,
    formatjs({
      idInterpolationPattern: "[sha512:contenthash:base64:6]",
      ast: true,
    }),
    tailwindcss(),
    react(),
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
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        alert: fileURLToPath(new URL("./alert.html", import.meta.url)),
      },
    },
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
  optimizeDeps: {
    exclude: ["@moq/watch"],
  },
})
