/* eslint-disable @typescript-eslint/ban-ts-comment */
import Hls from "hls.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { StatePill } from "./state-pill";
import { StreamState } from "..";
import { Icon } from "./icon";

export enum VideoStatus {
  Online = "online",
  Offline = "offline",
}

export interface VideoPlayerProps {
  stream?: string;
  status?: string;
  poster?: string;
}

export default function LiveVideoPlayer(props: VideoPlayerProps) {
  const video = useRef<HTMLVideoElement>(null);
  const hlsObj = useRef<Hls>(null);
  const streamCached = useMemo(() => props.stream, [props.stream]);
  const [status, setStatus] = useState<VideoStatus>();
  const [src, setSrc] = useState<string>();
  const [levels, setLevels] = useState<Array<{ level: number; height: number }>>();
  const [level, setLevel] = useState<number>(-1);
  const [playState, setPlayState] = useState<"loading" | "playing" | "paused">("loading");
  const [volume, setVolume] = useState(1);
  const [position, setPosition] = useState<number>();
  const [maxPosition, setMaxPosition] = useState<number>();

  useEffect(() => {
    if (streamCached && video.current) {
      if (Hls.isSupported()) {
        try {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
          });
          hls.loadSource(streamCached);
          hls.attachMedia(video.current);
          hls.on(Hls.Events.ERROR, (event, data) => {
            console.debug(event, data);
            const errorType = data.type;
            if (errorType === Hls.ErrorTypes.NETWORK_ERROR && data.fatal) {
              hls.stopLoad();
              hls.detachMedia();
              setStatus(VideoStatus.Offline);
            }
          });
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setStatus(VideoStatus.Online);
            setLevels(
              hls.levels.map((a, i) => ({
                level: i,
                height: a.height,
              }))
            );
          });
          hls.on(Hls.Events.LEVEL_SWITCHING, (_, l) => {
            console.debug("HLS Level Switch", l);
            setMaxPosition(l.details?.totalduration);
          });
          // @ts-ignore Can write anyway
          hlsObj.current = hls;
          return () => {
            // @ts-ignore Can write anyway
            hlsObj.current = null;
            hls.destroy();
          };
        } catch (e) {
          console.error(e);
          setStatus(VideoStatus.Offline);
        }
      } else {
        setSrc(streamCached);
        setStatus(VideoStatus.Online);
        video.current.muted = true;
        video.current.load();
      }
    }
  }, [video, streamCached, props.status]);

  useEffect(() => {
    if (hlsObj.current) {
      hlsObj.current.nextLevel = level;
    }
  }, [hlsObj, level]);

  useEffect(() => {
    if (video.current) {
      video.current.onplaying = () => setPlayState("playing");
      video.current.onpause = () => setPlayState("paused");
      video.current.onseeking = () => setPlayState("loading");
      video.current.onplay = () => setPlayState("loading");
      video.current.onvolumechange = () => setVolume(video.current?.volume ?? 1);
      video.current.ontimeupdate = () => setPosition(video.current?.currentTime);
    }
  }, [video]);

  useEffect(() => {
    if (video.current) {
      video.current.volume = volume;
    }
  }, [video, volume]);

  function changeVolume(e: React.MouseEvent) {
    if (e.currentTarget === e.target) {
      const bb = (e.target as HTMLDivElement).getBoundingClientRect();

      const x = e.clientX - bb.x;
      const vol = Math.max(0, Math.min(1.0, x / bb.width));
      setVolume(vol);
    }
  }

  function seek(e: React.MouseEvent) {
    if (e.currentTarget === e.target) {
      const bb = (e.target as HTMLDivElement).getBoundingClientRect();

      const x = e.clientX - bb.x;
      const pos = Math.max(0, Math.min(1.0, x / bb.width));

      if (video.current && maxPosition) {
        const ct = maxPosition * pos;
        video.current.currentTime = ct;
        setPosition(ct);
      }
    }
  }

  function playStateToIcon() {
    switch (playState) {
      case "playing":
        return "pause";
      case "paused":
        return "play";
      case "loading":
        return "loading";
    }
  }
  return (
    <div className="relative">
      {status === VideoStatus.Online && (
        <div
          className="absolute opacity-0 hover:opacity-100 transition-opacity w-full h-full z-20 bg-[#00000055]"
          onClick={() => {
            if (video.current) {
              if (playState === "playing") {
                video.current.pause();
              } else if (playState === "paused") {
                video.current.play();
              }
            }
          }}>
          <div className="absolute w-full h-full flex items-center justify-center pointer">
            <Icon
              name={playStateToIcon()}
              size={80}
              className={playState === "loading" ? "animate-spin" : "animate-ping-once"}
            />
          </div>
          <div className="absolute flex gap-1 bottom-0 w-full bg-[rgba(0,0,0,0.5)]" onClick={e => e.stopPropagation()}>
            <div className="flex grow gap-1">
              <StatePill state={props.status as StreamState} />
              {props.status === StreamState.Ended && playState && maxPosition && position && (
                <div className="relative w-full h-full border" onClick={seek}>
                  <div
                    className="absolute h-full w-[4px] bg-white"
                    style={{
                      width: `${((position / maxPosition) * 100).toFixed(1)}%`,
                    }}></div>
                </div>
              )}
            </div>
            <div className="flex gap-1 items-center">
              <Icon name="volume" />
              <div
                className="relative w-[104px] h-full border"
                onMouseDown={changeVolume}
                onMouseMove={e => {
                  if (e.buttons > 0) {
                    changeVolume(e);
                  }
                }}>
                <div
                  className="absolute h-full w-[4px] bg-white"
                  style={{
                    left: `${Math.floor(100 * volume)}px`,
                  }}></div>
              </div>
            </div>
            <div>
              <select onChange={e => setLevel(Number(e.target.value))}>
                <option value={-1}>
                  <FormattedMessage defaultMessage="Auto" id="NXI/XL" />
                </option>
                {levels?.map(v => (
                  <option value={v.level} key={v.level}>
                    <FormattedMessage defaultMessage="{n}p" id="YagVIe" values={{ n: v.height }} />
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      {status === VideoStatus.Offline && (
        <div className="absolute w-full h-full z-20 bg-[#000000aa] flex items-center justify-center text-3xl font-bold uppercase">
          <FormattedMessage defaultMessage="Offline" id="7UOvbT" />
        </div>
      )}
      <video className="z-10" ref={video} autoPlay={true} poster={props.poster} src={src} playsInline={true} />
    </div>
  );
}
