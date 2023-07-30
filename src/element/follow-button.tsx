import { EventKind } from "@snort/system";
import { unixNow } from "@snort/shared";

import { useLogin } from "hooks/login";
import AsyncButton from "element/async-button";
import { Login, System } from "index";

export function LoggedInFollowButton({ pubkey }: { pubkey: string }) {
  const login = useLogin();
  const tags = login.follows.tags;
  const follows = tags.filter((t) => t.at(0) === "p");
  const isFollowing = follows.find((t) => t.at(1) === pubkey);

  async function unfollow() {
    const pub = login?.publisher();
    if (pub) {
      const newFollows = tags.filter((t) => t.at(1) !== pubkey);
      const ev = await pub.generic((eb) => {
        eb.kind(EventKind.ContactList).content(JSON.stringify(login.relays));
        for (const t of newFollows) {
          eb.tag(t);
        }
        return eb;
      });
      console.debug(ev);
      System.BroadcastEvent(ev);
      Login.setFollows(newFollows, unixNow());
    }
  }

  async function follow() {
    const pub = login?.publisher();
    if (pub) {
      const newFollows = [...tags, ["p", pubkey]];
      const ev = await pub.generic((eb) => {
        eb.kind(EventKind.ContactList).content(JSON.stringify(login.relays));
        for (const tag of newFollows) {
          eb.tag(tag);
        }
        return eb;
      });
      console.debug(ev);
      System.BroadcastEvent(ev);
      Login.setFollows(newFollows, unixNow());
    }
  }

  return (
    <AsyncButton
      disabled={login.follows.timestamp === 0}
      type="button"
      className="btn btn-primary"
      onClick={isFollowing ? unfollow : follow}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </AsyncButton>
  );
}

export function FollowButton({ pubkey }: { pubkey: string }) {
  const login = useLogin();
  return login?.pubkey ? (
    <LoggedInFollowButton loggedIn={login.pubkey} pubkey={pubkey} />
  ) : null;
}
