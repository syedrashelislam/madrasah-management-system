import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "./lib/queryClient";
import App from "./App.tsx";
import "./index.css";
import "./receipt.css";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    {/* Global toast container — supports both plain toast() and showToast() calls */}
    <Toaster
      position="top-right"
      toastOptions={{ duration: 3500 }}
      theme="dark"
      richColors
      closeButton={false}
      expand={false}
      visibleToasts={4}
      offset={16}
    />
  </QueryClientProvider>
);
