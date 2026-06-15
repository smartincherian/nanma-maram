# Chapel event badge image upload (with crop)

**Date:** 2026-06-15
**Status:** Approved design — ready for implementation plan

## Goal

Let an admin upload a custom image when creating/editing a chapel event. The
image replaces the small circular badge shown in the booking page header. When
no image is uploaded, the current default (`/images/chapel-banner.png`) is shown.

## Decisions

- **Image role:** Replaces the existing small circular badge in the booking
  page header (`SlotBookingEvent/index.jsx`, ~46–52px round avatar). Crop is
  square / round.
- **Storage:** Base64 data-URL stored directly on the `chapelEvents` Firestore
  document — **not** Firebase Storage. Rationale: the badge is tiny
  (~15–40KB after re-encode, well under Firestore's 1MB doc limit), the booking
  page already live-subscribes to the event doc via `onSnapshot` (image arrives
  for free), and the app has no auth so a writable Storage bucket would be an
  unnecessary public-write surface.
- **Crop library:** `react-easy-crop` — mobile/touch-friendly (pinch zoom),
  supports `cropShape="round"`, small footprint.
- **Input size cap:** 5 MB max input file. Non-image types rejected.

## Components

### 1. Dependency
Add `react-easy-crop` to `package.json`.

### 2. Crop + compress utility — `src/utils/chapelImage.js` (new)
- `getCroppedImageDataUrl(imageSrc, cropPixels)`:
  - Loads `imageSrc` into an `Image`.
  - Draws the cropped region (`cropPixels` from react-easy-crop's
    `onCropComplete`) onto a `<canvas>` sized **256×256**.
  - Returns `canvas.toDataURL("image/jpeg", 0.82)` — a ~15–40KB data-URL string.

### 3. Crop dialog — `src/pages/SlotEventAdmin/ImageCropDialog.jsx` (new)
- MUI `Dialog`.
- Body: `react-easy-crop` with `aspect={1}`, `cropShape="round"`; a zoom
  `Slider`; state for `crop`, `zoom`, and the latest `croppedAreaPixels`.
- Actions: **Cancel** (closes, discards) and **Use photo** (runs
  `getCroppedImageDataUrl`, returns the data URL to the parent via callback).
- Props: `open`, `imageSrc`, `onCancel`, `onConfirm(dataUrl)`.

### 4. EventForm changes — `src/pages/SlotEventAdmin/EventForm.jsx`
- New state: `const [image, setImage] = useState(event?.image || "")`.
- New state for the in-progress crop source: `const [cropSrc, setCropSrc] = useState("")`.
- New UI section (near heading/description):
  - Circular **preview** showing `image || "/images/chapel-banner.png"`.
  - "Upload image" button triggering a hidden `<input type="file" accept="image/*">`.
  - "Remove" button (shown only when `image` is non-empty) that sets `image` to `""`.
- File input `onChange` handler:
  - Reject if `!file.type.startsWith("image/")` → snackbar error.
  - Reject if `file.size > 5 * 1024 * 1024` → snackbar "Please choose an image under 5 MB."
  - Else read file to a data URL (`FileReader`), set `cropSrc`, open the dialog.
- Dialog `onConfirm(dataUrl)` → `setImage(dataUrl)`, clear `cropSrc`.
- Include `image` in the save `payload` (string, may be `""`).

### 5. Persistence — `src/firebase/chapel/events.js`
- No change required. `createEvent` / `updateEvent` already spread `...data`, so
  `image` is persisted on the `chapelEvents` doc. (`updateEvent` uses
  `{ merge: true }`; sending `image: ""` correctly clears a previously set image.)

### 6. Booking page — `src/pages/SlotBookingEvent/index.jsx`
- Line ~371: change `src="/images/chapel-banner.png"` →
  `src={event.image || "/images/chapel-banner.png"}`.

## Data flow

1. Admin picks file → validated (type + ≤5MB) → read to data URL.
2. Crop dialog → cropped + re-encoded to 256px JPEG data URL.
3. Stored in `EventForm` state `image`; saved into the `chapelEvents` doc on Save.
4. Booking page reads `event.image` from its live `onSnapshot` and renders it;
   falls back to the default banner when empty.

## Edge cases / notes

- "No image" is represented as empty string `""`, not `null`, keeping the
  Firestore `merge` clean and triggering the default-banner fallback.
- All uploads are re-encoded to 256px JPEG, so stored size is always tiny
  regardless of the source photo.
- Existing events without an `image` field render the default banner unchanged.

## Out of scope

- Larger/hero banner image (decided: badge only).
- Firebase Storage.
- Image management beyond a single per-event badge.
