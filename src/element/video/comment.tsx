import { TaggedNostrEvent } from "@snort/system";
import { Profile, getName } from "../profile";
import { Text } from "@/element/text";
import { useUserProfile } from "@snort/system-react";
import EventReactions from "../event-reactions";

export default function VideoComment({ ev }: { ev: TaggedNostrEvent }) {
  const profile = useUserProfile(ev.pubkey);
  return (
    <div className="grid gap-4 grid-cols-[min-content_auto]">
      <Profile
        pubkey={ev.pubkey}
        profile={profile}
        avatarSize={40}
        options={{
          showName: false,
        }}
      />
      <div className="flex flex-col">
        <div className="text-medium">{getName(ev.pubkey, profile)}</div>
        <Text content={ev.content} tags={ev.tags} />
        <EventReactions ev={ev} />
      </div>
    </div>
  );
}
