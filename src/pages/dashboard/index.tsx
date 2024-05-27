import { useLogin } from "@/hooks/login";
import { NostrLink, NostrPrefix, parseNostrLink } from "@snort/system";
import { DashboardForLink } from "./dashboard";
import { useParams } from "react-router-dom";

export default function DashboardPage() {
  const login = useLogin();
  const { id } = useParams();
  if (!login) return;
  const link = id ? parseNostrLink(id) : new NostrLink(NostrPrefix.PublicKey, login.pubkey);

  return <DashboardForLink link={link} />;
}
