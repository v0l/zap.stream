import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import formatjs from "@formatjs/unplugin/vite"
import { fileURLToPath } from "node:url"

const nullPlayer = fileURLToPath(new URL("./src/ssr/null-player.tsx", import.meta.url))

export default defineConfig({
  plugins: [formatjs({ idInterpolationPattern: "[sha512:contenthash:base64:6]", ast: true }), react()],
  resolve: {
    alias: [
      { find: "react-dom/server", replacement: "react-dom/server.browser" },
      { find: /^@\/element\/video\/player$/, replacement: nullPlayer },
      { find: /^@\/element\/stream\/moq-player$/, replacement: nullPlayer },
      { find: /^@\/element\/stream\/live-video-player$/, replacement: nullPlayer },
      { find: "@", replacement: "/src" },
    ],
  },
  assetsInclude: ["**/*.md", "**/*.wasm"],
  define: { global: {}, __ZAP_STREAM_VERSION__: JSON.stringify("ssr"), "import.meta.env.DEV": "false" },
  ssr: { noExternal: true, target: "webworker" },
  build: {
    ssr: "src/ssr/entry-server.tsx",
    outDir: "build/ssr",
    emptyOutDir: true,
    minify: process.env.SSR_DEBUG !== "1",
    sourcemap: false,
    copyPublicDir: false,
    rollupOptions: { output: { format: "iife", name: "ZapSsr", inlineDynamicImports: true, entryFileNames: "render.js" } },
  },
})
