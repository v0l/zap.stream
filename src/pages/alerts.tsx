import "./alerts.css";
import { useParams } from "react-router";

import Spinner from "@/element/spinner";
import { useStreamLink } from "@/hooks/stream-link";
import { ZapAlerts } from "./widgets/zaps";
import { Views } from "./widgets/views";
import { TopZappersWidget } from "./widgets/top-zappers";
import { Music } from "./widgets/music";

export function AlertsPage() {
  const params = useParams();
  const link = useStreamLink();

  if (!link) {
    return <Spinner />;
  }

  switch (params.type) {
    case "zaps": {
      return <ZapAlerts link={link} />;
    }
    case "views": {
      return <Views link={link} />;
    }
    case "top-zappers": {
      return <TopZappersWidget link={link} />;
    }
    case "music": {
      return <Music link={link} />;
    }
  }
  return null;
}
