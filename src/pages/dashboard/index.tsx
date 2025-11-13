import { useLogin } from "@/hooks/login";
import { NostrPrefix } from "@snort/shared";
import { NostrLink, parseNostrLink } from "@snort/system";
import { Suspense, lazy } from "react";
import { useParams } from "react-router-dom";

const DashboardForLink = lazy(() => import("./dashboard"));

export default function DashboardPage() {
  const login = useLogin();
  const { id } = useParams();
  if (!login) return;
  const link = id ? parseNostrLink(id) : new NostrLink(NostrPrefix.PublicKey, login.pubkey);

  return (
    <Suspense>
      <DashboardForLink link={link} />
    </Suspense>
  );
}
