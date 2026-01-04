import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@github/spark/spark";

import App from "./App.tsx";
import { AppProvider } from "./contexts/AppContext.tsx";
import { ErrorFallback } from "./ErrorFallback.tsx";
import { UpdatePrompt } from "./components/UpdatePrompt.tsx";
import { MarkdownPage } from "./components/MarkdownPage.tsx";

import "./main.css";
import "./styles/theme.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route
            path="/DATENSCHUTZ.md"
            element={
              <MarkdownPage
                filePath="/DATENSCHUTZ.md"
                title="Datenschutzerklärung"
              />
            }
          />
          <Route
            path="/NUTZUNGSBEDINGUNGEN.md"
            element={
              <MarkdownPage
                filePath="/NUTZUNGSBEDINGUNGEN.md"
                title="Nutzungsbedingungen"
              />
            }
          />
        </Routes>
        <UpdatePrompt />
      </AppProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
