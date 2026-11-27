import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import History from "./pages/History";
import RunDetails from "./pages/RunDetails";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col bg-ink text-bone">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "var(--color-ink-3)",
              color: "var(--color-bone)",
              border: "1px solid var(--color-rule-strong)",
              borderRadius: "12px",
              boxShadow: "0 20px 40px -12px rgb(0 0 0 / 0.7)",
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
              padding: "10px 14px",
            },
            success: { iconTheme: { primary: "var(--color-ember)", secondary: "var(--color-ink)" } },
            error: { iconTheme: { primary: "var(--color-madder)", secondary: "var(--color-ink)" } },
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/runs/:id" element={<RunDetails />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ErrorBoundary>
  );
}

export default App;
