import React from "react";
import UserSessionManager from "@/components/user/UserSessionManager";

const UserSessionStoryboard = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Active Sessions</h1>
        <UserSessionManager />
      </div>
    </div>
  );
};

export default UserSessionStoryboard;
