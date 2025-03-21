import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Check, MessageSquare, Settings, Shield, X } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: () => void;
  actionLabel?: string;
}

interface UserOnboardingProps {
  onComplete: () => void;
  onSkip?: () => void;
  initialStep?: number;
}

const UserOnboarding = ({ 
  onComplete, 
  onSkip,
  initialStep = 0 
}: UserOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to the Chat Platform',
      description: 'This quick tour will help you get started with the key features of our platform.',
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your information and customize your avatar to personalize your experience.',
      icon: <Shield className="h-8 w-8 text-primary" />,
      action: () => { window.location.href = '/profile'; },
      actionLabel: 'Go to Profile',
    },
    {
      id: 'settings',
      title: 'Configure Your Settings',
      description: 'Set up your notification preferences and security options.',
      icon: <Settings className="h-8 w-8 text-primary" />,
      action: () => { window.location.href = '/settings'; },
      actionLabel: 'Go to Settings',
    },
    {
      id: 'complete',
      title: 'You're All Set!',
      description: 'You've completed the onboarding process. You can now start using the platform.',
      icon: <Check className="h-8 w-8 text-primary" />,
    },
  ];

  const markStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const handleNext = () => {
    const currentStepId = steps[currentStep].id;
    markStepComplete(currentStepId);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const handleStepAction = () => {
    const step = steps[currentStep];
    if (step.action) {
      markStepComplete(step.id);
      step.action();
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2" 
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex justify-center mb-4">
            {currentStepData.icon}
          </div>
          <CardTitle className="text-center">{currentStepData.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            {currentStepData.description}
          </p>
          
          <div className="flex justify-center mt-6 space-x-1">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`h-2 w-12 rounded-full transition-colors ${index === currentStep ? 'bg-primary' : completedSteps.includes(step.id) ? 'bg-primary/40' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="ghost" 
            onClick={handleSkip}
          >
            Skip Tour
          </Button>
          <div className="space-x-2">
            {currentStepData.action && (
              <Button 
                variant="outline" 
                onClick={handleStepAction}
              >
                {currentStepData.actionLabel || 'Take Action'}
              </Button>
            )}
            <Button 
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : 'Finish'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UserOnboarding;
