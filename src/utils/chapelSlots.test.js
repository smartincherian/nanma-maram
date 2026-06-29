import dayjs from "dayjs";
import {
  formatDateKey,
  formatReservedDays,
  getReservedNames,
  getToday,
  isDateReservationComplete,
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

  describe("date-range scope", () => {
    // 30-min slots → keys run 00:00 … 23:30. The block is one continuous span
    // from (startDate + startSlotKey) to (endDate + endSlotKey), inclusive.
    const baseEvent = {
      slotMinutes: 30,
      dateReservations: [
        {
          id: "d1",
          reason: "Maintenance",
          startDate: "2026-06-16",
          endDate: "2026-06-18",
          startSlotKey: "06:00",
          endSlotKey: "07:00",
        },
      ],
    };

    it("locks from the start time onward on the start date", () => {
      const day = getReservedNames(baseEvent, "2026-06-16");
      expect(day["05:30"]).toBeUndefined();
      expect(day["06:00"]).toBe("Maintenance");
      expect(day["23:30"]).toBe("Maintenance");
    });

    it("locks the entire middle date of a multi-day block", () => {
      const day = getReservedNames(baseEvent, "2026-06-17");
      expect(day["00:00"]).toBe("Maintenance");
      expect(day["12:00"]).toBe("Maintenance");
      expect(day["23:30"]).toBe("Maintenance");
    });

    it("locks up to the end time on the end date", () => {
      const day = getReservedNames(baseEvent, "2026-06-18");
      expect(day["00:00"]).toBe("Maintenance");
      expect(day["07:00"]).toBe("Maintenance");
      expect(day["07:30"]).toBeUndefined();
    });

    it("spans midnight for an overnight block", () => {
      // Night Vigil: 26th 11:00 PM → 27th 3:00 AM (end slot key 02:30).
      const event = {
        slotMinutes: 30,
        dateReservations: [
          {
            id: "v1",
            reason: "Night Vigil",
            startDate: "2026-06-26",
            endDate: "2026-06-27",
            startSlotKey: "23:00",
            endSlotKey: "02:30",
          },
        ],
      };
      const night = getReservedNames(event, "2026-06-26");
      expect(night["22:30"]).toBeUndefined();
      expect(night["23:00"]).toBe("Night Vigil");
      expect(night["23:30"]).toBe("Night Vigil");
      expect(night["06:00"]).toBeUndefined();

      const morning = getReservedNames(event, "2026-06-27");
      expect(morning["00:00"]).toBe("Night Vigil");
      expect(morning["02:30"]).toBe("Night Vigil");
      expect(morning["03:00"]).toBeUndefined();
    });

    it("locks nothing on a date outside the range", () => {
      expect(getReservedNames(baseEvent, "2026-06-15")).toEqual({});
      expect(getReservedNames(baseEvent, "2026-06-19")).toEqual({});
    });

    it("skips date reservations when no date is given", () => {
      expect(getReservedNames(baseEvent)).toEqual({});
    });

    it("ignores entries with a blank reason or incomplete bounds", () => {
      const event = {
        slotMinutes: 30,
        dateReservations: [
          {
            id: "d1",
            reason: "   ",
            startDate: "2026-06-16",
            endDate: "2026-06-18",
            startSlotKey: "06:00",
            endSlotKey: "07:00",
          },
          {
            id: "d2",
            reason: "No end date",
            startDate: "2026-06-16",
            endDate: "",
            startSlotKey: "06:00",
            endSlotKey: "07:00",
          },
          {
            id: "d3",
            reason: "Start after end",
            startDate: "2026-06-18",
            endDate: "2026-06-16",
            startSlotKey: "06:00",
            endSlotKey: "07:00",
          },
        ],
      };
      expect(getReservedNames(event, "2026-06-17")).toEqual({});
    });

    it("lets a date reservation win over a weekday reservation on the same slot", () => {
      const event = {
        slotMinutes: 30,
        reservations: [
          { id: "r1", name: "Weekly", slotKeys: ["06:00"], days: [] },
        ],
        dateReservations: [
          {
            id: "d1",
            reason: "Special",
            startDate: "2026-06-16",
            endDate: "2026-06-18",
            startSlotKey: "06:00",
            endSlotKey: "06:00",
          },
        ],
      };
      expect(getReservedNames(event, "2026-06-17")["06:00"]).toBe("Special");
    });
  });
});

describe("isDateReservationComplete", () => {
  const valid = {
    reason: "Retreat",
    startDate: "2026-06-16",
    endDate: "2026-06-18",
    startSlotKey: "06:00",
    endSlotKey: "07:00",
  };

  it("accepts a fully specified, correctly ordered reservation", () => {
    expect(isDateReservationComplete(valid)).toBe(true);
  });

  it("accepts an overnight block where the end time reads earlier", () => {
    expect(
      isDateReservationComplete({
        reason: "Night Vigil",
        startDate: "2026-06-26",
        endDate: "2026-06-27",
        startSlotKey: "23:00",
        endSlotKey: "02:30",
      })
    ).toBe(true);
  });

  it("accepts a single-slot block (same date and time)", () => {
    expect(
      isDateReservationComplete({ ...valid, endDate: "2026-06-16", startSlotKey: "06:00", endSlotKey: "06:00" })
    ).toBe(true);
  });

  it("rejects when the combined start is after the combined end", () => {
    // Same day, end time before start time.
    expect(
      isDateReservationComplete({ ...valid, endDate: "2026-06-16", startSlotKey: "23:00", endSlotKey: "02:30" })
    ).toBe(false);
    // Start date after end date.
    expect(
      isDateReservationComplete({ ...valid, startDate: "2026-06-18", endDate: "2026-06-16" })
    ).toBe(false);
  });

  it("rejects missing reason or bounds", () => {
    expect(isDateReservationComplete({ ...valid, reason: "  " })).toBe(false);
    expect(isDateReservationComplete({ ...valid, startDate: "" })).toBe(false);
    expect(isDateReservationComplete({ ...valid, endSlotKey: "" })).toBe(false);
    expect(isDateReservationComplete(undefined)).toBe(false);
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
