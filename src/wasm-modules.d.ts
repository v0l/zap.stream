declare module "*.wasm" {
  const url: string
  export default url
}

declare module "@snort/system-wasm/pkg/system_wasm_bg.wasm?url" {
  const url: string
  export default url
}
