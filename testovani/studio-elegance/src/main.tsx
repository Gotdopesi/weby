import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import { RootErrorBoundary } from "@/components/RootErrorBoundary";
import { RouterProvider } from "@/lib/router";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <StrictMode>
      <RouterProvider>
        <App />
        <Toaster />
        <Analytics />
      </RouterProvider>
    </StrictMode>
  </RootErrorBoundary>,
);
