import { GlobalRegistrator } from "@happy-dom/global-registrator"

if (!GlobalRegistrator.isRegistered) {
  const native = {
    WebSocket: globalThis.WebSocket,
    fetch: globalThis.fetch,
    Request: globalThis.Request,
    Response: globalThis.Response,
    Headers: globalThis.Headers,
  }
  GlobalRegistrator.register()
  Object.assign(globalThis, native)
}
