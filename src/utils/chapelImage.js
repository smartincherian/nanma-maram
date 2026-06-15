// Crop + compress helper for the chapel event badge image.
//
// The admin's source photo can be up to 5MB, but it is never stored: we crop
// the selected region, redraw it onto a small landscape canvas, and export a
// JPEG data-URL (~15-40KB) that is saved directly on the chapelEvents document.

// Output size of the stored badge (4:3 landscape, matching the booking-page
// header). The booking page renders it ~100px wide, so 320x240 keeps it crisp
// on retina screens while staying tiny.
export const BADGE_ASPECT = 4 / 3;
const OUTPUT_WIDTH = 320;
const OUTPUT_HEIGHT = 240;
const JPEG_QUALITY = 0.82;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.src = src;
  });

// `cropPixels` is react-easy-crop's `croppedAreaPixels`
// ({ x, y, width, height } in source-image pixels).
export const getCroppedImageDataUrl = async (imageSrc, cropPixels) => {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    OUTPUT_WIDTH,
    OUTPUT_HEIGHT
  );

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
};
