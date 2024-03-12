import { FormattedMessage, useIntl } from "react-intl";
import StepHeader from "./step-header";
import { DefaultButton } from "@/element/buttons";
import { DefaultProvider } from "@/providers";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileUploader } from "@/element/file-uploader";

export default function DashboardIntroStep1() {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const [title, setTitle] = useState<string>();
  const [summary, setDescription] = useState<string>();
  const [image, setImage] = useState<string>();

  useEffect(() => {
    DefaultProvider.info().then(i => {
      setTitle(i.streamInfo?.title ?? "");
      setDescription(i.streamInfo?.summary ?? "");
      setImage(i.streamInfo?.image ?? "");
    });
  }, []);

  return (
    <div className="mx-auto flex flex-col items-center">
      <StepHeader />
      <div className="flex flex-col gap-4 w-[30rem]">
        <h2 className="text-center">
          <FormattedMessage defaultMessage="Create Stream" />
        </h2>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={formatMessage({ defaultMessage: "Stream Title" })}
        />
        <input
          type="text"
          value={summary}
          onChange={e => setDescription(e.target.value)}
          placeholder={formatMessage({ defaultMessage: "Description" })}
        />
        {image && <img src={image} className="aspect-video rounded-xl object-cover" />}
        <div className="flex gap-2">
          <input
            type="text"
            value={image}
            onChange={e => setImage(e.target.value)}
            placeholder={formatMessage({ defaultMessage: "Cover image URL (optional)" })}
          />
          <FileUploader onResult={setImage} />
        </div>
        <small className="text-layer-4">
          <FormattedMessage defaultMessage="Recommended size: 1920x1080 (16:9)" />
        </small>
        <DefaultButton
          onClick={async () => {
            const newState = {
              title,
              summary,
              image,
            };
            await DefaultProvider.updateStream(newState);
            navigate("/dashboard/step-2", {
              state: newState,
            });
          }}>
          <FormattedMessage defaultMessage="Continue" />
        </DefaultButton>
      </div>
    </div>
  );
}
