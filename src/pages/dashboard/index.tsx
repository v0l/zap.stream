import { useLogin } from "@/hooks/login";
import { NostrLink, NostrPrefix } from "@snort/system";
import { DashboardForLink } from "./dashboard";

export default function DashboardPage() {
  const login = useLogin();
  if (!login) return;

  return <DashboardForLink link={new NostrLink(NostrPrefix.PublicKey, login.pubkey)} />;
}
