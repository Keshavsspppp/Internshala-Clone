const path = require("path");

const MEDIA_TYPES_BY_EXTENSION = Object.freeze({
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".gif": ["image/gif"],
  ".webp": ["image/webp"],
  ".mp4": ["video/mp4"],
  ".mov": ["video/quicktime"],
  ".webm": ["video/webm"],
  ".avi": ["video/x-msvideo", "video/avi"],
});

const parseAllowedMediaDataUrl = ({ name, dataUrl }) => {
  const extension = path.extname(String(name || "")).toLowerCase();
  const allowedMimeTypes = MEDIA_TYPES_BY_EXTENSION[extension];
  if (!allowedMimeTypes) {
    return { valid: false, message: "Only supported image and video files are allowed." };
  }

  const match = String(dataUrl || "").match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match || !allowedMimeTypes.includes(match[1].toLowerCase())) {
    return { valid: false, message: "The file extension does not match its media type." };
  }

  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length) return { valid: false, message: "The uploaded file is empty." };
  return { valid: true, buffer, extension, mimeType: match[1].toLowerCase() };
};

module.exports = { MEDIA_TYPES_BY_EXTENSION, parseAllowedMediaDataUrl };
