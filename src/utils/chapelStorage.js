// Browser-local helpers for the chapel booking page:
//  - the user's last-entered field values (so the drawer pre-fills next time)
//  - the booking ids this browser created (so "delete my booking" is reliable
//    even when two people share the same display name)

const PROFILE_KEY = "chapelSlotProfile";
const MY_BOOKINGS_KEY = "chapelMyBookingIds";

const safeParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const getSavedProfile = () =>
  safeParse(localStorage.getItem(PROFILE_KEY), {});

export const saveProfile = (values) => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(values || {}));
  } catch {
    // ignore quota / privacy-mode errors
  }
};

export const clearProfile = () => {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    // ignore
  }
};

export const getMyBookingIds = () =>
  safeParse(localStorage.getItem(MY_BOOKINGS_KEY), []);

export const addMyBookingId = (id) => {
  const ids = new Set(getMyBookingIds());
  ids.add(id);
  try {
    localStorage.setItem(MY_BOOKINGS_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
};

export const removeMyBookingId = (id) => {
  const ids = getMyBookingIds().filter((existing) => existing !== id);
  try {
    localStorage.setItem(MY_BOOKINGS_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
};
