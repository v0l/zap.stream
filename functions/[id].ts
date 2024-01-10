interface Env {}

export const onRequest: PagesFunction<Env> = async context => {
  const id = context.params.id as string;

  const next = await context.next();
  try {
    const rsp = await fetch(`http://nostr.api.v0l.io/api/v1/opengraph/${id}?canonical=${encodeURIComponent("https://zap.stream/%s")}`, {
      method: "POST",
      body: await next.arrayBuffer(),
      headers: {
        "user-agent": "zap.stream/1.0 (https://zap.stream)",
        "content-type": "text/html",
        "accept": "text/html"
      },
    });
    if (rsp.ok) {
      const body = await rsp.text();
      if (body.length > 0) {
        return new Response(body, {
          headers: {
            "content-type": "text/html",
          },
        });
      }
    }
  } catch {
    // ignore
  }
  return next;
};
