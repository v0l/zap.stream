import { SHORTS_KIND, VIDEO_KIND } from "@/const";
import { DefaultButton, IconButton, Layer3Button, PrimaryButton, WarningButton } from "@/element/buttons";
import { Icon } from "@/element/icon";
import Modal from "@/element/modal";
import { Profile } from "@/element/profile";
import Spinner from "@/element/spinner";
import { MediaServerFileList } from "@/element/upload/file-list";
import { ServerList } from "@/element/upload/server-list";
import useImgProxy from "@/hooks/img-proxy";
import { useLogin } from "@/hooks/login";
import { useMediaServerList } from "@/hooks/media-servers";
import { Nip94Tags, UploadResult, nip94TagsToIMeta, readNip94Tags } from "@/service/upload";
import { Nip96Server } from "@/service/upload/nip96";
import { openFile } from "@/utils";
import { ExternalStore, removeUndefined, unwrap } from "@snort/shared";
import { EventBuilder, EventPublisher, NostrEvent, NostrLink } from "@snort/system";
import { SnortContext } from "@snort/system-react";
import { useContext, useEffect, useState, useSyncExternalStore } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

interface UploadStatus {
  type: "video" | "thumb";
  name: string;
  size: number;
  server: string;
  result?: UploadResult;
}

interface UploadDraft {
  id: string;
  uploads: Array<UploadStatus>;
}

class UploadManager extends ExternalStore<Array<UploadStatus>> {
  #uploaders: Map<string, Nip96Server> = new Map();
  #uploads: Map<string, UploadStatus> = new Map();
  #id: string;

  constructor() {
    super();
    this.#id = uuid();
    const draft = localStorage.getItem("upload-draft");
    if (draft) {
      const saved = JSON.parse(draft) as UploadDraft;
      this.#uploads = new Map(saved.uploads.map(a => [`${a.name}:${a.server}:${a.type}`, a]));
      this.#id = saved.id;
    }
    this.on("change", () =>
      localStorage.setItem(
        "upload-draft",
        JSON.stringify({
          id: this.#id,
          uploads: this.snapshot(),
        }),
      ),
    );
  }

  get id() {
    return this.#id;
  }

  removeUpload(server: string, name: string, type: UploadStatus["type"]) {
    const uploadKey = `${name}:${server}:${type}`;
    if (this.#uploads.delete(uploadKey)) {
      this.notifyChange();
    }
  }

