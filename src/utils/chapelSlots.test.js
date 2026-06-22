import dayjs from "dayjs";
import {
  formatDateKey,
  formatReservedDays,
  getReservedNames,
  getToday,
  resolveDateParam,
  splitSlotsByElapsed,
} from "./chapelSlots";

describe("resolveDateParam", () => {
  it("returns null for a missing or unrecognised value", () => {
    expect(resolveDateParam("")).toBeNull();
    expect(resolveDateParam(undefined)).toBeNull();
    expect(resolveDateParam("someday")).toBeNull();
  });

  it("resolves 'today' to the IST current day", () => {
    expect(formatDateKey(resolveDateParam("today"))).toBe(
      formatDateKey(getToday())
    );
  });

  it("resolves 'tomorrow' to the next IST day (case/space-insensitive)", () => {
    const expected = formatDateKey(getToday().add(1, "day"));
    expect(formatDateKey(resolveDateParam("tomorrow"))).toBe(expected);
    expect(formatDateKey(resolveDateParam("  TOMORROW  "))).toBe(expected);
  });

  it("parses an explicit YYYY-MM-DD date", () => {
    expect(formatDateKey(resolveDateParam("2026-06-17"))).toBe("2026-06-17");
  });
});

describe("getReservedNames", () => {
  it("returns an empty map for a missing or empty event", () => {
    expect(getReservedNames(undefined)).toEqual({});
    expect(getReservedNames(null)).toEqual({});
    expect(getReservedNames({})).toEqual({});
    expect(getReservedNames({ reservations: [] })).toEqual({});
  });

  it("maps each reserved slot key to its reservation name", () => {
    const event = {
      reservations: [
        { id: "r1", name: "Fr. Thomas", slotKeys: ["06:00", "06:30"] },
        { id: "r2", name: "Sr. Mary", slotKeys: ["09:00"] },
      ],
    };
    expect(getReservedNames(event)).toEqual({
      "06:00": "Fr. Thomas",
      "06:30": "Fr. Thomas",
      "09:00": "Sr. Mary",
    });
  });

  it("lets the later entry win when two reservations share a slot key", () => {
    const event = {
      reservations: [
        { id: "r1", name: "First", slotKeys: ["06:00"] },
        { id: "r2", name: "Second", slotKeys: ["06:00"] },
      ],
    };
    expect(getReservedNames(event)["06:00"]).toBe("Second");
  });

  it("ignores entries with a blank or whitespace-only name", () => {
    const event = {
      reservations: [
        { id: "r1", name: "   ", slotKeys: ["06:00"] },
        { id: "r2", name: "", slotKeys: ["06:30"] },
        { id: "r3", name: "Real", slotKeys: ["07:00"] },
      ],
    };
    expect(getReservedNames(event)).toEqual({ "07:00": "Real" });
  });

  it("trims surrounding whitespace from names", () => {
    const event = {
      reservations: [{ id: "r1", name: "  Fr. Thomas  ", slotKeys: ["06:00"] }],
    };
    expect(getReservedNames(event)["06:00"]).toBe("Fr. Thomas");
  });

  describe("day-of-week scope", () => {
    // 2026-06-16 is a Tuesday; 2026-06-17 is a Wednesday.
    const tuesday = "2026-06-16";
    const wednesday = "2026-06-17";

    it("skips the day filter entirely when no date is given", () => {
      const event = {
        reservations: [
          { id: "r1", name: "Tue only", slotKeys: ["06:00"], days: [2] },
        ],
      };
      expect(getReservedNames(event)).toEqual({ "06:00": "Tue only" });
    });

    it("treats an empty days list as every day", () => {
      const event = {
        reservations: [
          { id: "r1", name: "Always", slotKeys: ["06:00"], days: [] },
        ],
      };
      expect(getReservedNames(event, tuesday)["06:00"]).toBe("Always");
      expect(getReservedNames(event, wednesday)["06:00"]).toBe("Always");
    });

    it("treats a missing days field as every day (back-compat)", () => {
      const event = {
        reservations: [{ id: "r1", name: "Legacy", slotKeys: ["06:00"] }],
      };
      expect(getReservedNames(event, tuesday)["06:00"]).toBe("Legacy");
      expect(getReservedNames(event, wednesday)["06:00"]).toBe("Legacy");
    });

    it("includes a slot only on a weekday in its days list", () => {
      const event = {
        reservations: [
          { id: "r1", name: "Tue only", slotKeys: ["06:00"], days: [2] },
        ],
      };
      expect(getReservedNames(event, tuesday)).toEqual({ "06:00": "Tue only" });
      expect(getReservedNames(event, wednesday)).toEqual({});
    });

    it("resolves the right names per date across mixed reservations", () => {
      const event = {
        reservations: [
          { id: "r1", name: "Tue", slotKeys: ["06:00"], days: [2] },
          { id: "r2", name: "Wed", slotKeys: ["06:00"], days: [3] },
          { id: "r3", name: "Daily", slotKeys: ["09:00"], days: [] },
        ],
      };
      expect(getReservedNames(event, tuesday)).toEqual({
        "06:00": "Tue",
        "09:00": "Daily",
      });
      expect(getReservedNames(event, wednesday)).toEqual({
        "06:00": "Wed",
        "09:00": "Daily",
      });
    });
  });
});

