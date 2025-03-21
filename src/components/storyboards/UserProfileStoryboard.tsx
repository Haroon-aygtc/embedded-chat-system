import React from "react";
import UserProfileForm from "@/components/user/UserProfileForm";

const UserProfileStoryboard = () => {
  // Mock user data
  const userData = {
    fullName: "Jane Smith",
    email: "jane.smith@example.com",
    bio: "UX designer and AI enthusiast with a focus on creating intuitive user experiences.",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane",
    notifyOnMessage: true,
    notifyOnMention: true,
    emailDigest: true,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">User Profile</h1>
        <UserProfileForm initialData={userData} />
      </div>
    </div>
  );
};

export default UserProfileStoryboard;
