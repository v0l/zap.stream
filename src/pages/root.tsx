import "./root.css";

import { useMemo } from "react";
import { EventKind, ParameterizedReplaceableNoteStore, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { System } from "..";
import { VideoTile } from "../element/video-tile";
import { findTag } from "utils";

export function RootPage() {
    const rb = new RequestBuilder("root");
    rb.withFilter()
        .kinds([30_311 as EventKind]);

    const feed = useRequestBuilder<ParameterizedReplaceableNoteStore>(System, ParameterizedReplaceableNoteStore, rb);
    const feedSorted = useMemo(() => {
        if (feed.data) {
            return [...feed.data].sort((a, b) => {
                const aStatus = findTag(a, "status")!;
                const bStatus = findTag(b, "status")!;
                if (aStatus === bStatus) {
                    return b.created_at - a.created_at;
                } else {
                    return aStatus === "live" ? -1 : 1;
                }
            });
        }
        return [];
    }, [feed.data])
    return <div className="video-grid">
        {feedSorted.map(e => <VideoTile ev={e} key={e.id} />)}
    </div>
}