import { Icon } from "element/icon";
import "./layout.css";
import { Outlet, useNavigate } from "react-router-dom";

export function LayoutPage() {
    const navigate = useNavigate();
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
                <button type="button" className="btn btn-border">
                    Login
                    <Icon name="login" />
                </button>
            </div>
        </header>
        <Outlet />
    </>
}