  addUpload(server: string, file: NostrEvent, meta: Nip94Tags, type: UploadStatus["type"]) {
    const name = file.content ?? meta.summary ?? meta.alt ?? "";
    const uploadKey = `${name}:${server}:${type}`;
    this.#uploads.set(uploadKey, {
      type,
      name,
      size: meta.size ?? 0,
      server,
      result: {
        url: meta.url,
        header: file,
        metadata: meta,
      },
    });
    this.notifyChange();
  }

  async uploadTo(server: string, file: File, pub: EventPublisher, type: UploadStatus["type"]) {
    let uploader = this.#uploaders.get(server);
    if (!uploader) {
      uploader = new Nip96Server(server, pub);
      this.#uploaders.set(server, uploader);
    }

    const uploadKey = `${file.name}:${server}:${type}`;
    if (this.#uploads.has(uploadKey)) {
      return;
    }

    const status = {
      type,
      name: file.name,
      size: file.size,
      server: server,
    };
    this.#uploads.set(uploadKey, status);
    this.notifyChange();
    try {
      await uploader.loadInfo();
      uploader.upload(file, file.name).then(res => {
        this.#uploads.set(uploadKey, {
          ...status,
          result: res,
        });
        this.notifyChange();
      });
    } catch (e) {
      if (e instanceof Error) {
        this.#uploads.set(uploadKey, {
          ...status,
          result: {
            error: e.message,
          },
        });
        this.notifyChange();
      }
    }
  }

  /**
   * Get the grouped videos/images by resolution
   */
  resolutions() {
    const uploads = this.snapshot();
    const resGroup = uploads.reduce(
      (acc, v) => {
        const dim = v.result?.metadata?.dimensions?.join("x");
        if (dim) {
          acc[dim] ??= [];
          acc[dim].push(v);
        }
        return acc;
      },
      {} as Record<string, Array<UploadStatus>>,
    );
    return resGroup;
  }

  /**
   * Gets the [min, max] duration from all variants
   */
  duration() {
    const uploads = this.snapshot();
    return uploads.reduce(
      (acc, v) => {
        if (v.result?.metadata?.duration) {
          if (acc[1] < v.result.metadata.duration) {
            acc[1] = v.result.metadata.duration;
          }
          if (acc[0] > v.result.metadata.duration) {
            acc[0] = v.result.metadata.duration;
          }
        }
        return acc;
      },
      [1_000_000, 0],
    );
  }

  /**
   * Create the `imeta` tag for this upload
   */
  makeIMeta() {
    const tags: Array<Array<string>> = [];
    for (const vGroup of Object.values(this.resolutions())) {
      const uploadsSuccess = vGroup.filter(a => a.result?.url && a.type === "video");
      const firstUpload = uploadsSuccess.at(0);
      if (firstUpload?.result) {
        const res = firstUpload.result;
        const images = vGroup.filter(a => a.type === "thumb" && a.result?.url).map(a => unwrap(a.result?.url));
        const metaTag: Nip94Tags = {
          ...res.metadata,
          image: images,
          fallback: removeUndefined(uploadsSuccess.filter(a => a.result?.url !== res.url).map(a => a.result?.url)),
        };
        tags.push(nip94TagsToIMeta(metaTag));
      }
    }
    return tags;
  }

  clear() {
    this.#id = uuid();
    this.#uploads = new Map();
    this.notifyChange();
  }

  takeSnapshot(): Array<UploadStatus> {
    return [...this.#uploads.values()];
  }
}

const manager = new UploadManager();

