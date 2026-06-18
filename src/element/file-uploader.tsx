import { FormattedMessage } from "react-intl"
import { Layer2Button } from "./buttons"
import { openFile } from "@/utils"
import { Icon } from "./icon"
import { useMediaServerList } from "@/hooks/media-servers"
import { Blossom } from "@/service/upload"
import { useLogin } from "@/hooks/login"
import type { ReactNode } from "react"
import type { EventPublisher } from "@snort/system"

interface FileUploaderProps {
  onResult(url: string | undefined): void
  onError(e: Error): void
  children?: ReactNode
  className?: string
  publisher?: EventPublisher
  imageWidth?: number
  imageHeight?: number
}

export function FileUploader({
  onResult,
  onError,
  children,
  className,
  publisher,
  imageWidth,
  imageHeight,
}: FileUploaderProps) {
  const servers = useMediaServerList()
  const login = useLogin()
  const pub = publisher ?? login?.publisher?.()

  async function uploadFile(e: React.MouseEvent) {
    e.stopPropagation()
    const file = await openFile()
    if (file && pub) {
      try {
        const server = new Blossom(servers.servers[0], pub)
        const upload =
          imageWidth || imageHeight
            ? await server.uploadImage(file, imageWidth, imageHeight)
            : await server.upload(file)
        if (upload.url) {
          onResult(upload.url)
        }
      } catch (error) {
        if (error instanceof Error) {
          onError(error)
        } else {
          onError(new Error("Unknown error"))
        }
      }
    }
  }

  if (children) {
    return (
      <button type="button" onClick={uploadFile} className={className}>
        {children}
      </button>
    )
  }
  return (
    <Layer2Button onClick={uploadFile} className={className}>
      <FormattedMessage defaultMessage="Upload" />
      <Icon name="upload" size={14} />
    </Layer2Button>
  )
}
