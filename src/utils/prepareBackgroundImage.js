// Ensure a 16:9 image at 1280x720 with center-crop (no distortion).
// Returns: { blob, width: 1280, height: 720 }
export async function prepareBackgroundImage(
  file,
  {
    targetW = 1280,
    targetH = 720,
    mime = "image/jpeg",
    quality = 0.9, // 0–1 for JPEG/WebP
    mode = "cover", // "cover" (crop) | "contain" (letterbox)
    letterboxFill = "#000", // used if mode === "contain"
  } = {}
) {
  if (!file || !file.type?.startsWith?.("image/")) {
    throw new Error("Please provide an image file");
  }

  const bmp = await loadBitmap(file);
  const sw = bmp.width;
  const sh = bmp.height;
  const targetAR = targetW / targetH;
  const srcAR = sw / sh;

  // Create canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });

  canvas.width = targetW;
  canvas.height = targetH;

  if (mode === "contain") {
    // letterbox to 16:9 without cropping
    ctx.fillStyle = letterboxFill;
    ctx.fillRect(0, 0, targetW, targetH);
    const scale = Math.min(targetW / sw, targetH / sh);
    const dw = Math.round(sw * scale);
    const dh = Math.round(sh * scale);
    const dx = Math.round((targetW - dw) / 2);
    const dy = Math.round((targetH - dh) / 2);
    ctx.drawImage(bmp, 0, 0, sw, sh, dx, dy, dw, dh);
  } else {
    // cover: crop the source to 16:9, then scale to 1280x720
    let sx, sy, sW, sH;
    if (srcAR > targetAR) {
      // src is wider -> crop width
      sH = sh;
      sW = Math.round(sh * targetAR);
      sx = Math.round((sw - sW) / 2);
      sy = 0;
    } else {
      // src is taller -> crop height
      sW = sw;
      sH = Math.round(sw / targetAR);
      sx = 0;
      sy = Math.round((sh - sH) / 2);
    }
    ctx.drawImage(bmp, sx, sy, sW, sH, 0, 0, targetW, targetH);
  }

  const blob = await canvasToBlob(canvas, mime, quality);
  return { blob, width: targetW, height: targetH };
}

async function loadBitmap(file) {
  // Use createImageBitmap to automatically respect EXIF orientation (in modern browsers)
  if (window.createImageBitmap) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // fall through to HTMLImageElement
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImg(url);
    // Convert to bitmap to draw efficiently
    if (window.createImageBitmap) {
      try {
        return await createImageBitmap(img, { imageOrientation: "none" });
      } catch {
        // fallback to returning the HTMLImageElement (drawImage supports it)
        return img;
      }
    }
    return img;
  } finally {
    // revoke later if needed; safe to leave for GC on short-lived object URLs
    // URL.revokeObjectURL(url);
  }
}

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    if (canvas.toBlob) {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), mime, quality);
    } else {
      const dataURL = canvas.toDataURL(mime, quality);
      const b = dataURLToBlob(dataURL);
      b ? resolve(b) : reject(new Error("dataURL->Blob failed"));
    }
  });
}

function dataURLToBlob(dataURL) {
  const [header, data] = dataURL.split(",");
  const isBase64 = header.includes(";base64");
  const mime = (header.match(/data:(.*?)(;|$)/) || [])[1] || "image/jpeg";
  const byteString = isBase64 ? atob(data) : decodeURIComponent(data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new Blob([ab], { type: mime });
}
