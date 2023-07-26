import "./file-uploader.css";
import { VoidApi } from "@void-cat/api";
import { useState } from "react";

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
    const resultUrl =
      rsp.file?.metadata?.url ??
      `${voidCatHost}/d/${rsp.file?.id}${ext ? `.${ext[1]}` : ""}`;

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

export function FileUploader({ onFileUpload }) {
  const [img, setImg] = useState();
  const [isUploading, setIsUploading] = useState(false);

  async function onFileChange(ev) {
    const file = ev.target.files[0];
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

  return (
    <div className="file-uploader-container">
      <label className="file-uploader">
        <input type="file" onChange={onFileChange} />
        {isUploading ? "Uploading..." : "Add File"}
      </label>
      {img && <img className="image-preview" src={img} />}
    </div>
  );
}
