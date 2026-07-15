const isChromeBrowserName = (browserName) =>
  String(browserName || "").toLowerCase().includes("chrome");

const resolveDeviceType = ({ serverDeviceType, reportedDeviceType }) => {
  const serverSaysMobile = ["mobile", "tablet"].includes(serverDeviceType);
  const reported = ["desktop", "laptop", "mobile"].includes(reportedDeviceType)
    ? reportedDeviceType
    : "desktop";
  if (serverSaysMobile || reported === "mobile") return "mobile";
  return reported === "laptop" ? "laptop" : "desktop";
};

module.exports = { isChromeBrowserName, resolveDeviceType };
