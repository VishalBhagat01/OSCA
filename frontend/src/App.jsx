import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import RunDetails from "./pages/RunDetails";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/runs/:id" element={<RunDetails />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;