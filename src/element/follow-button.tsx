import { EventKind } from "@snort/system";
import { useLogin } from "hooks/login";
import AsyncButton from "element/async-button";
import { System } from "index";

export function LoggedInFollowButton({
  pubkey,
}: {
  pubkey: string;
}) {
  const login = useLogin();
  const tags = login?.follows.tags ?? []
  const relays = login?.relays
  const follows = tags.filter((t) => t.at(0) === "p");
  const isFollowing = follows.find((t) => t.at(1) === pubkey);

  async function unfollow() {
    const pub = login?.publisher();
    if (pub) {
      const ev = await pub.generic((eb) => {
        eb.kind(EventKind.ContactList).content(JSON.stringify(relays));
        for (const t of tags) {
          const isFollow = t.at(0) === "p" && t.at(1) === pubkey;
          if (!isFollow) {
            eb.tag(t);
          }
        }
        return eb;
      });
      console.debug(ev);
      System.BroadcastEvent(ev);
    }
  }

  async function follow() {
    const pub = login?.publisher();
    if (pub) {
      const ev = await pub.generic((eb) => {
        eb.kind(EventKind.ContactList).content(JSON.stringify(relays));
        for (const tag of tags) {
          eb.tag(tag);
        }
        eb.tag(["p", pubkey]);
        return eb;
      });
      console.debug(ev);
      System.BroadcastEvent(ev);
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
