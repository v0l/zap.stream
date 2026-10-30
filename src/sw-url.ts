export function isClientAt(clientUrl: string, path: string, origin: string) {
  return clientUrl === new URL(path, origin).href
}
