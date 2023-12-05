import { useLocation } from "react-router-dom";

import { useStreamLink } from "@/hooks/stream-link";
import { getEventFromLocationState } from "@/utils";
import { lazy } from "react";
const StreamSummary = lazy(() => import("@/element/summary-chart"));

export function StreamSummaryPage() {
  const location = useLocation();
  const evPreload = getEventFromLocationState(location.state);
  const link = useStreamLink();
  if (link) {
    return <StreamSummary link={link} preload={evPreload} />;
  }
}
