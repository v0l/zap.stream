import { CARD, USER_CARDS } from "@/const";
import { useLogin } from "@/hooks/login";
import { Login } from "@/index";
import { removeUndefined } from "@snort/shared";
import { TaggedNostrEvent, NostrLink } from "@snort/system";
import { SnortContext } from "@snort/system-react";
import { useContext, useState } from "react";
import { useIntl, FormattedMessage } from "react-intl";
import { DefaultButton } from "../buttons";
import Modal from "../modal";
import { CardDialog } from "./new-card";
import { CardType } from ".";

interface EditCardProps {
    card: CardType;
    cards: TaggedNostrEvent[];
}

export function EditCard({ card, cards }: EditCardProps) {
    const system = useContext(SnortContext);
    const login = useLogin();
    const [open, setOpen] = useState(false);
    const identifier = card.identifier;
    const tags = removeUndefined(cards.map(a => NostrLink.fromEvent(a).toEventTag()));
    const { formatMessage } = useIntl();

    async function editCard({ title, image, link, content }: CardType) {
        const pub = login?.publisher();
        if (pub) {
            const ev = await pub.generic(eb => {
                eb.kind(CARD).content(content).tag(["d", card.identifier]);
                if (title && title?.length > 0) {
                    eb.tag(["title", title]);
                }
                if (image && image?.length > 0) {
                    eb.tag(["image", image]);
                }
                if (link && link?.length > 0) {
                    eb.tag(["r", link]);
                }
                return eb;
            });
            console.debug(ev);
            await system.BroadcastEvent(ev);
            setOpen(false);
        }
    }

    async function onCancel() {
        const pub = login?.publisher();
        if (pub) {
            const newTags = tags.filter(t => !t[1].endsWith(`:${identifier}`));
            const userCardsEv = await pub.generic(eb => {
                eb.kind(USER_CARDS).content("");
                for (const tag of newTags) {
                    eb.tag(tag);
                }
                return eb;
            });

            console.debug(userCardsEv);
            await system.BroadcastEvent(userCardsEv);
            Login.setCards(newTags, userCardsEv.created_at);
            setOpen(false);
        }
    }

    return (<>
        <DefaultButton onClick={() => setOpen(true)}>
            <FormattedMessage defaultMessage="Edit" id="wEQDC6" />
        </DefaultButton>
        {open && <Modal id="edit-stream-card" onClose={() => setOpen(false)}>
            <CardDialog
                header={formatMessage({ defaultMessage: "Edit", id: 'wEQDC6' })}
                cta={formatMessage({ defaultMessage: "Save", id: 'jvo0vs' })}
                cancelCta={formatMessage({ defaultMessage: "Delete", id: "K3r6DQ" })}
                card={card}
                onSave={editCard}
                onCancel={onCancel}
            />
        </Modal>}
    </>
    );
}
