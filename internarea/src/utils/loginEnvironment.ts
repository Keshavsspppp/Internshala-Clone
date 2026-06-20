import { UAParser } from "ua-parser-js";

export type LoginEnvironment = {
  browser: string;
  operatingSystem: string;
  deviceType: "desktop" | "laptop" | "mobile";
};

const classifyDeviceType = (
  uaResult: ReturnType<InstanceType<typeof UAParser>["getResult"]>
): "desktop" | "laptop" | "mobile" => {
  const deviceType = uaResult.device?.type;

  // ua-parser-js returns "mobile", "tablet", "smarttv", etc.
  if (deviceType === "mobile" || deviceType === "tablet") {
    return "mobile";
  }

  // Distinguish laptop vs desktop by screen width on client
  if (typeof window !== "undefined") {
    return window.innerWidth <= 1440 ? "laptop" : "desktop";
  }

  return "desktop";
};

export const getLoginEnvironment = (): LoginEnvironment => {
  if (typeof window === "undefined") {
    return {
      browser: "Unknown",
      operatingSystem: "Unknown",
      deviceType: "desktop",
    };
  }

  // ua-parser-js v2 uses named export + class constructor
  const parser = new UAParser(window.navigator.userAgent);
  const result = parser.getResult();

  const browserName = result.browser?.name || "Unknown";
  const osName = result.os?.name || "Unknown";
  const deviceType = classifyDeviceType(result);

  return {
    browser: browserName,
    operatingSystem: osName,
    deviceType,
  };
};
