import React from "react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "../../../../src/pages/admin/dashboard";

export default function AdminDashboardDemo() {
  return (
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
}
