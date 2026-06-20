export type VerifiedUserSession = {
  uid: string;
  name: string;
  email: string;
  photo?: string | null;
  phoneNumber?: string | null;
};

export type PendingOtpSession = {
  attemptId: string;
  uid: string;
  name: string;
  email: string;
  photo?: string | null;
  phoneNumber?: string | null;
  expiresAt?: string;
  developmentOtpPreview?: string | null;
};

const VERIFIED_SESSION_KEY = "internarea_verified_user";
const PENDING_OTP_KEY = "internarea_pending_otp";

const canUseStorage = () => typeof window !== "undefined";

export const saveVerifiedSession = (session: VerifiedUserSession) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(VERIFIED_SESSION_KEY, JSON.stringify(session));
};

export const getVerifiedSession = (): VerifiedUserSession | null => {
  if (!canUseStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(VERIFIED_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as VerifiedUserSession;
  } catch (error) {
    window.localStorage.removeItem(VERIFIED_SESSION_KEY);
    return null;
  }
};

export const clearVerifiedSession = () => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(VERIFIED_SESSION_KEY);
};

export const savePendingOtpSession = (session: PendingOtpSession) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(PENDING_OTP_KEY, JSON.stringify(session));
};

export const getPendingOtpSession = (): PendingOtpSession | null => {
  if (!canUseStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(PENDING_OTP_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as PendingOtpSession;
  } catch (error) {
    window.localStorage.removeItem(PENDING_OTP_KEY);
    return null;
  }
};

export const clearPendingOtpSession = () => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(PENDING_OTP_KEY);
};
