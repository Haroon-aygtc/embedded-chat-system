import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Home from "../components/home";
import Dashboard from "../pages/admin/dashboard";
import LoginPage from "../pages/auth/login";
import SignupPage from "../pages/auth/signup";
import ForgotPasswordPage from "../pages/auth/forgot-password";
import ResetPasswordPage from "../pages/auth/reset-password";
import ChatPage from "../pages/chat";
import ChatEmbedPage from "../pages/chat-embed";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AdminRoute from "../components/auth/AdminRoute";
import ApiKeysPage from "../pages/admin/api-keys";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/reset-password/:resetToken"
        element={<ResetPasswordPage />}
      />

      {/* Chat routes */}
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/chat-embed" element={<ChatEmbedPage />} />

      {/* Admin routes */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/api-keys"
        element={
          <AdminRoute>
            <ApiKeysPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <Navigate to="/admin/dashboard" replace />
          </AdminRoute>
        }
      />

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
