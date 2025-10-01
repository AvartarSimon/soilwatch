import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import DashboardLayout from "./components/DashboardLayout";
import SoilWatchOverview from "./pages/SoilWatch/SoilWatchOverview";
import StringDetail from "./pages/SoilWatch/StringDetail";

function App() {
  return (
    <div className="app">
      <BrowserRouter>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<SoilWatchOverview />} />
            <Route path="/soilwatch" element={<SoilWatchOverview />} />
            <Route path="/soilwatch/string/:stringId" element={<StringDetail />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </div>
  );
}

export default App;
