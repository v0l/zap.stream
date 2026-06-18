export default function useImgProxy() {
  return {
    proxy: (url: string, _resize?: number, _sha256?: string) => url,
  }
}
