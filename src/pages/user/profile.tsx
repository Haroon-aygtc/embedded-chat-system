import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Shield, History, MessageSquare, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserProfileForm from "@/components/user/UserProfileForm";
import UserSecuritySettings from "@/components/user/UserSecuritySettings";
import UserSessionManager from "@/components/user/UserSessionManager";
import UserFeedback from "@/components/user/UserFeedback";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [showFeedback, setShowFeedback] = useState(false);

  // Mock user data
  const userData = {
    fullName: "John Doe",
    email: "john.doe@example.com",
    bio: "Product manager with a passion for AI and user experience.",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    notifyOnMessage: true,
    notifyOnMention: true,
    emailDigest: false,
  };

  // Mock security settings
  const securitySettings = {
    enableMFA: false,
    loginNotifications: true,
    sessionTimeout: "4hours",
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <UserFeedback onClose={() => setShowFeedback(false)} />
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Account Settings</h1>
        </div>
        <Button
          onClick={() => setShowFeedback(true)}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Send Feedback
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="p-4">
            <nav className="space-y-2">
              <Button
                variant={activeTab === "profile" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("profile")}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
              <Button
                variant={activeTab === "security" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("security")}
              >
                <Shield className="mr-2 h-4 w-4" />
                Security
              </Button>
              <Button
                variant={activeTab === "sessions" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("sessions")}
              >
                <History className="mr-2 h-4 w-4" />
                Sessions
              </Button>
            </nav>
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          {activeTab === "profile" && (
            <UserProfileForm initialData={userData} />
          )}

          {activeTab === "security" && (
            <UserSecuritySettings initialSettings={securitySettings} />
          )}

          {activeTab === "sessions" && <UserSessionManager />}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
