import React, { useCallback, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import Cropper from "react-easy-crop";
import { MARIAN, MARIAN_BUTTON_BG } from "../../utils/chapelTheme";
import { BADGE_ASPECT, getCroppedImageDataUrl } from "../../utils/chapelImage";

// 4:3 landscape crop dialog for the event badge. Returns a 320x240 JPEG
// data-URL via onConfirm; the heavy source image stays in browser memory.
const ImageCropDialog = ({ open, imageSrc, onCancel, onConfirm }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [working, setWorking] = useState(false);

  const handleCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  // Reset the view each time a fresh image opens.
  const handleEntering = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setWorking(true);
    try {
      const dataUrl = await getCroppedImageDataUrl(imageSrc, croppedAreaPixels);
      onConfirm(dataUrl);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      TransitionProps={{ onEntering: handleEntering }}
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: MARIAN.deep }}>
        Position the image
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: 280,
            borderRadius: 3,
            overflow: "hidden",
            background: "#1b2a4a",
          }}
        >
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={BADGE_ASPECT}
              cropShape="rect"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          ) : null}
        </Box>
        <Stack spacing={0.5} sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ color: MARIAN.inkSoft }}>
            Zoom
          </Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.01}
            onChange={(_e, value) => setZoom(value)}
            sx={{ color: MARIAN.blue }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={onCancel}
          sx={{ textTransform: "none", color: MARIAN.inkSoft }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={working || !croppedAreaPixels}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            borderRadius: 2.5,
            px: 3,
            background: MARIAN_BUTTON_BG,
          }}
        >
          {working ? "Saving…" : "Use photo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropDialog;
