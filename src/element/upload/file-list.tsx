import { useLogin } from "@/hooks/login";
import { useMediaServerList } from "@/hooks/media-servers";
import { type BlobDescriptor, Blossom } from "@/service/upload";
import { useEffect, useState } from "react";
import { FormattedMessage, FormattedNumber } from "react-intl";
import { PrimaryButton } from "../buttons";
import { dedupeBy } from "@snort/shared";

export function MediaServerFileList({ onPicked }: { onPicked: (files: Array<BlobDescriptor>) => void }) {
  const login = useLogin();
  const [fileList, setFilesList] = useState<Array<BlobDescriptor>>([]);
  const [pickedFiles, setPickedFiles] = useState<Array<string>>([]);
  const servers = useMediaServerList();

  async function listFiles() {
    const res = [];
    const pub = login?.publisher();
    if (!pub) return;
    for (const s of servers.servers) {
      try {
        const sx = new Blossom(s, pub);
        const files = await sx.list(pub.pubKey);
        res.push(...files);
      } catch (e) {
        console.error(e);
      }
    }
    setFilesList(dedupeBy(res, r => r.sha256));
  }

  function toggleFile(b: BlobDescriptor) {
    const hash = b.sha256;
    if (!hash) return;
    setPickedFiles(a => {
      if (a.includes(hash)) {
        return a.filter(a => a !== hash);
      } else {
        return [...a, hash];
      }
    });
  }

  useEffect(() => {
    listFiles().catch(console.error);
  }, [servers.servers.length, login?.state?.version]);

  return (
    <div className="flex flex-col gap-4">
      <h3>
        <FormattedMessage defaultMessage="File List" />
      </h3>
      <div className="grid grid-cols-5 gap-4">
        {fileList.map(a => (
          <BlossomFile file={a} onClick={() => toggleFile(a)} checked={pickedFiles.includes(a.sha256)} />
        ))}
      </div>
      <PrimaryButton
        disabled={pickedFiles.length === 0}
        onClick={() => onPicked(fileList.filter(a => pickedFiles.includes(a.sha256)))}>
        <FormattedMessage defaultMessage="Select" />
      </PrimaryButton>
    </div>
  );
}

function BlossomFile({ file, checked, onClick }: { file: BlobDescriptor; checked: boolean; onClick: () => void }) {
  const mime = file.type;
  const url = file.url;
  const size = file.size;
  return (
    <div onClick={() => onClick()}>
      <div
        className="relative bg-layer-2 rounded-xl overflow-hidden aspect-video cursor-pointer hover:outline outline-layer-3"
        style={{
          backgroundImage: mime?.startsWith("image/") ? `url(${url})` : "",
          backgroundSize: "cover",
        }}>
        <div className="absolute w-full h-full opacity-0 bg-black hover:opacity-80 flex flex-col items-center justify-center gap-4">
          <div>
            {Number(size) > 1024 * 1024 && (
              <FormattedMessage
                defaultMessage="{n}MiB"
                values={{
                  n: <FormattedNumber value={Number(size) / 1024 / 1024} />,
                }}
              />
            )}
            {Number(size) < 1024 * 1024 && (
              <FormattedMessage
                defaultMessage="{n}KiB"
                values={{
                  n: <FormattedNumber value={Number(size) / 1024} />,
                }}
              />
            )}
          </div>
          {file.uploaded && <div>{new Date(file.uploaded * 1000).toLocaleString()}</div>}
        </div>
        <input type="checkbox" className="left-2 top-2 absolute" checked={checked} />
      </div>
    </div>
  );
}
