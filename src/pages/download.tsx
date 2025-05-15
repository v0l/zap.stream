import { FormattedMessage } from "react-intl";

import PlayStore from "../images/GetItOnGooglePlay_Badge_Web_color_English.png";
import AppStore from "../images/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg";
import Obtanium from "../images/badge_obtainium.png";
import QrCode from "@/element/qr-code";

export function DownloadAppPage() {
    const obtaniumLink = "https://github.com/nostrlabs-io/zap-stream-flutter"
    const playStoreLink = "https://play.google.com/store/apps/details?id=io.nostrlabs.zap_stream_flutter";
    const appStoreLink = "https://testflight.apple.com/join/5Qh7mfvU";

    return <div className="mx-6 flex flex-col gap-4 w-full ">
        <h2>
            <FormattedMessage defaultMessage="Download the zap.stream app" />
        </h2>

        <div className="flex items-center max-md:flex-col md:w-full md:justify-evenly">
            <div className="flex items-center flex-col gap-2">
                <QrCode data={playStoreLink} link={playStoreLink} />
                <a href={playStoreLink} target="_blank">
                    <img src={PlayStore} width={120} />
                </a>
            </div>
            <div className="flex items-center flex-col gap-2">
                <QrCode data={appStoreLink} link={appStoreLink} />
                <a href={appStoreLink} target="_blank">
                    <img src={AppStore} width={120} />
                </a>
            </div>
            <div className="flex items-center flex-col gap-2">
                <QrCode data={obtaniumLink} link={obtaniumLink} />
                <a href={obtaniumLink} target="_blank">
                    <img src={Obtanium} width={120} />
                </a>
            </div>
        </div>
    </div>
}