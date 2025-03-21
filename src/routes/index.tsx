import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../components/home";
import Dashboard from "../pages/admin/dashboard";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin/dashboard" element={<Dashboard />} />
      {/* Add more routes as needed */}
    </Routes>
  );
};

export default AppRoutes;
