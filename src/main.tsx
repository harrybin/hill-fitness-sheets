import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import "@github/spark/spark";

import App from "./App.tsx";
import StatisticsPage from "./components/StatisticsPage";
import { AppProvider } from "./contexts/AppContext.tsx";
import { ErrorFallback } from "./ErrorFallback.tsx";
import { UpdatePrompt } from "./components/UpdatePrompt.tsx";

import "./main.css";
import "./styles/theme.css";
import "./index.css";

const root = createRoot(document.getElementById("root")!);

function render() {
  root.render(
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AppProvider>
        {window.location.hash === "#/statistiken" ? (
          <StatisticsPage />
        ) : (
          <App />
        )}
        <UpdatePrompt />
      </AppProvider>
    </ErrorBoundary>
  );
}

window.addEventListener("hashchange", render);
render();
