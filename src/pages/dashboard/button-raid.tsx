import { NostrLink } from "@snort/system";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { DashboardRaidMenu } from "./raid-menu";
import { DefaultButton } from "@/element/buttons";
import Modal from "@/element/modal";

export function DashboardRaidButton({ link }: { link: NostrLink; }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <DefaultButton onClick={() => setShow(true)}>
        <FormattedMessage defaultMessage="Raid" id="4iBdw1" />
      </DefaultButton>
      {show && (
        <Modal id="raid-menu" onClose={() => setShow(false)}>
          <DashboardRaidMenu link={link} onClose={() => setShow(false)} />
        </Modal>
      )}
    </>
  );
}
