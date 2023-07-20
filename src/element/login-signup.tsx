import "./login-signup.css";
import { CSSProperties, useState } from "react";
import { EventPublisher, UserMetadata } from "@snort/system";
import { schnorr } from "@noble/curves/secp256k1";
import { bytesToHex } from "@noble/curves/abstract/utils";

import AsyncButton from "./async-button";
import { Login, System } from "index";
import { Icon } from "./icon";
import Copy from "./copy";
import { hexToBech32, openFile } from "utils";
import { VoidApi } from "@void-cat/api";
import { upload } from "@testing-library/user-event/dist/upload";
import { LoginType } from "login";

enum Stage {
    Login = 0,
    Details = 1,
    SaveKey = 2
}

export function LoginSignup({ close }: { close: () => void }) {
    const [error, setError] = useState("");
    const [stage, setStage] = useState(Stage.Login);
    const [username, setUsername] = useState("");
    const [avatar, setAvatar] = useState("");
    const [key, setNewKey] = useState("");

    async function doLogin() {
        try {
            const pub = await EventPublisher.nip7();
            if (pub) {
                Login.loginWithPubkey(pub.pubKey, LoginType.Nip7);
            }
        } catch (e) {
            console.error(e);
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError(e as string);
            }
        }
    }

    function createAccount() {
        const newKey = bytesToHex(schnorr.utils.randomPrivateKey());
        setNewKey(newKey);
        setStage(Stage.Details);
    }

    function loginWithKey() {
        Login.loginWithPrivateKey(key);
        close();
    }

    async function uploadAvatar() {
        const file = await openFile();
        if (file) {
            const VoidCatHost = "https://void.cat"
            const api = new VoidApi(VoidCatHost);
            const uploader = api.getUploader(file);
            const result = await uploader.upload({
                "V-Strip-Metadata": "true"
            })
            if (result.ok) {
                const resultUrl = result.file?.metadata?.url ?? `${VoidCatHost}/d/${result.file?.id}`;
                setAvatar(resultUrl);
            } else {
                setError(result.errorMessage ?? "Upload failed");
            }
        }
    }

    async function saveProfile() {
        const profile = {
            name: username,
            picture: avatar
        } as UserMetadata;

        const pub = EventPublisher.privateKey(key);
        const ev = await pub.metadata(profile);
        console.debug(ev);
        System.BroadcastEvent(ev);

        setStage(Stage.SaveKey);
    }

    switch (stage) {
        case Stage.Login: {
            return <>
                <h2>Login</h2>
                {"nostr" in window &&
                    <AsyncButton type="button" className="btn btn-primary" onClick={doLogin}>
                        Nostr Extension
                    </AsyncButton>}
                <button type="button" className="btn btn-primary" onClick={createAccount}>
                    Create Account
                </button>
                {error && <b className="error">{error}</b>}
            </>
        }
        case Stage.Details: {
            return <>
                <h2>Setup Profile</h2>
                <div className="flex f-center">
                    <div className="avatar-input" onClick={uploadAvatar} style={{
                        "--img": `url(${avatar})`
                    } as CSSProperties}>
                        <Icon name="camera-plus" />
                    </div>
                </div>
                <div>
                    <div className="paper">
                        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                    </div>
                    <small>You can change this later</small>
                </div>
                <AsyncButton type="button" className="btn btn-primary" onClick={saveProfile}>
                    Save
                </AsyncButton>
            </>
        }
        case Stage.SaveKey: {
            return <>
                <h2>Save Key</h2>
                <p>
                    Nostr uses private keys, please save yours, if you lose this key you wont be able to login to your account anymore!
                </p>
                <div className="paper">
                    <Copy text={hexToBech32("nsec", key)} />
                </div>
                <button type="button" className="btn btn-primary" onClick={loginWithKey}>
                    Ok, it's safe
                </button>
            </>
        }
    }
}