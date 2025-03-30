import React from "react";
import AIConfiguration from "@/components/admin/AIConfiguration";
import { AdminProvider } from "@/context/AdminContext";

const AIConfigPage = () => {
  return (
    <AdminProvider>
      <div className="container mx-auto py-6">
        <AIConfiguration />
      </div>
    </AdminProvider>
  );
};

export default AIConfigPage;
