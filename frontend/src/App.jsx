import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import History from "./pages/History";
import RunDetails from "./pages/RunDetails";


function App() {
    return (
        <div className="App">
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#18181b',
                        color: '#fff',
                        border: '1px solid #27272a',
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
    );
}

export default App;