import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dash from "./Pages/Dashboard/Dash";
import Company from "./Pages/Company/Company";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dash />} />
          <Route path="/about" element={<Company />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
