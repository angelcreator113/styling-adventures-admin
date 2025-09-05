import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { app } from "./init-firebase"; // adjust if your firebase init is elsewhere

let functions;

if (import.meta.env.VITE_USE_EMULATORS === "true") {
  functions = getFunctions(app, import.meta.env.VITE_FUNCTIONS_REGION);
  const [host, port] = import.meta.env.VITE_FUNCTIONS_EMULATOR.replace("http://", "").split(":");
  connectFunctionsEmulator(functions, host, Number(port));
} else {
  // In production → always use correct project + region
  functions = getFunctions(app, import.meta.env.VITE_FUNCTIONS_REGION, import.meta.env.VITE_FUNCTIONS_PROJECT);
}

export function callFn(name, data) {
  return httpsCallable(functions, name)(data);
}
