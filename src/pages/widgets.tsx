import { type ReactNode, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NostrLink } from "@snort/system";

import Copy from "@/element/copy";
import { useCurrentStreamFeed } from "@/hooks/current-stream-feed";
import { getVoices, speak, toTextToSpeechParams } from "@/text2speech";
import { useLogin } from "@/hooks/login";
import { ZapAlertItem } from "./widgets/zaps";
import { TopZappersWidget } from "./widgets/top-zappers";
import { Views } from "./widgets/views";
import { Music } from "./widgets/music";
import { NostrPrefix, hexToBech32 } from "@snort/shared";
import { DefaultButton, Layer1Button } from "@/element/buttons";
import { groupBy } from "@/utils";
import { TwitchChat } from "@/service/twitch-chat";
import { TwitchApiClientId } from "@/const";
import { v4 as uuid } from "uuid";

interface ZapAlertConfigurationProps {
  npub: string;
  baseUrl: string;
}

function ZapAlertConfiguration({ npub, baseUrl }: ZapAlertConfigurationProps) {
  const login = useLogin();
  const { formatMessage, formatDisplayName } = useIntl();

  const [testText, setTestText] = useState("");
  const [textToSpeech, setTextToSpeech] = useState<boolean>(false);
  const [voice, setVoice] = useState<string | null>(null);
  const [minSatsForTextToSpeech, setMinSatsForTextToSpeech] = useState<string>("21");
  const [volume, setVolume] = useState<number>(1);

  // Google propietary voices are not available on OBS browser
  const voices = getVoices().filter(v => !v.name.includes("Google"));
  const groupedVoices = useMemo(() => {
    return groupBy(voices, v => v.lang);
  }, [voices]);
  const languages = useMemo(() => {
    return Object.keys(groupedVoices).sort();
  }, [groupedVoices]);
  const selectedVoice = useMemo(() => {
    return voices.find(v => v.voiceURI === voice);
  }, [voice]);

  const isTextToSpeechSupported = "speechSynthesis" in window && voices.length > 0;
  const isTextToSpeechEnabled = isTextToSpeechSupported && textToSpeech;

  const query = useMemo(() => {
    const params = toTextToSpeechParams({
      voiceURI: voice,
      minSats: voice ? Number(minSatsForTextToSpeech) : null,
      volume,
    });
    const queryParams = params.toString();
    return queryParams.length > 0 ? `?${queryParams}` : "";
  }, [voice, volume, minSatsForTextToSpeech]);

  function testVoice() {
    if (selectedVoice) {
      speak(selectedVoice, testText, volume);
    }
  }

  return (
    <>
      <h3>
        <FormattedMessage defaultMessage="Zap Alert" />
      </h3>
      <Copy text={`${baseUrl}/alert/${npub}/zaps${query}`} />
      <ZapAlertItem
        item={{
          id: "",
          valid: true,
          content: testText,
          zapService: "",
          anonZap: false,
          errors: [],
          sender: login?.pubkey,
          amount: 1_000_000,
          targetEvents: [],
          created_at: 0,
        }}
      />
      {isTextToSpeechSupported && (
        <div>
          <div className="flex items-center gap-2 select-none" onClick={() => setTextToSpeech(!textToSpeech)}>
            <input
              type="checkbox"
              checked={textToSpeech}
              onChange={ev => {
                setTextToSpeech(ev.target.checked);
              }}
            />
            <FormattedMessage defaultMessage="Enable text to speech" />
          </div>
          {isTextToSpeechEnabled && (
            <>
              <div className="flex items-center gap-2">
                <label htmlFor="minimum-sats">
                  <FormattedMessage defaultMessage="Minimum amount for text to speech" />
                </label>
                <input
                  id="minimum-sats"
                  type="number"
                  min="1"
                  value={minSatsForTextToSpeech}
                  onChange={ev => setMinSatsForTextToSpeech(ev.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="volume">
                  <FormattedMessage defaultMessage="Volume" />
                </label>
                <input
                  id="volume"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={ev => setVolume(Number(ev.target.value))}
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="voice-selector">
                  <FormattedMessage defaultMessage="Voice" />
                </label>
                <select id="voice-selector" onChange={ev => setVoice(ev.target.value)}>
                  <option value="">
                    <FormattedMessage defaultMessage="Select voice..." />
                  </option>
                  {languages.map(l => (
                    <optgroup label={formatDisplayName(l, { type: "language" })}>
                      {groupedVoices[l].map(v => (
                        <option value={v.voiceURI}>{v.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              {voice && (
                <>
                  <div className="flex items-center gap-2">
                    <label htmlFor="zap-alert-text">
                      <FormattedMessage defaultMessage="Zap message" />
                    </label>
                    <textarea
                      id="zap-alert-text"
                      placeholder={formatMessage({ defaultMessage: "Insert text to speak" })}
                      value={testText}
                      onChange={ev => setTestText(ev.target.value)}
                    />
                  </div>
                  <DefaultButton disabled={testText.length === 0} onClick={testVoice}>
                    <FormattedMessage defaultMessage="Test voice" />
                  </DefaultButton>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

export function WidgetsPage() {
  const login = useLogin();
  const profileLink = new NostrLink(NostrPrefix.PublicKey, login?.pubkey ?? "");
  const current = useCurrentStreamFeed(profileLink);
  const currentLink = current ? NostrLink.fromEvent(current) : undefined;
  const npub = hexToBech32("npub", login?.pubkey);

  const baseUrl = `${window.location.protocol}//${window.location.host}`;

  function WidgetBox({ children }: { children?: ReactNode }) {
    return <div className="bg-layer-2 rounded-xl p-3 flex flex-col gap-2 min-h-40">{children}</div>;
  }

  const authToken = window.location.hash.startsWith("#access_token=") ? window.location.hash.substring(1) : undefined;
  const params = new URLSearchParams(authToken);
  if (params.has("state")) {
    const expectState = window.localStorage.getItem("twitch-csrf");
    if (expectState !== params.get("state")) {
      throw new Error("CSRF ERROR");
    }
  }
  return (
    <div className="grid grid-cols-4 gap-2">
      <WidgetBox>
        <h3>
          <FormattedMessage defaultMessage="Chat Widget" />
        </h3>
        <Copy text={`${baseUrl}/chat/${npub}${authToken ? `?twitch_token=${params.get("access_token")}` : ""}`} />
        {!authToken && <Layer1Button onClick={() => {
          const state = uuid();
          window.localStorage.setItem("twitch-csrf", state);
          const url = TwitchChat.getAuthUrl(TwitchApiClientId, window.location.href, ["user:read:chat"], state);
          window.location.href = url;
        }}>
          Login with Twitch
        </Layer1Button>}
      </WidgetBox>
      <WidgetBox>
        <ZapAlertConfiguration npub={npub} baseUrl={baseUrl} />
      </WidgetBox>
      <WidgetBox>
        <h3>
          <FormattedMessage defaultMessage="Top Zappers" />
        </h3>
        <Copy text={`${baseUrl}/alert/${npub}/top-zappers`} />
        {currentLink && <TopZappersWidget link={currentLink} />}
      </WidgetBox>
      <WidgetBox>
        <h3>
          <FormattedMessage defaultMessage="Current Viewers" />
        </h3>
        <Copy text={`${baseUrl}/alert/${npub}/views`} />
        {currentLink && <Views link={currentLink} />}
      </WidgetBox>
      <WidgetBox>
        <h3>
          <FormattedMessage defaultMessage="Music" />
        </h3>
        <Copy text={`${baseUrl}/alert/${npub}/music`} />
        {currentLink && <Music link={currentLink} />}
      </WidgetBox>
    </div>
  );
}
