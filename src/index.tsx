import "@szhsin/react-menu/dist/index.css"
import "./index.css"
import "./fonts/bricolage/bricolage.css"
import "./fonts/instrument/instrument.css"

import React from "react"
import ReactDOM from "react-dom/client"
import { hydrateRoot } from "react-dom/client"
import { EventBuilder, NostrSystem } from "@snort/system"
import { SnortContext } from "@snort/system-react"
import { createBrowserRouter } from "react-router"
import { RouterProvider } from "react-router/dom"

import { defaultRelays } from "@/const"
import { IntlProvider } from "@/intl"
import { WasmOptimizer, WasmPath, wasmInit } from "./wasm"
import { syncClock } from "./time-sync"
import { makeRoutes } from "./routes"
import { WorkerRelayInterface } from "@snort/worker-relay"
import WorkerVite from "@snort/worker-relay/src/worker?worker"
import { ErrorBoundary } from "./element/error-boundary"
import { LayoutContextProvider } from "./pages/layout/context"
import { Login } from "./login"
import { HelmetProvider } from "@dr.pogodin/react-helmet"
import { registerSW } from "virtual:pwa-register"
import { HydrationDone } from "./ssr/hydration-done"
import { finishHydration, loadHydration, seed, seedProfiles } from "./ssr/client"

// Register service worker with auto-update: reloads the page when a new
// version takes control so old app code never runs against a new precache.
// Also re-check for updates periodically for long-lived stream pages.
registerSW({
  immediate: true,
  onRegisteredSW: (_url, reg) => {
    if (reg) {
      setInterval(() => reg.update(), 60 * 60 * 1000)
    }
  },
})

const hasWasm = "WebAssembly" in globalThis
const disableWasmForPaths = ["/chat", "/embed"]
const useWorkerRelay = disableWasmForPaths.every(a => !window.location.pathname.startsWith(a)) && hasWasm
const workerRelay = new WorkerRelayInterface(
  import.meta.env.DEV ? new URL("@snort/worker-relay/dist/esm/worker.mjs", import.meta.url) : new WorkerVite(),
)
console.debug(`WASM config: has=${hasWasm}, use_worker_relay=${useWorkerRelay}`)
EventBuilder.ClientTag = ["client", "zap.stream", __ZAP_STREAM_VERSION__]
export const System = new NostrSystem({
  optimizer: hasWasm ? WasmOptimizer : undefined, // use optimizer always when WASM is available
  cachingRelay: useWorkerRelay ? workerRelay : undefined,
  buildFollowGraph: true,
  disableSyncModule: true,
})
const serverRendered = loadHydration()
const systemQuery = System.Query.bind(System)
System.Query = rb => {
  seed(rb)
  return systemQuery(rb)
}
if (serverRendered) {
  seedProfiles(profile => System.profileLoader.cache.set(profile))
}
Object.entries(defaultRelays).forEach(params => {
  const [relay, settings] = params
  System.ConnectToRelay(relay, settings)
})

let hasInit = false
async function doInit() {
  if (hasInit) return
  hasInit = true
  if (hasWasm) {
    await wasmInit(WasmPath)
  }
  if (useWorkerRelay) {
    try {
      await workerRelay.init({
        databasePath: "relay.db",
      })
      await workerRelay.configureSearchIndex({
        1311: [],
        30311: ["title", "summary"],
      })
    } catch (e) {
      console.error(e)
    }
  }
  const login = Login.snapshot()
  const follows = login?.state?.follows
  await System.Init(follows)
  syncClock()

  if (login?.pubkey) {
    System.config.socialGraphInstance.setRoot(login.pubkey)
  }
}

const routes = makeRoutes(async () => {
  await doInit()
  return null
})
const router = createBrowserRouter(routes, serverRendered ? { hydrationData: { loaderData: { "0": null }, errors: null } } : undefined)
if (serverRendered) {
  void doInit()
}
const root = document.getElementById("root") as HTMLDivElement
const tree = (
  <React.StrictMode>
    <HelmetProvider>
      <SnortContext value={System}>
        <IntlProvider>
          <LayoutContextProvider>
            <ErrorBoundary>
              <RouterProvider router={router} />
            </ErrorBoundary>
            <HydrationDone />
          </LayoutContextProvider>
        </IntlProvider>
      </SnortContext>
    </HelmetProvider>
  </React.StrictMode>
)
if (serverRendered && root.hasChildNodes()) {
  hydrateRoot(root, tree)
} else {
  finishHydration()
  ReactDOM.createRoot(root).render(tree)
}
