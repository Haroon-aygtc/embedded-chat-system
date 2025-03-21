import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar";
import DashboardHeader from "../DashboardHeader";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ui/error-boundary";
import { AdminProvider } from "@/context/AdminContext";

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AdminProvider>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader
            title="Admin Dashboard"
            username="Admin User"
            userAvatar="https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
            notificationCount={3}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
      <Toaster />
    </AdminProvider>
  );
};

export default AdminLayout;
