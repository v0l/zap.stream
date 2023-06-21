import "./profile.css";
import { useUserProfile } from "@snort/system-react";
import { System } from "index";

export function Profile({ pubkey }: { pubkey: string }) {
    const profile = useUserProfile(System, pubkey);

    return <div className="profile">
        <img src={profile?.picture} />
        {profile?.display_name ?? profile?.name}
    </div>
}