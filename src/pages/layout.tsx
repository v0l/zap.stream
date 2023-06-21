import { Icon } from "element/icon";
import "./layout.css";
import { EventPublisher } from "@snort/system";
import { Outlet, useNavigate } from "react-router-dom";
import AsyncButton from "element/async-button";
import { Login } from "index";
import { useLogin } from "hooks/login";
import { Profile } from "element/profile";

export function LayoutPage() {
    const navigate = useNavigate();
    const login = useLogin();

    async function doLogin() {
        const pub = await EventPublisher.nip7();
        if (pub) {
            Login.loginWithPubkey(pub.pubKey);
        }
    }

    function loggedIn() {
        if (!login) return;

        return <>
            <button type="button" className="btn btn-primary">
                New Stream
                <Icon name="signal" />
            </button>
            <Profile pubkey={login.pubkey} options={{
                showName: false
            }} />
        </>
    }

    function loggedOut() {
        if (login) return;

        return <>
            <AsyncButton type="button" className="btn btn-border" onClick={doLogin}>
                Login
                <Icon name="login" />
            </AsyncButton>
        </>
    }

    return <>
        <header>
            <div onClick={() => navigate("/")}>
                S
            </div>
            <div>
                <input type="text" placeholder="Search" />
                <Icon name="search" size={15} />
            </div>
            <div>
                {loggedIn()}
                {loggedOut()}
            </div>
        </header>
        <Outlet />
    </>
}