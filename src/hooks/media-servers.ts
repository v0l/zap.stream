import { RequestBuilder } from "@snort/system";
import { useLogin } from "./login";
import { useRequestBuilder } from "@snort/system-react";
import { useMemo } from "react";

export function useMediaServerList() {
  const login = useLogin();

  const sub = useMemo(() => {
    if (!login?.pubkey) return;

    const rb = new RequestBuilder(`media-servers:${login.pubkey}`);
    rb.withFilter().kinds([10_096]).authors([login.pubkey]);
    return rb;
  }, [login?.pubkey]);

  return useRequestBuilder(sub);
}
