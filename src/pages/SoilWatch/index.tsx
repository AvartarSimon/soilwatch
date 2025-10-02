import React from "react";
import { Route, Routes } from "react-router-dom";
import SoilWatchOverview from "./SoilWatchOverview";
import StringDetail from "./StringDetail";

const SoilWatch: React.FC = () => {
  return (
    <Routes>
      <Route index element={<SoilWatchOverview />} />
      <Route path="string/:stringId" element={<StringDetail />} />
    </Routes>
  );
};

export default SoilWatch;
