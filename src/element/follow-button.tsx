import { EventKind } from "@snort/system";
import { FormattedMessage } from "react-intl";
import { useContext } from "react";
import { SnortContext } from "@snort/system-react";

import { useLogin } from "@/hooks/login";
import { Login } from "@/login";
import { DefaultButton } from "./buttons";

export function LoggedInFollowButton({
  tag,
  value,
  hideWhenFollowing,
}: {
  tag: "p" | "t";
  value: string;
  hideWhenFollowing?: boolean;
}) {
  const system = useContext(SnortContext);
  const login = useLogin();
  if (!login) return;

  const { tags, content, timestamp } = login.follows;
  const follows = tags.filter(t => t.at(0) === tag);
  const isFollowing = follows.find(t => t.at(1) === value);

  async function unfollow() {
    const pub = login?.publisher();
    if (pub) {
      const newFollows = tags.filter(t => t.at(1) !== value);
      const ev = await pub.generic(eb => {
        eb.kind(EventKind.ContactList).content(content ?? "");
        for (const t of newFollows) {
          eb.tag(t);
        }
        return eb;
      });
      console.debug(ev);
      await system.BroadcastEvent(ev);
      Login.setFollows(newFollows, content ?? "", ev.created_at);
    }
  }

  async function follow() {
    const pub = login?.publisher();
    if (pub) {
      const newFollows = [...tags, [tag, value]];
      const ev = await pub.generic(eb => {
        eb.kind(EventKind.ContactList).content(content ?? "");
        for (const tag of newFollows) {
          eb.tag(tag);
        }
        return eb;
      });
      console.debug(ev);
      await system.BroadcastEvent(ev);
      Login.setFollows(newFollows, content ?? "", ev.created_at);
    }
  }

  if (isFollowing && hideWhenFollowing) return;
  return (
    <DefaultButton disabled={timestamp ? timestamp === 0 : true} onClick={isFollowing ? unfollow : follow}>
      {isFollowing ? (
        <FormattedMessage defaultMessage="Unfollow" id="izWS4J" />
      ) : (
        <FormattedMessage defaultMessage="Follow" id="ieGrWo" />
      )}
    </DefaultButton>
  );
}

export function FollowTagButton({ tag, hideWhenFollowing }: { tag: string; hideWhenFollowing?: boolean }) {
  const login = useLogin();
  return login?.pubkey ? <LoggedInFollowButton tag={"t"} value={tag} hideWhenFollowing={hideWhenFollowing} /> : null;
}

export function FollowButton({ pubkey, hideWhenFollowing }: { pubkey: string; hideWhenFollowing?: boolean }) {
  const login = useLogin();
  return login?.pubkey ? <LoggedInFollowButton tag={"p"} value={pubkey} hideWhenFollowing={hideWhenFollowing} /> : null;
}
