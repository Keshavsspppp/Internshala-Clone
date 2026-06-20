export type LoginEnvironment = {
  browser: string;
  operatingSystem: string;
  deviceType: "desktop" | "laptop" | "mobile";
};

const getBrowser = (userAgent: string) => {
  if (/edg/i.test(userAgent)) {
    return "Edge";
  }

  if (/opr|opera/i.test(userAgent)) {
    return "Opera";
  }

  if (/crios|chrome/i.test(userAgent)) {
    return "Chrome";
  }

  if (/firefox/i.test(userAgent)) {
    return "Firefox";
  }

  if (/safari/i.test(userAgent)) {
    return "Safari";
  }

  return "Unknown";
};

const getOperatingSystem = (userAgent: string) => {
  if (/windows/i.test(userAgent)) {
    return "Windows";
  }

  if (/android/i.test(userAgent)) {
    return "Android";
  }

  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return "iOS";
  }

  if (/mac os x/i.test(userAgent)) {
    return "macOS";
  }

  if (/linux/i.test(userAgent)) {
    return "Linux";
  }

  return "Unknown";
};

const getDeviceType = (userAgent: string): "desktop" | "laptop" | "mobile" => {
  const isMobileAgent = /android|iphone|ipad|ipod|mobile/i.test(userAgent);

  if (isMobileAgent) {
    return "mobile";
  }

  if (typeof window === "undefined") {
    return "desktop";
  }

  return window.innerWidth <= 1440 ? "laptop" : "desktop";
};

export const getLoginEnvironment = (): LoginEnvironment => {
  if (typeof window === "undefined") {
    return {
      browser: "Unknown",
      operatingSystem: "Unknown",
      deviceType: "desktop",
    };
  }

  const userAgent = window.navigator.userAgent || "";

  return {
    browser: getBrowser(userAgent),
    operatingSystem: getOperatingSystem(userAgent),
    deviceType: getDeviceType(userAgent),
  };
};
