import { DefaultImgProxy, proxyImg } from "@snort/shared";

export default function useImgProxy() {
  return {
    proxy: (url: string, resize?: number, sha256?: string) => proxyImg(url, DefaultImgProxy, resize, sha256),
  };
}
