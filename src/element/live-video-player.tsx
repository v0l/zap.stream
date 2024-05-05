/* eslint-disable @typescript-eslint/ban-ts-comment */
import Hls from "hls.js";
import { HTMLProps, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Icon } from "./icon";
import { ProgressBar } from "./progress-bar";
import { Menu, MenuItem } from "@szhsin/react-menu";
import { StreamState } from "@/const";
import classNames from "classnames";

export enum VideoStatus {
  Online = "online",
  Offline = "offline",
}

type VideoPlayerProps = {
  title?: string;
  stream?: string;
  status?: StreamState;
  poster?: string;
  muted?: boolean;
} & HTMLProps<HTMLVideoElement>;

export default function LiveVideoPlayer({
  title,
  stream,
  status: pStatus,
  poster,
  muted: pMuted,
  ...props
}: VideoPlayerProps) {
  const video = useRef<HTMLVideoElement>(null);
  const hlsObj = useRef<Hls>(null);
  const streamCached = useMemo(() => stream, [stream]);
  const [status, setStatus] = useState<VideoStatus>();
  const [src, setSrc] = useState<string>();
  const [levels, setLevels] = useState<Array<{ level: number; height: number }>>();
  const [level, setLevel] = useState<number>(-1);
  const [playState, setPlayState] = useState<"loading" | "playing" | "paused">("playing");
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(pMuted ?? false);
  const [position, setPosition] = useState<number>();
  const [maxPosition, setMaxPosition] = useState<number>();

  useEffect(() => {
    if (streamCached && video.current) {
      if (Hls.isSupported() && streamCached.endsWith(".m3u8")) {
        try {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
          });
          let timeout: NodeJS.Timeout;
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
            setLevels([
              {
                level: -1,
                height: 0,
              },
              ...hls.levels.map((a, i) => ({
                level: i,
                height: a.height,
              })),
            ]);
            timeout = setTimeout(() => {
              video.current?.play()
                .catch(e => {
                  console.log(e);
                  setPlayState("paused");
                });
            }, 1000);
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
            clearTimeout(timeout);
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
  }, [video, streamCached, pStatus]);

  useEffect(() => {
    if (hlsObj.current) {
      hlsObj.current.nextLevel = level;
    }
  }, [hlsObj, level]);

  useEffect(() => {
    if (video.current) {
      video.current.onplaying = () => setPlayState("playing");
      video.current.onpause = () => setPlayState("paused");
      video.current.onseeking = () => {
        if (video.current?.paused) {
          setPlayState("paused");
        } else {
          setPlayState("loading");
        }
      };
      video.current.onplay = () => setPlayState("loading");
      video.current.onvolumechange = () => setVolume(video.current?.volume ?? 1);
      video.current.ontimeupdate = () => setPosition(video.current?.currentTime);
    }
  }, [video]);

  useEffect(() => {
    if (video.current) {
      if (video.current.volume !== volume) {
        video.current.volume = volume;
      }
      if (video.current.muted !== muted) {
        video.current.muted = muted;
      }
    }
  }, [video, volume, muted]);

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

  function togglePlay() {
    if (video.current) {
      if (playState === "playing") {
        video.current.pause();
      } else if (playState === "paused") {
        video.current.play();
      }
    }
  }

  function toggleMute() {
    setMuted(s => !s);
  }

  function levelName(l: number) {
    if (l === -1) {
      return <FormattedMessage defaultMessage="AUTO" id="o8pHw3" />;
    } else {
      const h = levels?.find(a => a.level === l)?.height;
      return <FormattedMessage defaultMessage="{n}p" id="YagVIe" values={{ n: h }} />;
    }
  }

  function playerOverlay() {
    return (
      <>
        {status === VideoStatus.Online && (
          <div
            className="absolute opacity-0 hover:opacity-90 transition-opacity w-full h-full z-20 bg-[#00000055] select-none"
            onClick={() => togglePlay()}>
            {/* TITLE */}
            <div className="absolute top-2 w-full text-center">
              <h2>{title}</h2>
            </div>
            {/* CENTER PLAY ICON */}
            <div className="absolute w-full h-full flex items-center justify-center pointer">
              <Icon name={playStateToIcon()} size={80} className={playState === "loading" ? "animate-spin" : ""} />
            </div>
            {/* PLAYER CONTROLS OVERLAY */}
            <div
              className="absolute flex items-center gap-1 bottom-0 w-full bg-primary h-[40px]"
              onClick={e => e.stopPropagation()}>
              <div className="flex grow gap-1 items-center">
                <div className="px-5 py-2 pointer" onClick={() => togglePlay()}>
                  <Icon name={playStateToIcon()} className={playState === "loading" ? "animate-spin" : ""} />
                </div>
                <div className="px-3 py-2 uppercase font-bold tracking-wide hover:bg-primary-hover">{pStatus}</div>
                {pStatus === StreamState.Ended && maxPosition !== undefined && position !== undefined && (
                  <ProgressBar
                    value={position / maxPosition}
                    setValue={v => {
                      const ct = maxPosition * v;
                      if (video.current) {
                        video.current.currentTime = ct;
                      }
                      setPosition(ct);
                    }}
                    marker={<div className="w-[16px] h-[16px] mt-[-8px] rounded-full bg-white"></div>}
                    style={{ width: "100%", height: "4px" }}
                  />
                )}
              </div>
              <div className="flex gap-1 items-center h-full py-2">
                <Icon name={muted ? "volume-muted" : "volume"} onClick={toggleMute} />
                <ProgressBar value={volume} setValue={v => setVolume(v)} style={{ width: "100px", height: "100%" }} />
              </div>
              <div>
                <Menu
                  direction="top"
                  align="center"
                  menuButton={<div className="px-3 py-2 tracking-wide pointer">{levelName(level)}</div>}
                  menuClassName="bg-primary w-fit">
                  {levels?.map(v => (
                    <MenuItem
                      value={v.level}
                      key={v.level}
                      onClick={() => setLevel(v.level)}
                      className="bg-primary px-3 py-2 text-white">
                      {levelName(v.level)}
                    </MenuItem>
                  ))}
                </Menu>
              </div>
              <div
                className="px-3 py-2 pointer"
                onClick={() => {
                  if (video.current) {
                    video.current.requestFullscreen();
                  }
                }}>
                <Icon name="fullscreen" size={24} />
              </div>
            </div>
          </div>
        )}
        {status === VideoStatus.Offline && (
          <div className="absolute w-full h-full z-20 bg-[#000000aa] flex items-center justify-center text-3xl font-bold uppercase">
            <FormattedMessage defaultMessage="Offline" id="7UOvbT" />
          </div>
        )}
      </>
    );
  }
  return (
    <div className="relative h-inherit">
      {playerOverlay()}
      <video
        {...props}
        className={classNames(props.className, "aspect-video")}
        ref={video}
        autoPlay={true}
        poster={poster}
        src={src}
        playsInline={true}
      />
    </div>
  );
}
