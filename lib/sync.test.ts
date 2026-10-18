import { describe, expect, it } from "vitest";
import { emptyData } from "@/store/state";
import {
  FIRST_SYNC_TIME,
  collectChanges,
  confirmPushed,
  firstSyncOutbox,
  hashJson,
  mergeRemote,
  recordKey,
  setRecord,
  stableJson,
  toBase,
  toRecordMap,
  toRemoteRecords,
  type RemoteRecord,
} from "./sync";
import type { TopicRecord } from "./topics";

const topic = (id: string, name: string): TopicRecord => ({
  id,
  areaId: "mat",
  subjectId: null,
  name,
  description: "",
  priority: "media",
  hidden: false,
});

const remote = (record: Partial<RemoteRecord> & Pick<RemoteRecord, "collection" | "id">): RemoteRecord => ({
  data: null,
  deleted: false,
  updatedAt: "2026-10-18T12:00:00.000Z",
  ...record,
});

describe("stableJson", () => {
  it("ignores key order", () => {
    expect(stableJson({ b: 1, a: { d: 2, c: [3] } })).toBe(stableJson({ a: { c: [3], d: 2 }, b: 1 }));
  });
});

describe("toRecordMap", () => {
  it("has one record per item, per topic progress and per synced setting", () => {
    const data = { ...emptyData(), topics: [topic("custom-1", "Funções")], progress: { "custom-1": { status: "and" as const, mastery: 1 as const, reviews: [] } } };
    const map = toRecordMap(data);
    expect(Object.keys(map)).toEqual(
      expect.arrayContaining([recordKey("topics", "custom-1"), recordKey("progress", "custom-1"), recordKey("ajustes", "goal"), recordKey("ajustes", "planner")]),
    );
    expect(Object.keys(map).some((key) => key.includes("timer") || key.includes("theme"))).toBe(false);
  });
});

describe("setRecord", () => {
  it("adds, replaces and removes list items keeping the order", () => {
    let data = { ...emptyData(), topics: [topic("a", "A"), topic("b", "B")] };
    data = setRecord(data, "topics", "a", topic("a", "A2"));
    data = setRecord(data, "topics", "c", topic("c", "C"));
    data = setRecord(data, "topics", "b", null);
    expect(data.topics.map((item) => item.name)).toEqual(["A2", "C"]);
  });

  it("ignores settings it does not know and never deletes a setting", () => {
    const data = emptyData();
    expect(setRecord(data, "ajustes", "novidade", 1)).toBe(data);
    expect(setRecord(data, "ajustes", "goal", null).goal).toEqual(data.goal);
    expect(setRecord(data, "ajustes", "goal", { type: "sessoes", value: 9 }).goal).toEqual({ type: "sessoes", value: 9 });
  });
});

describe("collectChanges", () => {
  const before = toBase(toRecordMap({ ...emptyData(), topics: [topic("a", "A"), topic("b", "B")] }));
  const after = toRecordMap({ ...emptyData(), topics: [topic("a", "A editado"), topic("c", "C")] });

  it("records edits, new items and deletions with the time they were seen", () => {
    const outbox = collectChanges(before, after, {}, "t1");
    expect(outbox[recordKey("topics", "a")]).toEqual({ value: topic("a", "A editado"), changedAt: "t1" });
    expect(outbox[recordKey("topics", "c")].changedAt).toBe("t1");
    expect(outbox[recordKey("topics", "b")]).toEqual({ value: null, changedAt: "t1" });
    expect(Object.keys(outbox)).toHaveLength(3);
  });

  it("keeps the original time of a change still pending and drops changes that were undone", () => {
    const first = collectChanges(before, after, {}, "t1");
    const undone = toRecordMap({ ...emptyData(), topics: [topic("a", "A"), topic("b", "B"), topic("c", "C")] });
    const second = collectChanges(before, undone, first, "t2");
    expect(Object.keys(second)).toEqual([recordKey("topics", "c")]);
    expect(second[recordKey("topics", "c")].changedAt).toBe("t1");
  });
});

