import "@szhsin/react-menu/dist/index.css";
import "./index.css";
import "./fonts/outfit/outfit.css";

import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { EventBuilder, NostrSystem } from "@snort/system";
import { SnortContext } from "@snort/system-react";
import { RouterProvider, createBrowserRouter } from "react-router";

import { RootPage } from "@/pages/root";
import { TagPage } from "@/pages/tag";
import { LayoutPage } from "@/pages/layout";
import { ProfilePage } from "@/pages/profile-page";
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
import { syncClock } from "./time-sync";
import SettingsPage from "./pages/settings";
import AccountSettingsTab from "./pages/settings/account";
import SearchPage from "./pages/search";
import ProfileSettings from "./pages/settings/profile";
import CategoryPage from "./pages/category";
import { WorkerRelayInterface } from "@snort/worker-relay";
import WorkerVite from "@snort/worker-relay/src/worker?worker";
import MarkdownPage from "./pages/md-page";
import DashboardIntroStep1 from "./pages/dashboard/intro/step1";
import DashboardIntroStep2 from "./pages/dashboard/intro/step2";
import DashboardIntroStep3 from "./pages/dashboard/intro/step3";
import DashboardIntroStep4 from "./pages/dashboard/intro/step4";
import DashboardIntroFinal from "./pages/dashboard/intro/final";
import { LayoutContextProvider } from "./pages/layout/context";
import { VideosPage } from "./pages/videos";
import { LinkHandler } from "./pages/link-handler";
import { UploadPage } from "./pages/upload";
import { DebugPage } from "./pages/debug";
import { ShortsPage } from "./pages/shorts";
import { DownloadAppPage } from "./pages/download";
import ProvidersPage from "./pages/providers";
import { TosPage } from "./pages/tos";
import { Login } from "./login";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import { FormattedMessage } from "react-intl";

const hasWasm = "WebAssembly" in globalThis;
const disableWasmForPaths = ["/chat", "/alert", "/embed"];
const useWorkerRelay = disableWasmForPaths.every(a => !window.location.pathname.startsWith(a)) && hasWasm;
const workerRelay = new WorkerRelayInterface(
  import.meta.env.DEV ? new URL("@snort/worker-relay/dist/esm/worker.mjs", import.meta.url) : new WorkerVite(),
);
console.debug(`WASM config: has=${hasWasm}, use_worker_relay=${useWorkerRelay}`);
EventBuilder.ClientTag = ["client", "zap.stream", __ZAP_STREAM_VERSION__];
export const System = new NostrSystem({
  optimizer: hasWasm ? WasmOptimizer : undefined, // use optimizer always when WASM is available
  cachingRelay: useWorkerRelay ? workerRelay : undefined,
  buildFollowGraph: true,
  disableSyncModule: true,
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
  if (useWorkerRelay) {
    try {
      await workerRelay.init({
        databasePath: "relay.db",
        insertBatchSize: 100,
      });
      await workerRelay.configureSearchIndex({
        1311: [],
        30311: ["title", "summary"],
      });
    } catch (e) {
      console.error(e);
    }
  }
  const login = Login.snapshot();
  const follows = login?.state?.follows;
  await System.Init(follows);
  syncClock();

  if (login?.pubkey) {
    System.config.socialGraphInstance.setRoot(login.pubkey);
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
        path: "/debug",
        element: <DebugPage />,
      },
      {
        path: "/app",
        element: <DownloadAppPage />,
      },
      {
        path: "/",
        element: <RootPage />,
      },
      {
        path: "/streams",
        element: <RootPage />,
      },
      {
        path: "/videos",
        element: <VideosPage />,
      },
      {
        path: "/shorts",
        element: <ShortsPage />,
      },
      {
        path: "/upload",
        element: <UploadPage />,
      },
      {
        path: "/t/:tag",
        element: <TagPage />,
      },
      {
        path: "/p/:id",
        element: <ProfilePage />,
      },
      {
        path: "/:id",
        element: <LinkHandler />,
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
        path: "/dashboard/:id?",
        element: (
          <Suspense>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "/dashboard/step-1",
        element: <DashboardIntroStep1 />,
      },
      {
        path: "/dashboard/step-2",
        element: <DashboardIntroStep2 />,
      },
      {
        path: "/dashboard/step-3",
        element: <DashboardIntroStep3 />,
      },
      {
        path: "/dashboard/step-4",
        element: <DashboardIntroStep4 />,
      },
      {
        path: "/dashboard/final",
        element: <DashboardIntroFinal />,
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
        element: <MarkdownPage dTag="faq-en" title={<FormattedMessage defaultMessage="FAQ" description="Title: FAQ page" />} />,
      },
      {
        path: "/privacy-youtube-widget",
        element: <MarkdownPage dTag="pp-yt-widget" title={<FormattedMessage defaultMessage="Privacy Policy" description="Title: Privacy Policy" />} />,
      },
      {
        path: "/providers",
        element: <ProvidersPage />,
      },
      {
        path: "/tos",
        element: <TosPage />,
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
    <HelmetProvider>
      <SnortContext value={System}>
        <IntlProvider>
          <LayoutContextProvider>
            <RouterProvider router={router} />
          </LayoutContextProvider>
        </IntlProvider>
      </SnortContext>
    </HelmetProvider>
  </React.StrictMode>,
);
