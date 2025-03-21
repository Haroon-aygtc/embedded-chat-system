import React from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function AuthDemo() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
