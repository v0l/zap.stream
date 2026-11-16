import { GlobalRegistrator } from "@happy-dom/global-registrator"

if (!GlobalRegistrator.isRegistered) {
  const socket = globalThis.WebSocket
  GlobalRegistrator.register()
  // DOM tests use the runtime's real WebSocket for loopback protocol fixtures.
  globalThis.WebSocket = socket
}
