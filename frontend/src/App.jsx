import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import History from "./pages/History";
import RunDetails from "./pages/RunDetails";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0A0A0A] text-[#E8E8E3] flex flex-col">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#171717",
              color: "#E8E8E3",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.7)",
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
              padding: "10px 14px",
            },
            success: {
              iconTheme: {
                primary: "#F97316",
                secondary: "#171717",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#171717",
              },
            },
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