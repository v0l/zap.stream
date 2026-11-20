import { expect, test } from "bun:test"
import { StreamState } from "@/const"
import { actionsFor, buildRescheduleRequest, buildScheduleRequest, isFutureStart, sortShows, toShow } from "./shows"

const starts = new Date("2030-01-02T20:00:00.000Z")

test("schedule request is a planned key with the event details and start", () => {
  expect(
    buildScheduleRequest({
      title: " Friday Jam ",
      summary: "Weekly set",
      image: "https://example.com/a.png",
      tags: ["music", " ", "live "],
      starts,
    }),
  ).toEqual({
    event: { title: "Friday Jam", summary: "Weekly set", image: "https://example.com/a.png", tags: ["music", "live"] },
    status: "planned",
    starts: "2030-01-02T20:00:00.000Z",
  })
})

test("schedule request leaves out empty optional fields", () => {
  expect(buildScheduleRequest({ title: "Solo", summary: "", image: " ", tags: [], starts })).toEqual({
    event: { title: "Solo" },
    status: "planned",
    starts: "2030-01-02T20:00:00.000Z",
  })
})

test("reschedule request plans the same stream id again", () => {
  expect(buildRescheduleRequest("abc", starts)).toEqual({
    id: "abc",
    status: "planned",
    starts: "2030-01-02T20:00:00.000Z",
  })
})

test("actions by show state", () => {
  expect(actionsFor(StreamState.Planned)).toEqual(["edit", "delete"])
  expect(actionsFor(StreamState.Live)).toEqual(["edit"])
  expect(actionsFor(StreamState.Ended)).toEqual(["reschedule", "edit", "delete"])
})

test("toShow reads state, title and start from the bound event", () => {
  const show = toShow({
    id: "7",
    created: 1,
    key: "k",
    stream_id: "sid",
    stream: {
      id: "e",
      pubkey: "p",
      kind: 30311,
      created_at: 1,
      content: "",
      sig: "",
      tags: [
        ["d", "sid"],
        ["title", "Friday Jam"],
        ["status", "ended"],
        ["starts", "1900000000"],
      ],
    },
  } as never)
  expect(show).toMatchObject({ keyId: "7", streamId: "sid", title: "Friday Jam", state: "ended", starts: 1900000000 })
})

test("planned shows sort soonest first after live ones, ended newest last", () => {
  const mk = (title: string, state: StreamState, s: number) => ({ keyId: title, key: title, title, state, starts: s })
  const sorted = sortShows([
    mk("old", StreamState.Ended, 1),
    mk("later", StreamState.Planned, 20),
    mk("now", StreamState.Live, 5),
    mk("soon", StreamState.Planned, 10),
    mk("recent", StreamState.Ended, 3),
  ])
  expect(sorted.map(s => s.title)).toEqual(["now", "soon", "later", "recent", "old"])
})

test("isFutureStart rejects empty and past values", () => {
  const now = new Date("2030-01-01T00:00:00Z")
  expect(isFutureStart("", now)).toBe(false)
  expect(isFutureStart("2029-12-31T10:00", now)).toBe(false)
  expect(isFutureStart("2030-01-02T10:00", now)).toBe(true)
})