describe("mergeRemote", () => {
  const key = recordKey("topics", "a");

  it("applies records from other devices and updates the base", () => {
    const result = mergeRemote(emptyData(), { base: {}, outbox: {} }, [remote({ collection: "topics", id: "a", data: topic("a", "Da nuvem") })]);
    expect(result.data.topics).toEqual([topic("a", "Da nuvem")]);
    expect(result.base[key]).toBe(hashJson(stableJson(topic("a", "Da nuvem"))));
  });

  it("keeps a local change made after the remote one", () => {
    const data = { ...emptyData(), topics: [topic("a", "Local")] };
    const outbox = { [key]: { value: topic("a", "Local"), changedAt: "2026-10-18T13:00:00.000Z" } };
    const result = mergeRemote(data, { base: {}, outbox }, [remote({ collection: "topics", id: "a", data: topic("a", "Remoto") })]);
    expect(result.data.topics[0].name).toBe("Local");
    expect(result.outbox[key]).toBeDefined();
    expect(result.base[key]).toBe(hashJson(stableJson(topic("a", "Remoto"))));
  });

  it("drops an older local change and lets the cloud win ties", () => {
    const data = { ...emptyData(), topics: [topic("a", "Local")] };
    for (const changedAt of ["2026-10-18T11:00:00.000Z", "2026-10-18T12:00:00.000Z"]) {
      const result = mergeRemote(data, { base: {}, outbox: { [key]: { value: topic("a", "Local"), changedAt } } }, [
        remote({ collection: "topics", id: "a", data: topic("a", "Remoto") }),
      ]);
      expect(result.data.topics[0].name).toBe("Remoto");
      expect(result.outbox[key]).toBeUndefined();
    }
  });

  it("returns the same data when the cloud only repeats what the device already has", () => {
    const data = { ...emptyData(), topics: [topic("a", "A")] };
    const sync = { base: toBase(toRecordMap(data)), outbox: {} };
    const result = mergeRemote(data, sync, [remote({ collection: "topics", id: "a", data: topic("a", "A") }), remote({ collection: "topics", id: "x", deleted: true })]);
    expect(result.data).toBe(data);
  });

  it("removes records deleted on another device", () => {
    const data = { ...emptyData(), topics: [topic("a", "A")], progress: { a: { status: "nao" as const, mastery: 0 as const, reviews: [] } } };
    const result = mergeRemote(data, { base: toBase(toRecordMap(data)), outbox: {} }, [
      remote({ collection: "topics", id: "a", deleted: true }),
      remote({ collection: "progress", id: "a", deleted: true }),
    ]);
    expect(result.data.topics).toEqual([]);
    expect(result.data.progress).toEqual({});
    expect(result.base[key]).toBeUndefined();
  });
});

describe("first sync", () => {
  it("merges device and account data without losing either, and the account wins on the same record", () => {
    const device = { ...emptyData(), topics: [topic("a", "Do aparelho"), topic("b", "Só no aparelho")], goal: { type: "horas" as const, value: 10 } };
    const outbox = firstSyncOutbox(toRecordMap(device));
    expect(Object.values(outbox).every((change) => change.changedAt === FIRST_SYNC_TIME)).toBe(true);

    const result = mergeRemote(device, { base: {}, outbox }, [
      remote({ collection: "topics", id: "a", data: topic("a", "Da conta") }),
      remote({ collection: "topics", id: "z", data: topic("z", "Só na conta") }),
      remote({ collection: "ajustes", id: "goal", data: { type: "horas", value: 30 } }),
    ]);
    expect(result.data.topics.map((item) => item.name)).toEqual(["Da conta", "Só no aparelho", "Só na conta"]);
    expect(result.data.goal.value).toBe(30);
    expect(result.outbox[recordKey("topics", "b")]).toBeDefined();
    expect(result.outbox[recordKey("topics", "a")]).toBeUndefined();
  });
});

describe("confirmPushed", () => {
  it("moves pushed changes to the base and keeps edits made while sending", () => {
    const pushed = { "topics:a": { value: topic("a", "A"), changedAt: "t1" }, "topics:b": { value: null, changedAt: "t1" } };
    const outbox = { ...pushed, "topics:a": { value: topic("a", "A de novo"), changedAt: "t2" } };
    const result = confirmPushed({ base: { "topics:b": hashJson(stableJson(topic("b", "B"))) }, outbox }, pushed);
    expect(result.base).toEqual({ "topics:a": hashJson(stableJson(topic("a", "A"))) });
    expect(Object.keys(result.outbox)).toEqual(["topics:a"]);
  });
});

describe("toRemoteRecords", () => {
  it("turns pending changes into rows, with deletions marked", () => {
    expect(toRemoteRecords({ "progress:mat-3": { value: null, changedAt: "t1" } })).toEqual([
      { collection: "progress", id: "mat-3", data: null, deleted: true, updatedAt: "t1" },
    ]);
  });
});
