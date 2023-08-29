import "./alerts.css";
import Spinner from "element/spinner";
import { useStreamLink } from "hooks/stream-link";
import { useParams } from "react-router-dom";
import { ZapAlerts } from "./widgets/zaps";
import { Views } from "./widgets/views";
import { TopZappersWidget } from "./widgets/top-zappers";

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
  }
  return null;
}
