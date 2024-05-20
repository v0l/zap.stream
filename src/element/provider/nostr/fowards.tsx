import { DefaultButton } from "@/element/buttons";
import { NostrStreamProvider } from "@/providers";
import { unwrap } from "@snort/shared";
import { useState } from "react";
import { useIntl, FormattedMessage } from "react-intl";

enum ForwardService {
  Custom = "custom",
  Twitch = "twitch",
  Youtube = "youtube",
  Facebook = "facebook",
  Kick = "kick",
  Trovo = "trovo",
}

export function AddForwardInputs({
  provider,
  onAdd,
}: {
  provider: NostrStreamProvider;
  onAdd: (name: string, target: string) => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [svc, setService] = useState(ForwardService.Twitch);
  const [error, setError] = useState("");
  const { formatMessage } = useIntl();

  async function getTargetFull() {
    if (svc === ForwardService.Custom) {
      return target;
    }

    if (svc === ForwardService.Twitch) {
      const urls = (await (await fetch("https://ingest.twitch.tv/ingests")).json()) as {
        ingests: Array<{
          availability: number;
          name: string;
          url_template: string;
        }>;
      };

      const ingestsEurope = urls.ingests.filter(
        a => a.name.toLowerCase().startsWith("europe:") && a.availability === 1,
      );
      const random = ingestsEurope.at(ingestsEurope.length * Math.random());
      return unwrap(random).url_template.replace("{stream_key}", target);
    }

    if (svc === ForwardService.Youtube) {
      return `rtmp://a.rtmp.youtube.com:1935/live2/${target}`;
    }

    if (svc === ForwardService.Facebook) {
      return `rtmps://live-api-s.facebook.com:443/rtmp/${target}`;
    }

    if (svc === ForwardService.Trovo) {
      return `rtmp://livepush.trovo.live:1935/live/${target}`;
    }

    if (svc === ForwardService.Kick) {
      return `rtmps://fa723fc1b171.global-contribute.live-video.net:443/app/${target}`;
    }
  }

  async function doAdd() {
    if (svc === ForwardService.Custom) {
      if (!target.startsWith("rtmp://")) {
        setError(
          formatMessage({
            defaultMessage: "Stream url must start with rtmp://",
            id: "7+bCC1",
          }),
        );
        return;
      }
      try {
        // stupid URL parser doesnt work for non-http protocols
        const u = new URL(target.replace("rtmp://", "http://"));
        console.debug(u);
        if (u.host.length < 1) {
          throw new Error();
        }
        if (u.pathname === "/") {
          throw new Error();
        }
      } catch {
        setError(
          formatMessage({
            defaultMessage: "Not a valid URL",
            id: "1q4BO/",
          }),
        );
        return;
      }
    } else {
      if (target.length < 2) {
        setError(
          formatMessage({
            defaultMessage: "Stream Key is required",
            id: "50+/JW",
          }),
        );
        return;
      }
    }
    if (name.length < 2) {
      setError(
        formatMessage({
          defaultMessage: "Name is required",
          id: "Gvxoji",
        }),
      );
      return;
    }

    try {
      const t = await getTargetFull();
      if (!t)
        throw new Error(
          formatMessage({
            defaultMessage: "Could not create stream URL",
            id: "E9APoR",
          }),
        );
      await provider.addForward(name, t);
    } catch (e) {
      setError((e as Error).message);
    }
    setName("");
    setTarget("");
    onAdd(name, target);
  }

  return (
    <div className="flex flex-col p-4 gap-2 bg-layer-3 rounded-xl">
      <div className="flex gap-2">
        <select value={svc} onChange={e => setService(e.target.value as ForwardService)} className="flex-1">
          <option value="twitch">Twitch</option>
          <option value="youtube">Youtube</option>
          <option value="facebook">Facebook Gaming</option>
          <option value="kick">Kick</option>
          <option value="trovo">Trovo</option>
          <option value="custom">Custom</option>
        </select>
        <input
          type="text"
          className="flex-1"
          placeholder={formatMessage({ defaultMessage: "Display name", id: "dOQCL8" })}
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>
      <input
        type="password"
        placeholder={
          svc === ForwardService.Custom ? "rtmp://" : formatMessage({ defaultMessage: "Stream key", id: "QWlMq9" })
        }
        value={target}
        onChange={e => setTarget(e.target.value)}
      />
      <DefaultButton onClick={doAdd}>
        <FormattedMessage defaultMessage="Add" id="2/2yg+" />
      </DefaultButton>
      {error && <b className="warning">{error}</b>}
    </div>
  );
}
