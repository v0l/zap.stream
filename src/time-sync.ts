import { unixNowMs } from "@snort/shared";

export let TimeSync = 0;

export async function syncClock() {
  try {
    const req = await fetch("https://zapstream.pages.dev/api/time", {
      signal: AbortSignal.timeout(1000),
    });
    const nowAtServer = (await req.json()).time as number;
    const now = unixNowMs();
    TimeSync = nowAtServer - now;
    console.debug(`Time clock sync ${TimeSync}ms`);
  } catch {
    // ignore
  }
}
