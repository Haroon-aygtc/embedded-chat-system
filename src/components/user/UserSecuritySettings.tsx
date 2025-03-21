import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, KeyRound, Shield, Smartphone } from "lucide-react";
import MFASetup from "@/components/auth/MFASetup";

const passwordFormSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Current password is required" }),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const securitySettingsSchema = z.object({
  enableMFA: z.boolean().default(false),
  loginNotifications: z.boolean().default(true),
  sessionTimeout: z.enum([
    "15min",
    "30min",
    "1hour",
    "4hours",
    "8hours",
    "never",
  ]),
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type SecuritySettingsValues = z.infer<typeof securitySettingsSchema>;

interface UserSecuritySettingsProps {
  initialSettings?: Partial<SecuritySettingsValues>;
  onPasswordChange?: (data: PasswordFormValues) => Promise<void>;
  onSecuritySettingsChange?: (data: SecuritySettingsValues) => Promise<void>;
}

const UserSecuritySettings = ({
  initialSettings,
  onPasswordChange,
  onSecuritySettingsChange,
}: UserSecuritySettingsProps) => {
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const { toast } = useToast();

  const defaultSettings: SecuritySettingsValues = {
    enableMFA: false,
    loginNotifications: true,
    sessionTimeout: "4hours",
    ...initialSettings,
  };

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const settingsForm = useForm<SecuritySettingsValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: defaultSettings,
  });

  const handlePasswordSubmit = async (data: PasswordFormValues) => {
    setIsPasswordLoading(true);
    try {
      if (onPasswordChange) {
        await onPasswordChange(data);
      } else {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update password. Please try again.",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleSettingsSubmit = async (data: SecuritySettingsValues) => {
    setIsSettingsLoading(true);
    try {
      if (onSecuritySettingsChange) {
        await onSecuritySettingsChange(data);
      } else {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      toast({
        title: "Settings updated",
        description: "Your security settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update security settings. Please try again.",
      });
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const handleMFAToggle = (checked: boolean) => {
    if (checked) {
      setShowMFASetup(true);
    } else {
      settingsForm.setValue("enableMFA", false);
      handleSettingsSubmit({
        ...settingsForm.getValues(),
        enableMFA: false,
      });
    }
  };

  const handleMFASetupComplete = (verified: boolean) => {
    setShowMFASetup(false);
    if (verified) {
      settingsForm.setValue("enableMFA", true);
      handleSettingsSubmit({
        ...settingsForm.getValues(),
        enableMFA: true,
      });
    }
  };

  return (
    <div className="space-y-8">
      {showMFASetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <MFASetup
            onComplete={handleMFASetupComplete}
            onCancel={() => setShowMFASetup(false)}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to maintain account security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Password must be at least 8 characters and include
                      uppercase, lowercase, and numbers.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPasswordLoading}>
                {isPasswordLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure additional security measures for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...settingsForm}>
            <form
              onSubmit={settingsForm.handleSubmit(handleSettingsSubmit)}
              className="space-y-6"
            >
              <FormField
                control={settingsForm.control}
                name="enableMFA"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <FormLabel className="text-base">
                          Two-Factor Authentication
                        </FormLabel>
                      </div>
                      <FormDescription>
                        Add an extra layer of security by requiring a code from
                        your phone
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={handleMFAToggle}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={settingsForm.control}
                name="loginNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Login Notifications
                      </FormLabel>
                      <FormDescription>
                        Receive email notifications when your account is
                        accessed from a new device
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={settingsForm.control}
                name="sessionTimeout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Timeout</FormLabel>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="15min">15 minutes</option>
                      <option value="30min">30 minutes</option>
                      <option value="1hour">1 hour</option>
                      <option value="4hours">4 hours</option>
                      <option value="8hours">8 hours</option>
                      <option value="never">Never</option>
                    </select>
                    <FormDescription>
                      Automatically log out after a period of inactivity
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Security Recommendation</AlertTitle>
                <AlertDescription>
                  For maximum security, we recommend enabling two-factor
                  authentication and setting a reasonable session timeout.
                </AlertDescription>
              </Alert>

              <Button type="submit" disabled={isSettingsLoading}>
                {isSettingsLoading ? "Saving..." : "Save Settings"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSecuritySettings;
