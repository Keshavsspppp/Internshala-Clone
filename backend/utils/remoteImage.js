const DEFAULT_ALLOWED_IMAGE_HOSTS = [
  "res.cloudinary.com",
  "firebasestorage.googleapis.com",
  "googleusercontent.com",
];

const getAllowedImageHosts = () => [
  ...DEFAULT_ALLOWED_IMAGE_HOSTS,
  ...String(process.env.ALLOWED_RESUME_IMAGE_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
];

const isAllowedRemoteImageUrl = (value) => {
  if (!value) return false;
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:") return false;
    const hostname = url.hostname.toLowerCase();
    return getAllowedImageHosts().some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
};

module.exports = { isAllowedRemoteImageUrl };
