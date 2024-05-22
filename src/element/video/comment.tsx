import { TaggedNostrEvent } from "@snort/system";
import { Profile, getName } from "../profile";
import { Text } from "@/element/text";
import { useUserProfile } from "@snort/system-react";
import EventReactions from "../event-reactions";
import { RelativeTime } from "../relative-time";

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
      <div className="flex flex-col gap-1">
        <div className="font-medium flex gap-2 items-center">
          <div>{getName(ev.pubkey, profile)}</div>
          <div className="text-neutral-500 text-sm">
            <RelativeTime from={ev.created_at * 1000} />
          </div>
        </div>
        <Text content={ev.content} tags={ev.tags} />
        <EventReactions ev={ev} replyKind={1} />
      </div>
    </div>
  );
}
