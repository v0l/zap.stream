export type AlertType = "zaps" | "views" | "top-zappers" | "music"

const Types: Array<AlertType> = ["zaps", "views", "top-zappers", "music"]

export function parseAlertPath(pathname: string): { id: string; type: AlertType } | undefined {
  const [, root, id, type] = pathname.split("/")
  if (root !== "alert" || !id || !Types.includes(type as AlertType)) return
  return { id: decodeURIComponent(id), type: type as AlertType }
}
