// src/AppShell.tsx
import { useEffect } from "react";
// Your hook is a DEFAULT export at src/hooks/useFanTheme.ts
import useFanTheme from "@/hooks/useFanTheme";

export default function AppShell({ children }: { children: React.ReactNode }) {
  // Optional: if your hook already applies CSS side-effects, you don’t need to do anything here.
  // Keeping this to ensure the hook is active high in the tree.
  useFanTheme();
  return <div className="app-shell">{children}</div>;
}
