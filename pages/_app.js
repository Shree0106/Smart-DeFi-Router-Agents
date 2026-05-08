import toast, { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/react"
import "../styles/globals.css";

// Importing Contract
import { TokenICOProvider } from "../context/index";

export default function App({ Component, pageProps }) {
  // Suppress WELLDONE Wallet and hydration mismatch errors globally
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.error = (...args) => {
        // Filter out WELLDONE wallet and browser extension errors
        const message = args[0]?.toString() || "";
        if (
          message.includes("WELLDONE") ||
          message.includes("not initialized") ||
          message.includes("inject.js") ||
          message.includes("Hydration") ||
          message.includes("hydration") ||
          message.includes("did not match") ||
          message.includes("Text content does not match")
        ) {
          return; // Silently ignore
        }
        originalError.apply(console, args);
      };

      console.warn = (...args) => {
        // Filter out hydration warnings
        const message = args[0]?.toString() || "";
        if (
          message.includes("Hydration") ||
          message.includes("hydration") ||
          message.includes("did not match")
        ) {
          return; // Silently ignore
        }
        originalWarn.apply(console, args);
      };

      // Also suppress unhandled promise rejections from WELLDONE
      const handleRejection = (event) => {
        const message = event.reason?.message || event.reason?.toString() || "";
        if (
          message.includes("WELLDONE") ||
          message.includes("not initialized")
        ) {
          event.preventDefault(); // Prevent the error from being logged
        }
      };

      window.addEventListener("unhandledrejection", handleRejection);

      return () => {
        console.error = originalError;
        console.warn = originalWarn;
        window.removeEventListener("unhandledrejection", handleRejection);
      };
    }
  }, []);

  return (
    <>
      <TokenICOProvider>
        <Component {...pageProps} />
        <Toaster position="top-center" reverseOrder={false} />
      </TokenICOProvider>

      <script src="assets/js/jquery-3.5.1.min.js"></script>
      <script src="assets/js/bootstrap.bundle.min.js"></script>
      <script src="assets/js/wow.min.js"></script>
      <script src="assets/js/appear.js"></script>
      <script src="assets/js/jquery.magnific-popup.min.js"></script>
      <script src="assets/js/metisMenu.min.js"></script>
      <script src="assets/js/jquery.marquee.min.js"></script>
      <script src="assets/js/parallax-scroll.js"></script>
      <script src="assets/js/countdown.js"></script>
      <script src="assets/js/easing.min.js"></script>
      <script src="assets/js/scrollspy.js"></script>
      <script src="assets/js/main.js"></script>
    </>
  );
}
