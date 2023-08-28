import "@szhsin/react-menu/dist/index.css";
import "./index.css";
import "./fonts/outfit/outfit.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { NostrSystem } from "@snort/system";
import { SnortContext } from "@snort/system-react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { RootPage } from "pages/root";
import { TagPage } from "pages/tag";
import { LayoutPage } from "pages/layout";
import { ProfilePage } from "pages/profile-page";
import { StreamPageHandler } from "pages/stream-page";
import { ChatPopout } from "pages/chat-popout";
import { LoginStore } from "login";
import { StreamProvidersPage } from "pages/providers";
import { defaultRelays } from "const";
import { CatchAllRoutePage } from "pages/catch-all";
import { register } from "serviceWorker";
import { IntlProvider } from "intl";
import { WidgetsPage } from "pages/widgets";
import { AlertsPage } from "pages/alerts";

export enum StreamState {
  Live = "live",
  Ended = "ended",
  Planned = "planned",
}

export const System = new NostrSystem({});
export const Login = new LoginStore();

register();

Object.entries(defaultRelays).forEach(params => {
  const [relay, settings] = params;
  System.ConnectToRelay(relay, settings);
});

const router = createBrowserRouter([
  {
    element: <LayoutPage />,
    loader: async () => {
      await System.Init();
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
        path: "/widgets",
        element: <WidgetsPage />
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
      await System.Init();
      return null;
    },
  },
  {
    path: "/alert/:id/:type",
    element: <AlertsPage />,
    loader: async () => {
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
