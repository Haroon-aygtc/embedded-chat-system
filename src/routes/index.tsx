import React, { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Home from "../components/home";
import LoginPage from "../pages/auth/login";
import SignupPage from "../pages/auth/signup";
import ForgotPasswordPage from "../pages/auth/forgot-password";
import ResetPasswordPage from "../pages/auth/reset-password";
import ChatPage from "../pages/chat";
import ChatEmbedPage from "../pages/chat-embed";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AdminRoute from "../components/auth/AdminRoute";
import AdminLayout from "@/components/admin/layout/AdminLayout";

// Lazy-loaded admin components
const Dashboard = lazy(() => import("../pages/admin/dashboard"));
const ApiKeysPage = lazy(() => import("../pages/admin/api-keys"));
const ModerationQueue = lazy(
  () => import("../components/admin/ModerationQueue"),
);
const ModerationRules = lazy(
  () => import("../components/admin/ModerationRules"),
);
const UserManagement = lazy(() => import("../components/admin/UserManagement"));
const WidgetConfigurator = lazy(
  () => import("../components/admin/WidgetConfigurator"),
);
const ContextRulesEditor = lazy(
  () => import("../components/admin/ContextRulesEditor"),
);
const PromptTemplates = lazy(
  () => import("../components/admin/PromptTemplates"),
);
const EmbedCodeGenerator = lazy(
  () => import("../components/admin/EmbedCodeGenerator"),
);
const SystemSettings = lazy(() => import("../components/admin/SystemSettings"));

// Loading fallback
const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

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

      {/* Admin routes with shared layout */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="users"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <UserManagement />
            </Suspense>
          }
        />
        <Route
          path="widget-config"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <WidgetConfigurator />
            </Suspense>
          }
        />
        <Route
          path="context-rules"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ContextRulesEditor />
            </Suspense>
          }
        />
        <Route
          path="templates"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <PromptTemplates />
            </Suspense>
          }
        />
        <Route
          path="embed-code"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <EmbedCodeGenerator />
            </Suspense>
          }
        />
        <Route
          path="api-keys"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ApiKeysPage />
            </Suspense>
          }
        />
        <Route
          path="moderation/queue"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ModerationQueue />
            </Suspense>
          }
        />
        <Route
          path="moderation/rules"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ModerationRules />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <SystemSettings />
            </Suspense>
          }
        />
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
