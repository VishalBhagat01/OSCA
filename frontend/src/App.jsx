import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import History from "./pages/History";
import RunDetails from "./pages/RunDetails";


function App() {
    return (
        <div className="App">
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