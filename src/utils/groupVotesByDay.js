const toLocalDateKey = (timestampMs) => {
  const d = new Date(timestampMs);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const groupVotesByDay = (votes = []) => {
  const days = new Map();

  votes.forEach((vote) => {
    const value = Number(vote?.value || 0);
    const name = String(vote?.voterName || "Anonymous").trim() || "Anonymous";
    const dateKey = toLocalDateKey(vote?.timestampMs || Date.now());

    if (!days.has(dateKey)) {
      days.set(dateKey, { totalValue: 0, totalCount: 0, voters: new Map() });
    }
    const day = days.get(dateKey);
    day.totalValue += value;
    day.totalCount += 1;

    const voter = day.voters.get(name) || { name, value: 0, count: 0 };
    voter.value += value;
    voter.count += 1;
    day.voters.set(name, voter);
  });

  return Array.from(days.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, day]) => ({
      date,
      totalValue: day.totalValue,
      totalCount: day.totalCount,
      voters: Array.from(day.voters.values()).sort(
        (a, b) => b.value - a.value
      ),
    }));
};
