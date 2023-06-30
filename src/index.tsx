import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { NostrSystem } from "@snort/system";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { RootPage } from "./pages/root";
import { LayoutPage } from "pages/layout";
import { StreamPage } from "pages/stream-page";
import { ChatPopout } from "pages/chat-popout";
import { LoginStore } from "login";

export enum StreamState {
  Live = "live",
  Ended = "ended",
  Planned = "planned"
}

export const System = new NostrSystem({});
export const Login = new LoginStore();

export const Relays = [
  "wss://relay.snort.social",
  "wss://nos.lol",
  "wss://relay.damus.io",
  "wss://nostr.wine",
];

Relays.forEach((r) => System.ConnectToRelay(r, { read: true, write: true }));

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
        path: "/live/:id",
        element: <StreamPage />,
      },
      {
        path: "/:id",
        element: <StreamPage />,
      },
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
