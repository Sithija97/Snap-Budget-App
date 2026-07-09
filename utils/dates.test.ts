import { describe, it, expect } from "vitest";
import { toISODate, groupByDate, todayISO, daysAgoISO } from "./dates";

describe("toISODate", () => {
  it("formats in local-timezone YYYY-MM-DD", () => {
    expect(toISODate(new Date(2026, 6, 8))).toBe("2026-07-08"); // month is 0-indexed
  });
});

describe("groupByDate", () => {
  it("labels today and yesterday, groups the rest by date", () => {
    const today = todayISO();
    const yesterday = daysAgoISO(1);
    const older = daysAgoISO(10);

    const txs = [
      { date: today, id: "1" },
      { date: today, id: "2" },
      { date: yesterday, id: "3" },
      { date: older, id: "4" },
    ];

    const groups = groupByDate(txs);

    expect(groups[0].label).toBe("Today");
    expect(groups[0].txs).toHaveLength(2);
    expect(groups[1].label).toBe("Yesterday");
    expect(groups[1].txs).toHaveLength(1);
    // older dates fall back to a short "Mon D" style label, not the raw ISO string
    expect(groups[2].label).not.toBe(older);
  });

  it("sorts groups newest-first", () => {
    const groups = groupByDate([
      { date: "2026-01-01", id: "a" },
      { date: "2026-06-01", id: "b" },
    ]);
    expect(groups[0].txs[0].id).toBe("b");
    expect(groups[1].txs[0].id).toBe("a");
  });
});
