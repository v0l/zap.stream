import { NostrLink } from "@snort/system";
import { FormattedMessage } from "react-intl";

import { useLogin } from "@/hooks/login";
import { DefaultButton } from "./buttons";
import { Icon } from "./icon";
import { NostrPrefix } from "@snort/shared";

export function LoggedInFollowButton({ link, hideWhenFollowing }: { link: NostrLink; hideWhenFollowing?: boolean }) {
  const login = useLogin();
  if (!login?.state) return;

  const follows = login.state.follows ?? [];
  const isFollowing = follows.includes(link.id);

  async function unfollow() {
    login?.state?.unfollow(link);
    await login?.state?.saveContacts();
  }

  async function follow() {
    login?.state?.follow(link);
    await login?.state?.saveContacts();
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

export function FollowButton({ pubkey, hideWhenFollowing }: { pubkey: string; hideWhenFollowing?: boolean }) {
  const login = useLogin();
  const link = new NostrLink(NostrPrefix.PublicKey, pubkey);
  return login?.pubkey ? <LoggedInFollowButton link={link} hideWhenFollowing={hideWhenFollowing} /> : null;
}
