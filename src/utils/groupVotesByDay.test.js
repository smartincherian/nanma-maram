import { groupVotesByDay } from "./groupVotesByDay";

const ms = (iso) => new Date(iso).getTime();

test("groups votes by local day, newest day first", () => {
  const votes = [
    { voterName: "Anna", value: 5, timestampMs: ms("2026-06-27T10:00:00") },
    { voterName: "Anna", value: 3, timestampMs: ms("2026-06-27T12:00:00") },
    { voterName: "Bea", value: 10, timestampMs: ms("2026-06-28T09:00:00") },
  ];

  const result = groupVotesByDay(votes);

  expect(result.map((d) => d.date)).toEqual(["2026-06-28", "2026-06-27"]);
});

test("aggregates per voter within a day, highest value first", () => {
  const votes = [
    { voterName: "Anna", value: 5, timestampMs: ms("2026-06-27T10:00:00") },
    { voterName: "Anna", value: 3, timestampMs: ms("2026-06-27T12:00:00") },
    { voterName: "Bea", value: 20, timestampMs: ms("2026-06-27T11:00:00") },
  ];

  const [day] = groupVotesByDay(votes);

  expect(day.totalValue).toBe(28);
  expect(day.totalCount).toBe(3);
  expect(day.voters).toEqual([
    { name: "Bea", value: 20, count: 1 },
    { name: "Anna", value: 8, count: 2 },
  ]);
});

test("returns empty array for no votes", () => {
  expect(groupVotesByDay([])).toEqual([]);
});