describe("splitSlotsByElapsed", () => {
  const slots = [
    { key: "14:00" },
    { key: "14:30" },
    { key: "15:00" },
    { key: "15:30" },
    { key: "16:00" },
  ];

  it("keeps the whole current hour upcoming (3:48 → 3 PM onwards)", () => {
    const date = dayjs("2026-06-19");
    const now = dayjs("2026-06-19 15:48");
    const { upcoming, elapsed } = splitSlotsByElapsed(slots, date, now);
    expect(elapsed.map((s) => s.key)).toEqual(["14:00", "14:30"]);
    expect(upcoming.map((s) => s.key)).toEqual(["15:00", "15:30", "16:00"]);
  });

  it("keeps the on-the-hour slot upcoming exactly at the top of the hour", () => {
    const date = dayjs("2026-06-19");
    const now = dayjs("2026-06-19 15:00");
    const { upcoming, elapsed } = splitSlotsByElapsed(slots, date, now);
    expect(elapsed.map((s) => s.key)).toEqual(["14:00", "14:30"]);
    expect(upcoming.map((s) => s.key)).toEqual(["15:00", "15:30", "16:00"]);
  });

  it("elapses a whole hour only once the next hour begins", () => {
    const date = dayjs("2026-06-19");
    const now = dayjs("2026-06-19 16:05");
    const { upcoming, elapsed } = splitSlotsByElapsed(slots, date, now);
    expect(elapsed.map((s) => s.key)).toEqual(["14:00", "14:30", "15:00", "15:30"]);
    expect(upcoming.map((s) => s.key)).toEqual(["16:00"]);
  });

  it("treats every slot as upcoming for a future date", () => {
    const date = dayjs("2026-06-20");
    const now = dayjs("2026-06-19 15:48");
    const { upcoming, elapsed } = splitSlotsByElapsed(slots, date, now);
    expect(elapsed).toEqual([]);
    expect(upcoming).toEqual(slots);
  });

  it("treats every slot as upcoming for a past date (only today elapses)", () => {
    const date = dayjs("2026-06-18");
    const now = dayjs("2026-06-19 15:48");
    const { upcoming, elapsed } = splitSlotsByElapsed(slots, date, now);
    expect(elapsed).toEqual([]);
    expect(upcoming).toEqual(slots);
  });
});

describe("formatReservedDays", () => {
  it("returns 'Every day' for empty or missing days", () => {
    expect(formatReservedDays([])).toBe("Every day");
    expect(formatReservedDays(undefined)).toBe("Every day");
  });

  it("lists short weekday names in Sunday-first order", () => {
    expect(formatReservedDays([4, 2])).toBe("Tue, Thu");
    expect(formatReservedDays([0, 6])).toBe("Sun, Sat");
  });
});
