const FRENCH_ACCESS_TOKEN_KEY = "internarea_french_access_token";

export const saveFrenchAccessToken = (token: string) => {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(FRENCH_ACCESS_TOKEN_KEY, token);
  }
};

export const getFrenchAccessToken = () => {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(FRENCH_ACCESS_TOKEN_KEY) || "";
};

export const clearFrenchAccessToken = () => {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(FRENCH_ACCESS_TOKEN_KEY);
  }
};
