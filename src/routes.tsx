import { Suspense, lazy } from "react"
import { RootPage } from "@/pages/root"
import { TagPage } from "@/pages/tag"
import { LayoutPage } from "@/pages/layout"
import { ProfilePage } from "@/pages/profile-page"
import { ChatPopout } from "@/pages/chat-popout"
import { CatchAllRoutePage } from "@/pages/catch-all"
import { WidgetsPage } from "@/pages/widgets"
import { StreamSummaryPage } from "@/pages/summary"
import { EmbededPage } from "./pages/embed"
import SettingsPage from "./pages/settings"
import AccountSettingsTab from "./pages/settings/account"
import SearchPage from "./pages/search"
import ProfileSettings from "./pages/settings/profile"
import CategoryPage from "./pages/category"
import MarkdownPage from "./pages/md-page"
import DashboardIntroStep1 from "./pages/dashboard/intro/step1"
import DashboardIntroStep2 from "./pages/dashboard/intro/step2"
import DashboardIntroStep3 from "./pages/dashboard/intro/step3"
import DashboardIntroStep4 from "./pages/dashboard/intro/step4"
import DashboardIntroFinal from "./pages/dashboard/intro/final"
import { VideosPage } from "./pages/videos"
import { LinkHandler } from "./pages/link-handler"
import { UploadPage } from "./pages/upload"
import { DebugPage } from "./pages/debug"
import { ShortsPage } from "./pages/shorts"
import { DownloadAppPage } from "./pages/download"
import ProvidersPage from "./pages/providers"
import { TosPage } from "./pages/tos"
import { FormattedMessage } from "react-intl"
import type { RouteObject } from "react-router"
import { RouteError } from "./pages/route-error"

const DashboardPage = lazy(() => import("./pages/dashboard"))

export function makeRoutes(init: () => Promise<null>): RouteObject[] {
  return [
  {
    element: <LayoutPage />,
    // the layout's own loader throwing replaces everything; child route
    // errors get their own errorElement below so the nav/chrome survives
    errorElement: <RouteError />,
    loader: init,
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
        element: (
          <MarkdownPage dTag="faq-en" title={<FormattedMessage defaultMessage="FAQ" description="Title: FAQ page" />} />
        ),
      },
      {
        path: "/privacy-youtube-widget",
        element: (
          <MarkdownPage
            dTag="pp-yt-widget"
            title={<FormattedMessage defaultMessage="Privacy Policy" description="Title: Privacy Policy" />}
          />
        ),
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
    ].map((c: RouteObject) => ({ ...c, errorElement: c.errorElement ?? <RouteError /> })),
  },
  {
    path: "/chat/:id",
    element: <ChatPopout />,
    loader: init,
  },
  {
    path: "/embed/:id",
    element: <EmbededPage />,
    loader: init,
  },
]
}
