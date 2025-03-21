import React, { useState } from 'react';
import UserOnboarding from "@/components/user/UserOnboarding";
import { Button } from "@/components/ui/button";

const UserOnboardingStoryboard = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">User Onboarding Demo</h1>
        
        <div className="flex justify-center mb-8">
          <Button onClick={() => setShowOnboarding(true)}>
            Show Onboarding Flow
          </Button>
        </div>
        
        {showOnboarding && (
          <UserOnboarding 
            onComplete={() => setShowOnboarding(false)}
            onSkip={() => setShowOnboarding(false)}
          />
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium mb-4">About the Onboarding Flow</h2>
          <p className="text-gray-700 mb-4">
            This component demonstrates a step-by-step onboarding flow for new users. 
            It guides them through the key features of the platform and helps them 
            set up their account properly.
          </p>
          <p className="text-gray-700">
            Click the button above to see the onboarding flow in action. In a real 
            implementation, this would be shown automatically to new users after