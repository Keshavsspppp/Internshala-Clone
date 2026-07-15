import Footer from "@/Components/Fotter";
import Navbar from "@/Components/Navbar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import type { ReactNode } from "react";
import { store } from "../store/store";
import { Provider, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "@/firebase/firebase";
import { login, logout } from "@/Feature/Userslice";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  clearPendingOtpSession,
  clearVerifiedSession,
  getVerifiedSession,
} from "@/utils/securitySession";
import { appWithTranslation } from "next-i18next/pages";
import { useRouter } from "next/router";
import { getFrenchAccessToken } from "@/utils/languageAccess";

function LocaleAccessGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(router.locale === "fr");

  useEffect(() => {
    if (router.locale !== "fr") {
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      try {
        const languageAccessToken = getFrenchAccessToken();
        if (!currentUser || !languageAccessToken) {
          await router.replace(router.pathname, router.asPath, { locale: "en" });
          return;
        }
        const idToken = await currentUser.getIdToken();
        const verifiedSession = getVerifiedSession();
        if (!verifiedSession?.sessionToken) {
          await router.replace(router.pathname, router.asPath, { locale: "en" });
          return;
        }
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/security/validate-lang-access`,
          { languageAccessToken },
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "X-InternArea-Session": verifiedSession.sessionToken,
            },
          }
        );
      } catch (error) {
        await router.replace(router.pathname, router.asPath, { locale: "en" });
      } finally {
        setIsChecking(false);
      }
    });

    return () => unsubscribe();
  }, [router.locale, router.pathname, router.asPath]);

  if (isChecking) {
    return <div className="min-h-screen bg-white" />;
  }
  return <>{children}</>;
}

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      async (config) => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            const token = await currentUser.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
            const verifiedSession = getVerifiedSession();
            if (verifiedSession?.sessionToken) {
              config.headers["X-InternArea-Session"] = verifiedSession.sessionToken;
            }
          } catch (e) {
            console.error("Error retrieving Firebase ID token:", e);
          }
        } else {
          const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
          if (adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  function AuthListener() {
    const dispatch = useDispatch();
    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(async (authuser) => {
        if (authuser) {
          const verifiedSession = getVerifiedSession();

          if (verifiedSession?.uid === authuser.uid && verifiedSession.sessionToken) {
            try {
              const idToken = await authuser.getIdToken();
              await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/security/session`, {
                headers: {
                  Authorization: `Bearer ${idToken}`,
                  "X-InternArea-Session": verifiedSession.sessionToken,
                },
              });
            } catch (error) {
              clearVerifiedSession();
              dispatch(logout());
              return;
            }
            dispatch(
              login({
                uid: authuser.uid,
                photo: verifiedSession.photo || authuser.photoURL,
                name: verifiedSession.name || authuser.displayName,
                email: verifiedSession.email || authuser.email,
                phoneNumber: verifiedSession.phoneNumber || authuser.phoneNumber,
              })
            );
          } else {
            dispatch(logout());
          }
        } else {
          clearVerifiedSession();
          clearPendingOtpSession();
          dispatch(logout());
        }
      });

      return () => unsubscribe();
    }, [dispatch]);
    return null;
  }

  return (
    <Provider store={store}>
      <AuthListener />
      <LocaleAccessGuard>
        {["/404", "/_error"].includes(router.pathname) ? (
          <Component {...pageProps} />
        ) : (
          <div className="bg-white">
            <ToastContainer/>
            <Navbar />
            <Component {...pageProps} />
            <Footer />
          </div>
        )}
      </LocaleAccessGuard>
    </Provider>
  );
}

export default appWithTranslation(App);
