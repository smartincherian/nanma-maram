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

export const formatPhoneForWhatsApp = (phone) => {
  const digits = phone.replace(/\D/g, ""); // remove all non-digits

  // Add default country code (India: 91) if only 10 digits
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // Assume already includes country code if length > 10
  return digits;
};
