import React from "react";
import UserSecuritySettings from "@/components/user/UserSecuritySettings";

const UserSecurityStoryboard = () => {
  // Mock security settings
  const securitySettings = {
    enableMFA: true,
    loginNotifications: true,
    sessionTimeout: "1hour",
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
        <UserSecuritySettings initialSettings={securitySettings} />
      </div>
    </div>
  );
};

export default UserSecurityStoryboard;
