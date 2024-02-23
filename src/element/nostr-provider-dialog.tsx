import { NostrEvent } from "@snort/system";
import { useContext, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { SnortContext } from "@snort/system-react";

import { NostrStreamProvider, StreamProviderEndpoint, StreamProviderInfo } from "@/providers";
import { SendZaps } from "./send-zap";
import { StreamEditor, StreamEditorProps } from "./stream-editor";
import Spinner from "./spinner";
import AsyncButton from "./async-button";
import { unwrap } from "@snort/shared";
import { useRates } from "@/hooks/rates";

export function NostrProviderDialog({
  provider,
  showEndpoints,
  showEditor,
  showForwards,
  ...others
}: {
  provider: NostrStreamProvider;
  showEndpoints: boolean;
  showEditor: boolean;
  showForwards: boolean;
} & StreamEditorProps) {
  const system = useContext(SnortContext);
  const [topup, setTopup] = useState(false);
  const [info, setInfo] = useState<StreamProviderInfo>();
  const [ep, setEndpoint] = useState<StreamProviderEndpoint>();
  const [hrs, setHrs] = useState(25);
  const [tos, setTos] = useState(false);
  const rate = useRates("BTCUSD");

  function sortEndpoints(arr: Array<StreamProviderEndpoint>) {
    return arr.sort((a, b) => ((a.rate ?? 0) > (b.rate ?? 0) ? -1 : 1));
  }

  useEffect(() => {
    provider.info().then(v => {
      setInfo(v);
      setTos(v.tosAccepted ?? true);
      setEndpoint(sortEndpoints(v.endpoints)[0]);
    });
  }, [provider]);

  if (!info) {
    return <Spinner />;
  }

  if (topup) {
    return (
      <SendZaps
        lnurl={{
          name: provider.name,
          canZap: false,
          maxCommentLength: 0,
          getInvoice: async amount => {
            const pr = await provider.topup(amount);
            return { pr };
          },
        }}
        onFinish={() => {
          provider.info().then(v => {
            setInfo(v);
            setTopup(false);
          });
        }}
      />
    );
  }

  function calcEstimate() {
    if (!ep?.rate || !ep?.unit || !info?.balance || !info.balance) return;

    const raw = Math.max(0, info.balance / ep.rate);
    if (ep.unit === "min" && raw > 60) {
      const pm = hrs * 60 * ep.rate;
      return (
        <>
          {`${(raw / 60).toFixed(0)} hour @ ${ep.rate} sats/${ep.unit}`}
          &nbsp; or <br />
          {`${pm.toLocaleString()} sats/month ($${(rate.ask * pm * 1e-8).toFixed(2)}/mo) streaming ${hrs} hrs/month`}
          <div className="paper">
            Hrs
            <input type="number" value={hrs} onChange={e => setHrs(e.target.valueAsNumber)} />
          </div>
        </>
      );
    }
    return `${raw.toFixed(0)} ${ep.unit} @ ${ep.rate} sats/${ep.unit}`;
  }

  function parseCapability(cap: string) {
    const [tag, ...others] = cap.split(":");
    if (tag === "variant") {
      const [height] = others;
      return height === "source" ? "source" : `${height.slice(0, -1)}p`;
    }
    if (tag === "output") {
      return others[0];
    }
    return cap;
  }

  async function acceptTos() {
    await provider.acceptTos();
    const i = await provider.info();
    setInfo(i);
  }

  function tosInput() {
    if (!info) return;

    return (
      <>
        <div>
          <div className="flex gap-2">
            <input type="checkbox" checked={tos} onChange={e => setTos(e.target.checked)} />
            <p>
              <FormattedMessage
                defaultMessage="I have read and agree with {provider}'s {terms}."
                id="RJOmzk"
                values={{
                  provider: info.name,
                  terms: (
                    <span
                      className="tos-link"
                      onClick={() => window.open(info.tosLink, "popup", "width=400,height=800")}>
                      <FormattedMessage defaultMessage="terms and conditions" id="thsiMl" />
                    </span>
                  ),
                }}
              />
            </p>
          </div>
        </div>
        <div>
          <AsyncButton type="button" className="btn btn-primary wide" disabled={!tos} onClick={acceptTos}>
            <FormattedMessage defaultMessage="Continue" id="acrOoz" />
          </AsyncButton>
        </div>
      </>
    );
  }

  function streamEndpoints() {
    if (!info) return;
    return (
      <>
        {info.endpoints.length > 1 && (
          <div>
            <p>
              <FormattedMessage defaultMessage="Endpoint" id="ljmS5P" />
            </p>
            <div className="flex gap-2">
              {sortEndpoints(info.endpoints).map(a => (
                <span
                  className={`pill bg-gray-1${ep?.name === a.name ? " active" : ""}`}
                  onClick={() => setEndpoint(a)}>
                  {a.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <div>
          <p>
            <FormattedMessage defaultMessage="Server Url" id="5kx+2v" />
          </p>
          <div className="paper">
            <input type="text" value={ep?.url} disabled />
          </div>
        </div>
        <div>
          <p>
            <FormattedMessage defaultMessage="Stream Key" id="LknBsU" />
          </p>
          <div className="flex gap-2">
            <div className="paper grow">
              <input type="password" value={ep?.key} disabled />
            </div>
            <AsyncButton
              className="btn btn-primary"
              onClick={() => window.navigator.clipboard.writeText(ep?.key ?? "")}>
              <FormattedMessage defaultMessage="Copy" id="4l6vz1" />
            </AsyncButton>
          </div>
        </div>
        <div>
          <p>
            <FormattedMessage defaultMessage="Balance" id="H5+NAX" />
          </p>
          <div className="flex gap-2">
            <div className="paper grow">
              <FormattedMessage
                defaultMessage="{amount} sats"
                id="vrTOHJ"
                values={{ amount: info.balance?.toLocaleString() }}
              />
            </div>
            <AsyncButton className="btn btn-primary" onClick={() => setTopup(true)}>
              <FormattedMessage defaultMessage="Topup" id="nBCvvJ" />
            </AsyncButton>
          </div>
          <small>
            <FormattedMessage defaultMessage="About {estimate}" id="Q3au2v" values={{ estimate: calcEstimate() }} />
          </small>
        </div>
        <div>
          <p className="pb-2">
            <FormattedMessage defaultMessage="Features" id="ZXp0z1" />
          </p>
          <div className="flex gap-2">
            {ep?.capabilities?.map(a => (
              <span className="pill bg-gray-1">{parseCapability(a)}</span>
            ))}
          </div>
        </div>
      </>
    );
  }

  function streamEditor() {
    if (!info || !showEditor) return;
    if (info.tosAccepted === false) {
      return tosInput();
    }

    return (
      <StreamEditor
        onFinish={ex => {
          provider.updateStreamInfo(system, ex);
          others.onFinish?.(ex);
        }}
        ev={
          {
            tags: [
              ["title", info.streamInfo?.title ?? ""],
              ["summary", info.streamInfo?.summary ?? ""],
              ["image", info.streamInfo?.image ?? ""],
              ...(info.streamInfo?.goal ? [["goal", info.streamInfo.goal]] : []),
              ...(info.streamInfo?.content_warning ? [["content-warning", info.streamInfo?.content_warning]] : []),
              ...(info.streamInfo?.tags?.map(a => ["t", a]) ?? []),
            ],
          } as NostrEvent
        }
        options={{
          canSetStream: false,
          canSetStatus: false,
        }}
      />
    );
  }

  function forwardInputs() {
    if (!info || !showForwards) return;

    return (
      <div className="flex flex-col gap-4">
        <h3>
          <FormattedMessage defaultMessage="Stream Forwarding" id="W7DNWx" />
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {info.forwards?.map(a => (
            <>
              <div className="paper">{a.name}</div>
              <AsyncButton
                className="btn btn-primary"
                onClick={async () => {
                  await provider.removeForward(a.id);
                }}>
                <FormattedMessage defaultMessage="Remove" id="G/yZLu" />
              </AsyncButton>
            </>
          ))}
        </div>
        <AddForwardInputs provider={provider} onAdd={() => {}} />
      </div>
    );
  }

  return (
    <>
      {showEndpoints && streamEndpoints()}
      {streamEditor()}
      {forwardInputs()}
    </>
  );
}

enum ForwardService {
  Custom = "custom",
  Twitch = "twitch",
  Youtube = "youtube",
  Facebook = "facebook",
  Kick = "kick",
  Trovo = "trovo",
}

function AddForwardInputs({
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
        a => a.name.toLowerCase().startsWith("europe:") && a.availability === 1
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
          })
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
          })
        );
        return;
      }
    } else {
      if (target.length < 2) {
        setError(
          formatMessage({
            defaultMessage: "Stream Key is required",
            id: "50+/JW",
          })
        );
        return;
      }
    }
    if (name.length < 2) {
      setError(
        formatMessage({
          defaultMessage: "Name is required",
          id: "Gvxoji",
        })
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
          })
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
    <div className="flex flex-col p-4 gap-2 bg-gray-3 rounded-xl">
      <div className="flex gap-2">
        <div className="paper flex-1">
          <select value={svc} onChange={e => setService(e.target.value as ForwardService)} className="bg-gray-1">
            <option value="twitch">Twitch</option>
            <option value="youtube">Youtube</option>
            <option value="facebook">Facebook Gaming</option>
            <option value="kick">Kick</option>
            <option value="trovo">Trovo</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div className="paper flex-1">
          <input
            type="text"
            placeholder={formatMessage({ defaultMessage: "Display name", id: "dOQCL8" })}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
      </div>
      <div className="paper">
        <input
          type="text"
          placeholder={
            svc === ForwardService.Custom ? "rtmp://" : formatMessage({ defaultMessage: "Stream key", id: "QWlMq9" })
          }
          value={target}
          onChange={e => setTarget(e.target.value)}
        />
      </div>
      <AsyncButton className="btn btn-primary" onClick={doAdd}>
        <FormattedMessage defaultMessage="Add" id="2/2yg+" />
      </AsyncButton>
      {error && <b className="warning">{error}</b>}
    </div>
  );
}
