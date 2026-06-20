import Footer from "@/Components/Fotter";
import Navbar from "@/Components/Navbar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { store } from "../store/store";
import { Provider, useDispatch } from "react-redux";
import { useEffect } from "react";
import { auth } from "@/firebase/firebase";
import { login, logout } from "@/Feature/Userslice";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  clearPendingOtpSession,
  clearVerifiedSession,
  getVerifiedSession,
} from "@/utils/securitySession";
export default function App({ Component, pageProps }: AppProps) {
  function AuthListener() {
    const dispatch = useDispatch();
    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((authuser) => {
        if (authuser) {
          const verifiedSession = getVerifiedSession();

          if (verifiedSession?.uid === authuser.uid) {
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
      <div className="bg-white">
        <ToastContainer/>
        <Navbar />
        <Component {...pageProps} />
        <Footer />
      </div>
    </Provider>
  );
}
