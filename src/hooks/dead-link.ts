import { OLD_SHORTS_KIND, OLD_VIDEO_KIND, SHORTS_KIND, VIDEO_KIND } from "@/const";
import { MediaPayload, VideoInfo } from "@/service/video/info";
import { findTag } from "@/utils";
import { NostrEvent, TaggedNostrEvent } from "@snort/system";
import { useEffect, useState } from "react";

const saveDeadLink = (link: string, val: boolean) => localStorage.setItem(`dead-link:${link}`, String(val));
const getDeadLink = (link: string) => localStorage.getItem(`dead-link:${link}`);

export function useDeadLink(ev: TaggedNostrEvent | NostrEvent) {
  const [alive, setAlive] = useState<MediaPayload>();

  async function testLink(link: string) {
    const u = new URL(link);
    link = u.toString(); // normalize link
    const existing = getDeadLink(link);
    if (existing === null) {
      // youtube links cant be played
      if (u.hostname.endsWith("youtube.com") || u.hostname.endsWith("youtu.be")) {
        saveDeadLink(link, false);
        return false;
      }
      const req = await fetch(link, {
        method: "HEAD",
      });
      saveDeadLink(link, req.ok);
      return req.ok;
    } else {
      return existing === "true";
    }
  }

  async function testPayload(pl: MediaPayload) {
    const alive = await testLink(pl.url);
    if (pl.url && alive) {
      return pl;
    }
    for (const alt of pl.alternatives) {
      const alive = await testLink(alt);
      if (alt && alive) {
        return {
          ...pl,
          url: alt,
        };
      }
    }
  }

  async function getLiveLink(links: Array<MediaPayload>) {
    for (const l of links) {
      const live = await testPayload(l);
      if (live) {
        setAlive(live);
        break;
      }
    }
  }

  useEffect(() => {
    const links =
      ev.kind === VIDEO_KIND || ev.kind === SHORTS_KIND || ev.kind == OLD_SHORTS_KIND || ev.kind == OLD_VIDEO_KIND
        ? VideoInfo.parse(ev)?.sources()
        : [
            {
              url: findTag(ev, "streaming") ?? findTag(ev, "recording"),
              alternatives: [],
            } as MediaPayload,
          ];

    getLiveLink(links).catch(console.error);
  }, [ev]);

  return alive;
}