export function UploadPage() {
  const { formatMessage } = useIntl();
  const login = useLogin();
  const system = useContext(SnortContext);
  const [error, setError] = useState<Array<string>>([]);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [thumb, setThumb] = useState("");
  const [editServers, setEditServers] = useState(false);
  const [mediaPicker, setMediaPicker] = useState(false);
  const { proxy } = useImgProxy();
  const uploads = useSyncExternalStore(
    c => manager.hook(c),
    () => manager.snapshot(),
  );
  const navigate = useNavigate();
  const servers = useMediaServerList();

  function canPublish() {
    return error.length == 0 && uploads.length > 0 && uploads.every(a => a.result !== undefined);
  }

  function makeEvent() {
    const duration = manager.duration();
    const eb = new EventBuilder()
      .pubKey(login?.pubkey ?? "00".repeat(31))
      .kind(duration[1] <= 60 ? SHORTS_KIND : VIDEO_KIND)
      .tag(["title", title])
      .content(summary);

    const imeta = manager.makeIMeta();
    imeta.forEach(a => eb.tag(a));

    return eb;
  }

  async function publish() {
    const pub = login?.publisher();
    if (!pub) return;
    const ev = await makeEvent().buildAndSign(pub.signer);
    console.debug(ev);
    await system.BroadcastEvent(ev);
    navigate(`/${NostrLink.fromEvent(ev).encode()}`);
  }

  async function uploadFile() {
    const pub = login?.publisher();
    const f = await openFile();
    if (f && pub) {
      servers.servers.forEach(b => manager.uploadTo(b, f, pub, "video"));
    }
  }

  // use imgproxy to generate video thumbnail
  async function generateThumb() {
    const vid = uploads.find(a => a.result?.url);
    if (!vid) return;

    const rsp = await fetch(proxy(vid!.result!.url!), {
      headers: {
        accept: "image/jpg",
      },
    });
    if (rsp.ok) {
      const data = await rsp.blob();
      const pub = login?.publisher();
      if (pub) {
        servers.servers.forEach(b =>
          manager.uploadTo(
            b,
            new File([data], "thumb.jpg", {
              type: "image/jpeg",
            }),
            pub,
            "thumb",
          ),
        );
      }
    }
  }

  async function uploadThumb() {
    const f = await openFile();
    if (f) {
      const pub = login?.publisher();
      if (pub) {
        servers.servers.forEach(b => manager.uploadTo(b, f, pub, "thumb"));
      }
    }
  }

  useEffect(() => {
    const thumb = uploads.find(a => a.type === "thumb" && a.result?.url);
    if (thumb?.result?.url) {
      setThumb(thumb.result?.url);
    } else {
      setThumb("");
    }
  }, [uploads]);

  const videos = uploads.filter(a => a.type === "video").length;
  const thumbs = uploads.filter(a => a.type === "thumb").length;
  function validate() {
    const maxTitle = 50;
    const err = [];
    if (title.length > maxTitle) {
      err.push(
        formatMessage(
          {
            defaultMessage: "Your title is very long, please make sure its less than {n} chars.",
          },
          {
            n: maxTitle,
          },
        ),
      );
    }
    if (title.length < 5) {
      err.push(
        formatMessage({
          defaultMessage: "Your title is too short",
        }),
      );
    }
    if (videos === 0) {
      err.push(
        formatMessage({
          defaultMessage: "Please upload at least 1 video",
        }),
      );
    }
    if (thumbs === 0) {
      err.push(
        formatMessage({
          defaultMessage: "Please add a thumbnail",
        }),
      );
    }
    const d = manager.duration();
    if (d[0] === 0 || d[1] === 0) {
      err.push(formatMessage({ defaultMessage: "No duration provided, please try another upload server." }));
    }
    if (Math.abs(d[0] - d[1]) >= 0.5) {
      err.push(
        formatMessage({
          defaultMessage: "Video durations vary too much, are you sure each variant is the same video?",
        }),
      );
    }
    setError(err);
  }

  useEffect(() => {
    validate();
  }, [title, summary, uploads, thumb]);

  const uploadButton = () => {
    return (
      <>
        <div className="flex items-center gap-4 bg-layer-3 rounded-lg p-4" onClick={() => uploadFile()}>
          <Icon name="upload" />
          <FormattedMessage defaultMessage="Upload Video" />
        </div>
        <FormattedMessage defaultMessage="or" />
        <div className="flex items-center gap-4 bg-layer-3 rounded-lg p-4" onClick={() => setMediaPicker(true)}>
          <FormattedMessage defaultMessage="Choose file." />
        </div>
      </>
    );
  };

  return (
    <div className="max-xl:w-full xl:w-[1200px] xl:mx-auto grid gap-6 xl:grid-cols-[auto_350px] max-xl:px-4">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center bg-layer-2 rounded-xl px-3 py-2">
          <FormattedMessage defaultMessage="Uploading to {n} servers" values={{ n: servers.servers.length }} />
          <Layer3Button onClick={() => setEditServers(true)}>
            <FormattedMessage defaultMessage="Manage Servers" />
          </Layer3Button>
        </div>
        <div className="relative bg-layer-2 rounded-xl w-full aspect-video cursor-pointer overflow-hidden">
          {videos > 0 && (
            <video
              className="w-full h-full absolute"
              controls
              src={uploads.find(a => a.result?.url && a.type === "video")?.result?.url}
            />
          )}
          {videos === 0 && (
            <div className="absolute w-full h-full flex items-center gap-4 justify-center">{uploadButton()}</div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            className="reset bg-layer-2 text-xl px-3 py-2 rounded-xl"
            placeholder={formatMessage({
              defaultMessage: "Untitled",
            })}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <Profile pubkey={login?.pubkey ?? ""} avatarSize={40} linkToProfile={false} />
          <textarea
            className="reset bg-layer-2 px-3 py-2 rounded-xl"
            placeholder={formatMessage({
              defaultMessage: "Description..",
            })}
          />
        </div>
        <div className="flex flex-col">
          {error.map((a, i) => (
            <b className="text-warning">
              #{i + 1}: {a}
            </b>
          ))}
        </div>
        {videos > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-xl">
              <FormattedMessage defaultMessage="Add more content" />
            </div>
            <div className="flex gap-4 items-center">{uploadButton()}</div>
          </div>
        )}
        {uploads.length > 0 && (
          <div className="flex flex-col gap-2 min-w-0 w-full">
            {uploads.map(a => (
              <UploadProgress status={a} />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-6">
        <div className="bg-layer-1 rounded-xl flex flex-col gap-4 px-5 py-4">
          <div className="text-xl font-semibold">
            <FormattedMessage defaultMessage="Thumbnail" />
          </div>
          <div className="border border-layer-3 border-dashed border-2 rounded-xl aspect-video overflow-hidden">
            {thumb && <img src={proxy(thumb)} className="w-full h-full object-contain" />}
          </div>
          <div className="flex gap-4">
            <DefaultButton onClick={() => uploadThumb()}>
              <Icon name="upload" />
              <FormattedMessage defaultMessage="Upload" />
            </DefaultButton>
            <DefaultButton onClick={() => generateThumb()}>
              <Icon name="repost" />
              <FormattedMessage defaultMessage="Generate" />
            </DefaultButton>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <PrimaryButton onClick={() => publish()} disabled={!canPublish()}>
            <FormattedMessage defaultMessage="Publish" />
          </PrimaryButton>
          <WarningButton
            onClick={() => {
              manager.clear();
              setThumb("");
              setSummary("");
              setTitle("");
            }}>
            <FormattedMessage defaultMessage="Clear Draft" />
          </WarningButton>
        </div>
      </div>

      <div>
        <FormattedMessage defaultMessage="Raw Data:" />
        <pre className="text-xs font-mono overflow-wrap text-pretty">
          {JSON.stringify(makeEvent().build(), undefined, 2)}
        </pre>
      </div>
      {editServers && (
        <Modal id="server-list" onClose={() => setEditServers(false)}>
          <ServerList />
        </Modal>
      )}
      {mediaPicker && (
        <Modal id="media-picker" onClose={() => setMediaPicker(false)} largeModal={true}>
          <MediaServerFileList
            onPicked={files => {
              files.forEach(f => {
                const meta = readNip94Tags(f.tags);
                if (meta.url) {
                  const url = new URL(meta.url);
                  manager.addUpload(
                    `${url.protocol}//${url.host}/`,
                    f,
                    meta,
                    meta.mimeType?.startsWith("image/") ?? false ? "thumb" : "video",
                  );
                }
              });
              setMediaPicker(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function UploadProgress({ status }: { status: UploadStatus }) {
  const { formatMessage } = useIntl();
  return (
    <div className="rounded-xl bg-layer-2 px-3 py-2 flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <div>Upload "{status.name}"</div>
        <div className="flex gap-2">
          <div className="text-layer-4">{status.server}</div>
          <IconButton
            iconName="x"
            iconSize={16}
            title={formatMessage({
              defaultMessage: "Delete file",
            })}
            onClick={() => {
              manager.removeUpload(status.server, status.name, status.type);
            }}
          />
        </div>
      </div>
      {!status.result && (
        <div className="flex items-center gap-2">
          <Spinner />
          <FormattedMessage defaultMessage="Uploading.." />
        </div>
      )}
      {status.result && !status.result.error && (
        <div className="flex gap-4">
          <FormattedMessage defaultMessage="OK" />
          <div className="flex gap-2 text-layer-4">
            <div>{status.result.metadata?.dimensions?.join("x")}</div>
            <div>{status.result.metadata?.mimeType}</div>
          </div>
        </div>
      )}
      {status.result && status.result.error && <b className="text-warning">{status.result.error}</b>}
    </div>
  );
}
