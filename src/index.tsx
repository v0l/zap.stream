import "@szhsin/react-menu/dist/index.css";
import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { NostrSystem } from "@snort/system";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { RootPage } from "pages/root";
import { TagPage } from "pages/tag";
import { LayoutPage } from "pages/layout";
import { ProfilePage } from "pages/profile-page";
import { StreamPage } from "pages/stream-page";
import { ChatPopout } from "pages/chat-popout";
import { LoginStore } from "login";
import { StreamProvidersPage } from "pages/providers";
import { defaultRelays } from "const";
import { CatchAllRoutePage } from "pages/catch-all";

export enum StreamState {
  Live = "live",
  Ended = "ended",
  Planned = "planned",
}

export const System = new NostrSystem({});
export const Login = new LoginStore();

Object.entries(defaultRelays).forEach((params) => {
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
        element: <StreamPage />,
      },
      {
        path: "/providers/:id?",
        element: <StreamProvidersPage />,
      },
      {
        path: "*",
        element: <CatchAllRoutePage />
      }
    ],
  },
  {
    path: "/chat/:id",
    element: <ChatPopout />,
  },
]);
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLDivElement
);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
