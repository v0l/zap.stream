import { TaggedNostrEvent } from "@snort/system";
import { Profile, getName } from "../profile";
import { Text } from "@/element/text";
import { useUserProfile } from "@snort/system-react";
import EventReactions from "../event-reactions";
import { RelativeTime } from "../relative-time";
import { Link } from "react-router-dom";
import { profileLink } from "@/utils";

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
          <div>
            <Link to={profileLink(profile, ev.pubkey)} className="hover:underline">
              {getName(ev.pubkey, profile)}
            </Link>
          </div>
          <div className="text-neutral-500 text-sm">
            <RelativeTime from={ev.created_at * 1000} />
          </div>
        </div>
        <Text content={ev.content} tags={ev.tags} />
        <EventReactions ev={ev} />
      </div>
    </div>
  );
}
