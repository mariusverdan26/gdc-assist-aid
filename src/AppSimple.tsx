import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Test from "./pages/Test";

const AppSimple = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Test />} />
        <Route path="/test" element={<Test />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppSimple;
