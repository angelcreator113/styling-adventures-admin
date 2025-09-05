// src/utils/functions.js
import { getApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

/** fx() → region-bound Functions instance */
export function fx() {
  const region = import.meta.env.VITE_FUNCTIONS_REGION || "us-central1";
  const f = getFunctions(getApp(), region);

  const useEmu =
    import.meta.env.DEV &&
    (import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === "false" ||
     import.meta.env.VITE_USE_EMULATORS === "false");

  if (useEmu) {
    // Accept either VITE_EMU_FUNCTIONS="127.0.0.1:5001" or VITE_FUNCTIONS_EMULATOR="http://127.0.0.1:5001"
    const raw =
      import.meta.env.VITE_EMU_FUNCTIONS ||
      import.meta.env.VITE_FUNCTIONS_EMULATOR ||
      "127.0.0.1:5001";
    const hostport = String(raw).replace(/^https?:\/\//, "");
    const [host, portStr] = hostport.split(":");
    const port = Number(portStr || 5001);
    connectFunctionsEmulator(f, host || "127.0.0.1", port);
  }
  return f;
}
