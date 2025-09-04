interface Env {}

interface NostrJson {
  names: Record<string, string>;
  relays?: Record<string, Array<string>>;
  nip46?: Record<string, Array<string>>;
}

async function fetchNip05Pubkey(name: string, timeout = 2_000): Promise<string | undefined> {
  if (!name) {
    return undefined;
  }
  try {
    const res = await fetch(`https://api.snort.social/.well-known/nostr.json?name=${encodeURIComponent(name)}`, {
      headers: {
        "X-Proxy-Host": "zap.stream",
      },
    });
    const data: NostrJson = await res.json();
    const match = Object.keys(data.names).find(n => {
      return n.toLowerCase() === name.toLowerCase();
    });
    return match ? data.names[match] : undefined;
  } catch {
    // ignored
  }
  return undefined;
}

export const onRequest: PagesFunction<Env> = async context => {
  const handle = context.params.handle as string | undefined;
  let pubkey = handle;
  if (handle && handle.length !== 64) {
    const nip5 = await fetchNip05Pubkey(handle);
    if (nip5) {
      pubkey = nip5;
    }
  }

  const response = await fetch(`https://api-core.zap.stream/.well-known/lnurlp/${pubkey}`);
  const results = await response.text();
  const responseHeaders = Object.fromEntries(response.headers.entries());
  return new Response(results, {
    headers: {
      ...responseHeaders,
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    },
  });
};
