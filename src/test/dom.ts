import { GlobalRegistrator } from "@happy-dom/global-registrator"

if (!GlobalRegistrator.isRegistered) {
  const socket = globalThis.WebSocket
  GlobalRegistrator.register()
  globalThis.WebSocket = socket
}
