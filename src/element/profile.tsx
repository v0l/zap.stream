import "./profile.css";
import { useUserProfile } from "@snort/system-react";
import { UserMetadata } from "@snort/system";
import { hexToBech32 } from "@snort/shared";
import { System } from "index";

export interface ProfileOptions {
    showName?: boolean,
    suffix?: string
}

export function getName(pk: string, user?: UserMetadata) {
    const shortPubkey = hexToBech32("npub", pk).slice(0, 12);
    return user?.display_name ?? user?.name ?? shortPubkey
}

export function Profile({ pubkey, options }: { pubkey: string, options?: ProfileOptions }) {
    const profile = useUserProfile(System, pubkey);

    return <div className="profile">
        <img src={profile?.picture} />
        {(options?.showName ?? true) && getName(pubkey, profile)}
    </div>
}