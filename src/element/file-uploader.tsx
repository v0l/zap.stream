import { VoidApi } from "@void-cat/api";
import { FormattedMessage } from "react-intl";
import { Layer2Button } from "./buttons";
import { openFile } from "@/utils";
import { Icon } from "./icon";

const voidCatHost = "https://void.cat";
const fileExtensionRegex = /\.([\w]{1,7})$/i;
const voidCatApi = new VoidApi(voidCatHost);

type UploadResult = {
  url?: string;
  error?: string;
};

async function voidCatUpload(file: File): Promise<UploadResult> {
  const uploader = voidCatApi.getUploader(file);

  const rsp = await uploader.upload({
    "V-Strip-Metadata": "true",
  });
  if (rsp.ok) {
    let ext = file.name.match(fileExtensionRegex);
    if (rsp.file?.metadata?.mimeType === "image/webp") {
      ext = ["", "webp"];
    }
    const resultUrl = rsp.file?.metadata?.url ?? `${voidCatHost}/d/${rsp.file?.id}${ext ? `.${ext[1]}` : ""}`;

    const ret = {
      url: resultUrl,
    } as UploadResult;

    return ret;
  } else {
    return {
      error: rsp.errorMessage,
    };
  }
}

interface FileUploaderProps {
  onResult(url: string | undefined): void;
}

export function FileUploader({ onResult }: FileUploaderProps) {
  async function uploadFile() {
    const file = await openFile();
    if (file) {
      try {
        const upload = await voidCatUpload(file);
        if (upload.url) {
          onResult(upload.url);
        }
        if (upload.error) {
          console.error(upload.error);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  return (
    <Layer2Button onClick={uploadFile}>
      <FormattedMessage defaultMessage="Upload" />
      <Icon name="upload" size={14} />
    </Layer2Button>
  );
}
