import { NostrEvent } from "@snort/system";

export function findTag(e: NostrEvent | undefined, tag: string) {
    const maybeTag = e?.tags.find(evTag => {
        return evTag[0] === tag;
    });
    return maybeTag && maybeTag[1];
}