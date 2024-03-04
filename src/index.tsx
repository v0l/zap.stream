import "@szhsin/react-menu/dist/index.css";
import "./index.css";
import "./fonts/outfit/outfit.css";

import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { NostrSystem } from "@snort/system";
import { SnortContext } from "@snort/system-react";
import { SnortSystemDb } from "@snort/system-web";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { RootPage } from "@/pages/root";
import { TagPage } from "@/pages/tag";
import { LayoutPage } from "@/pages/layout";
import { ProfilePage } from "@/pages/profile-page";
import { StreamPageHandler } from "@/pages/stream-page";
import { ChatPopout } from "@/pages/chat-popout";
import { StreamProvidersPage } from "@/pages/providers";
import { defaultRelays } from "@/const";
import { CatchAllRoutePage } from "@/pages/catch-all";
import { IntlProvider } from "@/intl";
import { WidgetsPage } from "@/pages/widgets";
import { AlertsPage } from "@/pages/alerts";
import { StreamSummaryPage } from "@/pages/summary";
import { EmbededPage } from "./pages/embed";
import Markdown from "./element/markdown";
import { Async } from "./element/async-loader";
import { WasmOptimizer, WasmPath, wasmInit } from "./wasm";
const DashboardPage = lazy(() => import("./pages/dashboard"));
import MockPage from "./pages/mock";
import { syncClock } from "./time-sync";
import SettingsPage from "./pages/settings";
import AccountSettingsTab from "./pages/settings/account";
import { StreamSettingsTab } from "./pages/settings/stream";
import Faq from "@/faq.md";

import { WorkerRelayInterface } from "@snort/worker-relay";
import WorkerVite from "@snort/worker-relay/src/worker?worker"

const hasWasm = "WebAssembly" in globalThis;
const db = new SnortSystemDb();
const workerRelay = new WorkerRelayInterface(import.meta.env.DEV ?
  new URL("@snort/worker-relay/dist/esm/worker.mjs", import.meta.url) :
  new WorkerVite());
const System = new NostrSystem({
  db,
  optimizer: hasWasm ? WasmOptimizer : undefined,
  automaticOutboxModel: false,
  cachingRelay: workerRelay,
});
System.on("event", (_, ev) => {
  workerRelay.event(ev);
})

Object.entries(defaultRelays).forEach(params => {
  const [relay, settings] = params;
  System.ConnectToRelay(relay, settings);
});

let hasInit = false;
async function doInit() {
  if (hasInit) return;
  hasInit = true;
  if (hasWasm) {
    await wasmInit(WasmPath);
  }
  try {
    await workerRelay.debug("*");
    await workerRelay.init("relay.db");
    const stat = await workerRelay.summary();
    console.log(stat);
  } catch (e) {
    console.error(e);
  }
  db.ready = await db.isAvailable();
  await System.Init();
  syncClock();
}

const router = createBrowserRouter([
  {
    element: <LayoutPage />,
    loader: async () => {
      await doInit();
      return null;
    },
    children: [
      {
        path: "/mock",
        element: <MockPage />,
      },
      {
        path: "/",
        element: <RootPage />,
      },
      {
        path: "/t/:tag",
        element: <TagPage />,
      },
      {
        path: "/p/:npub",
        element: <ProfilePage />,
      },
      {
        path: "/:id",
        element: <StreamPageHandler />,
      },
      {
        path: "/providers/:id?",
        element: <StreamProvidersPage />,
      },
      {
        path: "/settings",
        element: <SettingsPage />,
        children: [
          {
            path: "",
            element: <AccountSettingsTab />,
          },
          {
            path: "stream",
            element: <StreamSettingsTab />,
          },
        ],
      },
      {
        path: "/widgets",
        element: <WidgetsPage />,
      },
      {
        path: "/summary/:id",
        element: <StreamSummaryPage />,
      },
      {
        path: "/dashboard",
        element: (
          <Suspense>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "/faq",
        element: (
          <Async
            loader={async () => {
              const req = await fetch(Faq);
              return await req.text();
            }}
            then={v => <Markdown content={v} tags={[]} plainText={true} />}
          />
        ),
      },
      {
        path: "*",
        element: <CatchAllRoutePage />,
      },
    ],
  },
  {
    path: "/chat/:id",
    element: <ChatPopout />,
    loader: async () => {
      await doInit();
      return null;
    },
  },
  {
    path: "/alert/:id/:type",
    element: <AlertsPage />,
    loader: async () => {
      await doInit();
      return null;
    },
  },
  {
    path: "/embed/:id",
    element: <EmbededPage />,
    loader: async () => {
      await doInit();
      return null;
    },
  },
]);
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLDivElement);
root.render(
  <React.StrictMode>
    <SnortContext.Provider value={System}>
      <IntlProvider>
        <RouterProvider router={router} />
      </IntlProvider>
    </SnortContext.Provider>
  </React.StrictMode>
);
