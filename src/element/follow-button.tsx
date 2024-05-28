import { NostrHashtagLink, NostrLink, NostrPrefix } from "@snort/system";
import { FormattedMessage } from "react-intl";

import { useLogin } from "@/hooks/login";
import { DefaultButton } from "./buttons";
import { Icon } from "./icon";

export function LoggedInFollowButton({ link, hideWhenFollowing }: { link: NostrLink; hideWhenFollowing?: boolean }) {
  const login = useLogin();
  if (!login?.state) return;

  const follows = login.state.follows ?? [];
  const isFollowing = follows.includes(link.id);

  async function unfollow() {
    await login?.state?.unfollow(link, true);
  }

  async function follow() {
    await login?.state?.follow(link, true);
  }

  if (isFollowing && hideWhenFollowing) return;
  return (
    <DefaultButton onClick={isFollowing ? unfollow : follow}>
      {isFollowing ? (
        <FormattedMessage defaultMessage="Unfollow" />
      ) : (
        <>
          <Icon name="plus" size={20} />
          <FormattedMessage defaultMessage="Follow" />
        </>
      )}
    </DefaultButton>
  );
}

export function FollowTagButton({ tag, hideWhenFollowing }: { tag: string; hideWhenFollowing?: boolean }) {
  //const login = useLogin();
  //const link = new NostrHashtagLink(tag);
  return;
  //return login?.pubkey ? <LoggedInFollowButton link={link} hideWhenFollowing={hideWhenFollowing} /> : null;
}

export function FollowButton({ pubkey, hideWhenFollowing }: { pubkey: string; hideWhenFollowing?: boolean }) {
  const login = useLogin();
  const link = new NostrLink(NostrPrefix.PublicKey, pubkey);
  return login?.pubkey ? <LoggedInFollowButton link={link} hideWhenFollowing={hideWhenFollowing} /> : null;
}
