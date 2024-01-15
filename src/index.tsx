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
const DashboardPage = lazy(() => import("./pages/dashboard"));

const db = new SnortSystemDb();
const System = new NostrSystem({
  db,
  checkSigs: false,
});
export const Login = new LoginStore();

register();

Object.entries(defaultRelays).forEach(params => {
  const [relay, settings] = params;
  System.ConnectToRelay(relay, settings);
});

export let TimeSync = 0;

const router = createBrowserRouter([
  {
    element: <LayoutPage />,
    loader: async () => {
      db.ready = await db.isAvailable();
      await System.Init();
      try {
        const req = await fetch("https://api.zap.stream/api/time");
        const nowAtServer = (await req.json()).time as number;
        const now = unixNowMs();
        TimeSync = now - nowAtServer;
        console.debug("Time clock sync", TimeSync);
      } catch {
        // ignore
      }
      return null;
    },
    children: [
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
        path: "*",
        element: <CatchAllRoutePage />,
      },
    ],
  },
  {
    path: "/chat/:id",
    element: <ChatPopout />,
    loader: async () => {
      db.ready = await db.isAvailable();
      await System.Init();
      return null;
    },
  },
  {
    path: "/alert/:id/:type",
    element: <AlertsPage />,
    loader: async () => {
      db.ready = await db.isAvailable();
      await System.Init();
      return null;
    },
  },
  {
    path: "/embed/:id",
    element: <EmbededPage />,
    loader: async () => {
      db.ready = await db.isAvailable();
      await System.Init();
      return null;
    },
  }
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
