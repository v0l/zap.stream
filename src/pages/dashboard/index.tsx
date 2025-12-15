import { StreamContextProvider } from "@/element/stream/stream-state";
import { useLogin } from "@/hooks/login";
import { NostrPrefix } from "@snort/shared";
import { NostrLink, parseNostrLink } from "@snort/system";
import { Suspense, lazy, useMemo } from "react";
import { useParams } from "react-router";
import { FormattedMessage } from "react-intl";

const DashboardForLink = lazy(() => import("./dashboard"));

export default function DashboardPage() {
  const login = useLogin();
  const { id } = useParams();

  const link = useMemo(
    () => (id ? parseNostrLink(id) : login?.pubkey ? new NostrLink(NostrPrefix.PublicKey, login.pubkey) : undefined),
    [id, login],
  );
  if (!link)
    return (
      <h2>
        <FormattedMessage defaultMessage="Please login first." />
      </h2>
    );

  return (
    <Suspense>
      <StreamContextProvider link={link}>
        <DashboardForLink />
      </StreamContextProvider>
    </Suspense>
  );
}
