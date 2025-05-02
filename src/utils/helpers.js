export const muiDateToTimestamp = (date) => {
  if (date) {
    const dateFormat = new Date(date);
    const timestampInMilliseconds = dateFormat.getTime();
    return timestampInMilliseconds;
  }
  return "";
};

export const muiDateToDdmmyyyy = (date) => {
  if (date) {
    const dateFormat = new Date(date);
    const day = String(dateFormat.getDate()).padStart(2, "0");
    const month = String(dateFormat.getMonth() + 1).padStart(2, "0");
    const year = dateFormat.getFullYear();
    return `${day}${month}${year}`;
  }
  return "";
};
