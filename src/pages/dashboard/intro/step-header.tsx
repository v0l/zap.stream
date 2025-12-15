import { FormattedMessage } from "react-intl";
import { Link, useLocation } from "react-router";

export default function StepHeader() {
  const location = useLocation();
  const onStep = Number(location.pathname.split("/").slice(-1)[0].split("-")[1]);

  return (
    <div className="flex mb-[10vh] justify-between w-full max-lg:px-6">
      <Link to="/dashboard/step-1" className={onStep < 1 ? "opacity-20" : undefined}>
        <FormattedMessage defaultMessage="Info" />
      </Link>
      <Link to="/dashboard/step-2" className={onStep < 2 ? "opacity-20" : undefined}>
        <FormattedMessage defaultMessage="Category" />
      </Link>
      <Link to="/dashboard/step-3" className={onStep < 3 ? "opacity-20" : undefined}>
        <FormattedMessage defaultMessage="Forwarding" />
      </Link>
      <Link to="/dashboard/step-4" className={onStep < 4 ? "opacity-20" : undefined}>
        <FormattedMessage defaultMessage="Goal" />
      </Link>
    </div>
  );
}
