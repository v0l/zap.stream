export function makeUploadKey(file: { id: string; size: number }, server: string, type: "video" | "thumb") {
  return `${file.id}:${file.size}:${server}:${type}`
}
