import "./file-uploader.css";
import type { ChangeEvent } from "react";
import { VoidApi } from "@void-cat/api";
import { useState } from "react";
import { FormattedMessage } from "react-intl";

const voidCatHost = "https://void.cat";
const fileExtensionRegex = /\.([\w]{1,7})$/i;
const voidCatApi = new VoidApi(voidCatHost);

type UploadResult = {
  url?: string;
  error?: string;
};

async function voidCatUpload(file: File | Blob): Promise<UploadResult> {
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
  defaultImage?: string;
  onClear(): void;
  onFileUpload(url: string): void;
}

export function FileUploader({ defaultImage, onClear, onFileUpload }: FileUploaderProps) {
  const [img, setImg] = useState<string>(defaultImage ?? "");
  const [isUploading, setIsUploading] = useState(false);

  async function onFileChange(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files && ev.target.files[0];
    if (file) {
      try {
        setIsUploading(true);
        const upload = await voidCatUpload(file);
        if (upload.url) {
          setImg(upload.url);
          onFileUpload(upload.url);
        }
        if (upload.error) {
          console.error(upload.error);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsUploading(false);
      }
    }
  }

  function clearImage() {
    setImg("");
    onClear();
  }

  return (
    <div className="file-uploader-container">
      <label className="file-uploader">
        <input type="file" onChange={onFileChange} />
        {isUploading ? <FormattedMessage defaultMessage="Uploading..." /> : <FormattedMessage defaultMessage="Add File" />}
      </label>
      <div className="file-uploader-preview">
        {img?.length > 0 && (
          <button className="btn btn-primary clear-button" onClick={clearImage}>
            <FormattedMessage defaultMessage="Clear" />
          </button>
        )}
        {img && <img className="image-preview" src={img} />}
      </div>
    </div>
  );
}
