import Copy from "@/element/copy";
import { IngestEndpoint } from "@/providers";
import { FormattedMessage } from "react-intl";

export default function StreamKey({ ep }: { ep: IngestEndpoint }) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="mb-2">
          <FormattedMessage defaultMessage="Server Url" />
        </p>
        <div className="flex bg-layer-2 rounded-xl pr-4">
          <input type="text" value={ep.url} disabled />
          <Copy text={ep.url} hideText={true} />
        </div>
      </div>
      <div>
        <p className="mb-2">
          <FormattedMessage defaultMessage="Stream Key" />
        </p>
        <div className="flex bg-layer-2 rounded-xl pr-4">
          <input type="password" value={ep?.key} disabled />
          <Copy text={ep.key} hideText={true} />
        </div>
      </div>
    </div>
  );
}
