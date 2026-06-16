import {
  formatDateKey,
  getReservedNames,
  getToday,
  resolveDateParam,
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
});
