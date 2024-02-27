import "@szhsin/react-menu/dist/index.css";
import "./index.css";
import "./fonts/outfit/outfit.css";

import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { NostrSystem } from "@snort/system";
import { SnortContext } from "@snort/system-react";
import { SnortSystemDb } from "@snort/system-web";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { unixNowMs } from "@snort/shared";

import { RootPage } from "@/pages/root";
import { TagPage } from "@/pages/tag";
import { LayoutPage } from "@/pages/layout";
import { ProfilePage } from "@/pages/profile-page";
import { StreamPageHandler } from "@/pages/stream-page";
import { ChatPopout } from "@/pages/chat-popout";
import { LoginStore } from "@/login";
import { StreamProvidersPage } from "@/pages/providers";
import { defaultRelays } from "@/const";
import { CatchAllRoutePage } from "@/pages/catch-all";
import { SettingsPage } from "@/pages/settings-page";
import { register } from "@/serviceWorker";
import { IntlProvider } from "@/intl";
import { WidgetsPage } from "@/pages/widgets";
import { AlertsPage } from "@/pages/alerts";
import { StreamSummaryPage } from "@/pages/summary";
import { EmbededPage } from "./pages/embed";
import Markdown from "./element/markdown";
import { Async } from "./element/async-loader";
import { WasmOptimizer, WasmPath, wasmInit } from "./wasm";
const DashboardPage = lazy(() => import("./pages/dashboard"));

import Faq from "@/faq.md";
import MockPage from "./pages/mock";

const hasWasm = "WebAssembly" in globalThis;
const db = new SnortSystemDb();
const System = new NostrSystem({
  db,
  optimizer: hasWasm ? WasmOptimizer : undefined,
  automaticOutboxModel: false,
});
export const Login = new LoginStore();

register();

Object.entries(defaultRelays).forEach(params => {
  const [relay, settings] = params;
  System.ConnectToRelay(relay, settings);
});

export let TimeSync = 0;
async function doInit() {
  if (hasWasm) {
    await wasmInit(WasmPath);
  }
  db.ready = await db.isAvailable();
  await System.Init();
  try {
    const req = await fetch("https://api.zap.stream/api/time", {
      signal: AbortSignal.timeout(1000),
    });
    const nowAtServer = (await req.json()).time as number;
    const now = unixNowMs();
    TimeSync = now - nowAtServer;
    console.debug("Time clock sync", TimeSync);
  } catch {
    // ignore
  }
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
