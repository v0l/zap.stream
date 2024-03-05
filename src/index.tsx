import "@szhsin/react-menu/dist/index.css";
import "./index.css";
import "./fonts/outfit/outfit.css";

import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { NostrSystem } from "@snort/system";
import { SnortContext } from "@snort/system-react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { RootPage } from "@/pages/root";
import { TagPage } from "@/pages/tag";
import { LayoutPage } from "@/pages/layout";
import { ProfilePage } from "@/pages/profile-page";
import { StreamPageHandler } from "@/pages/stream-page";
import { ChatPopout } from "@/pages/chat-popout";
import { defaultRelays } from "@/const";
import { CatchAllRoutePage } from "@/pages/catch-all";
import { IntlProvider } from "@/intl";
import { WidgetsPage } from "@/pages/widgets";
import { AlertsPage } from "@/pages/alerts";
import { StreamSummaryPage } from "@/pages/summary";
import { EmbededPage } from "./pages/embed";
import { WasmOptimizer, WasmPath, wasmInit } from "./wasm";
const DashboardPage = lazy(() => import("./pages/dashboard"));
import MockPage from "./pages/mock";
import { syncClock } from "./time-sync";
import SettingsPage from "./pages/settings";
import AccountSettingsTab from "./pages/settings/account";
import { StreamSettingsTab } from "./pages/settings/stream";
import SearchPage from "./pages/search";
import ProfileSettings from "./pages/settings/profile";
import CategoryPage from "./pages/category";
import { WorkerRelayInterface } from "@snort/worker-relay";
import WorkerVite from "@snort/worker-relay/src/worker?worker";
import FaqPage from "./pages/faq";

const hasWasm = "WebAssembly" in globalThis;
const workerRelay = new WorkerRelayInterface(
  import.meta.env.DEV ? new URL("@snort/worker-relay/dist/esm/worker.mjs", import.meta.url) : new WorkerVite()
);
const System = new NostrSystem({
  optimizer: hasWasm ? WasmOptimizer : undefined,
  automaticOutboxModel: false,
  cachingRelay: workerRelay,
});
System.on("event", (_, ev) => {
  workerRelay.event(ev);
});

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
    await workerRelay.init("relay.db");
  } catch (e) {
    console.error(e);
  }
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
          {
            path: "profile",
            element: <ProfileSettings />,
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
        path: "/search/:term?",
        element: <SearchPage />,
      },
      {
        path: "/category/:id?",
        element: <CategoryPage />,
      },
      {
        path: "/faq",
        element: <FaqPage />,
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
