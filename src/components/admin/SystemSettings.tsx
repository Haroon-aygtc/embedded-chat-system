import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Save,
  RefreshCw,
  Shield,
  Globe,
  Database,
  Mail,
  Server,
  Clock,
  FileText,
  CheckCircle,
} from "lucide-react";

// Define the form schema using zod
const generalSettingsSchema = z.object({
  siteName: z.string().min(1, { message: "Site name is required" }),
  siteDescription: z.string(),
  supportEmail: z.string().email({ message: "Invalid email address" }),
  logoUrl: z.string().url({ message: "Must be a valid URL" }).optional(),
  faviconUrl: z.string().url({ message: "Must be a valid URL" }).optional(),
  maintenanceMode: z.boolean().default(false),
  defaultLanguage: z.string(),
  timeZone: z.string(),
  dateFormat: z.string(),
  timeFormat: z.string(),
});

const securitySettingsSchema = z.object({
  enableMfa: z.boolean().default(false),
  sessionTimeout: z.number().min(5).max(1440),
  maxLoginAttempts: z.number().min(1).max(10),
  passwordPolicy: z.object({
    minLength: z.number().min(8).max(32),
    requireUppercase: z.boolean().default(true),
    requireLowercase: z.boolean().default(true),
    requireNumbers: z.boolean().default(true),
    requireSpecialChars: z.boolean().default(true),
    passwordExpiry: z.number().min(0).max(365),
  }),
  ipRestrictions: z.string(),
});

const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1, { message: "SMTP host is required" }),
  smtpPort: z.number().min(1).max(65535),
  smtpUsername: z.string(),
  smtpPassword: z.string(),
  smtpSecure: z.boolean().default(true),
  fromEmail: z.string().email({ message: "Invalid email address" }),
  fromName: z.string(),
});

const backupSettingsSchema = z.object({
  enableAutomaticBackups: z.boolean().default(true),
  backupFrequency: z.enum(["daily", "weekly", "monthly"]),
  backupTime: z.string(),
  retentionPeriod: z.number().min(1).max(365),
  backupLocation: z.enum(["local", "s3", "gcs"]),
  s3Bucket: z.string().optional(),
  s3Region: z.string().optional(),
  s3AccessKey: z.string().optional(),
  s3SecretKey: z.string().optional(),
});

const loggingSettingsSchema = z.object({
  logLevel: z.enum(["error", "warn", "info", "debug"]),
  enableAuditLogs: z.boolean().default(true),
  logRetention: z.number().min(1).max(365),
  enableErrorReporting: z.boolean().default(true),
  errorReportingEmail: z.string().email().optional(),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;
type SecuritySettingsValues = z.infer<typeof securitySettingsSchema>;
type EmailSettingsValues = z.infer<typeof emailSettingsSchema>;
type BackupSettingsValues = z.infer<typeof backupSettingsSchema>;
type LoggingSettingsValues = z.infer<typeof loggingSettingsSchema>;

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize forms with default values
  const generalForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: "Context-Aware Chat System",
      siteDescription: "Embeddable AI chat widget with context awareness",
      supportEmail: "support@example.com",
      logoUrl: "https://example.com/logo.png",
      faviconUrl: "https://example.com/favicon.ico",
      maintenanceMode: false,
      defaultLanguage: "en",
      timeZone: "UTC",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
    },
  });

  const securityForm = useForm<SecuritySettingsValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      enableMfa: false,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        passwordExpiry: 90,
      },
      ipRestrictions: "",
    },
  });

  const emailForm = useForm<EmailSettingsValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpHost: "smtp.example.com",
      smtpPort: 587,
      smtpUsername: "smtp_user",
      smtpPassword: "",
      smtpSecure: true,
      fromEmail: "no-reply@example.com",
      fromName: "Chat System",
    },
  });

  const backupForm = useForm<BackupSettingsValues>({
    resolver: zodResolver(backupSettingsSchema),
    defaultValues: {
      enableAutomaticBackups: true,
      backupFrequency: "daily",
      backupTime: "02:00",
      retentionPeriod: 30,
      backupLocation: "local",
      s3Bucket: "",
      s3Region: "",
      s3AccessKey: "",
      s3SecretKey: "",
    },
  });

  const loggingForm = useForm<LoggingSettingsValues>({
    resolver: zodResolver(loggingSettingsSchema),
    defaultValues: {
      logLevel: "info",
      enableAuditLogs: true,
      logRetention: 30,
      enableErrorReporting: true,
      errorReportingEmail: "",
    },
  });

  const onSubmitGeneral = async (data: GeneralSettingsValues) => {
    await handleSaveSettings("general", data);
  };

  const onSubmitSecurity = async (data: SecuritySettingsValues) => {
    await handleSaveSettings("security", data);
  };

  const onSubmitEmail = async (data: EmailSettingsValues) => {
    await handleSaveSettings("email", data);
  };

  const onSubmitBackup = async (data: BackupSettingsValues) => {
    await handleSaveSettings("backup", data);
  };

  const onSubmitLogging = async (data: LoggingSettingsValues) => {
    await handleSaveSettings("logging", data);
  };

  const handleSaveSettings = async (type: string, data: any) => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      // In a real implementation, this would save to your database
      console.log(`Saving ${type} settings:`, data);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error(`Error saving ${type} settings:`, error);
      setSaveError(`Failed to save ${type} settings. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmailConnection = async () => {
    // In a real implementation, this would test the SMTP connection
    console.log("Testing email connection...");
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    alert("Email connection successful!");
  };

  const handleTestBackupConnection = async () => {
    // In a real implementation, this would test the backup connection
    console.log("Testing backup connection...");
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    alert("Backup connection successful!");
  };

  const handleManualBackup = async () => {
    // In a real implementation, this would trigger a manual backup
    console.log("Triggering manual backup...");
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    alert("Manual backup completed successfully!");
  };

  return (
    <div className="p-6 bg-background">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure global system settings and preferences
          </p>
        </div>
      </div>

      {saveSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">
            Settings have been saved successfully.
          </AlertDescription>
        </Alert>
      )}

      {saveError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Backup</span>
          </TabsTrigger>
          <TabsTrigger value="logging" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Logging</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic system information and preferences
              </CardDescription>
            </CardHeader>
            <Form {...generalForm}>
              <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)}>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="siteName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            The name of your chat system
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="supportEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Email address for support inquiries
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={generalForm.control}
                    name="siteDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormDescription>
                          Brief description of your chat system
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            URL to your company logo
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="faviconUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Favicon URL</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            URL to your site favicon
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="defaultLanguage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Language</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                              <SelectItem value="ar">Arabic</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Default language for the system
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="timeZone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Zone</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time zone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="America/New_York">
                                Eastern Time (ET)
                              </SelectItem>
                              <SelectItem value="America/Chicago">
                                Central Time (CT)
                              </SelectItem>
                              <SelectItem value="America/Denver">
                                Mountain Time (MT)
                              </SelectItem>
                              <SelectItem value="America/Los_Angeles">
                                Pacific Time (PT)
                              </SelectItem>
                              <SelectItem value="Europe/London">
                                London (GMT)
                              </SelectItem>
                              <SelectItem value="Europe/Paris">
                                Paris (CET)
                              </SelectItem>
                              <SelectItem value="Asia/Dubai">
                                Dubai (GST)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Default time zone for dates and times
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="dateFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date Format</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select date format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MM/DD/YYYY">
                                MM/DD/YYYY
                              </SelectItem>
                              <SelectItem value="DD/MM/YYYY">
                                DD/MM/YYYY
                              </SelectItem>
                              <SelectItem value="YYYY-MM-DD">
                                YYYY-MM-DD
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Format for displaying dates
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="timeFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Format</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                              <SelectItem value="24h">24-hour</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Format for displaying times
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <FormField
                    control={generalForm.control}
                    name="maintenanceMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Maintenance Mode
                          </FormLabel>
                          <FormDescription>
                            When enabled, the system will display a maintenance
                            message to all users except administrators.
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
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security options and access controls
              </CardDescription>
            </CardHeader>
            <Form {...securityForm}>
              <form onSubmit={securityForm.handleSubmit(onSubmitSecurity)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={securityForm.control}
                    name="enableMfa"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Multi-Factor Authentication
                          </FormLabel>
                          <FormDescription>
                            Require users to set up MFA for their accounts
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={securityForm.control}
                      name="sessionTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Timeout (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Time before inactive users are logged out
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="maxLoginAttempts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Login Attempts</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Number of failed attempts before account lockout
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <h3 className="text-lg font-medium">Password Policy</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={securityForm.control}
                      name="passwordPolicy.minLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Password Length</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="passwordPolicy.passwordExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password Expiry (days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            0 = passwords never expire
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={securityForm.control}
                      name="passwordPolicy.requireUppercase"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <FormLabel>Require Uppercase</FormLabel>
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
                      control={securityForm.control}
                      name="passwordPolicy.requireLowercase"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <FormLabel>Require Lowercase</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={securityForm.control}
                      name="passwordPolicy.requireNumbers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <FormLabel>Require Numbers</FormLabel>
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
                      control={securityForm.control}
                      name="passwordPolicy.requireSpecialChars"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <FormLabel>Require Special Characters</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <FormField
                    control={securityForm.control}
                    name="ipRestrictions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IP Restrictions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter allowed IP addresses, one per line"
                            className="font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Restrict admin access to specific IP addresses. Leave
                          blank to allow all IPs.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure email server settings for notifications
              </CardDescription>
            </CardHeader>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onSubmitEmail)}>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={emailForm.control}
                      name="smtpHost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Host</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="smtpPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Port</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={emailForm.control}
                      name="smtpUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="smtpPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={emailForm.control}
                    name="smtpSecure"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Use Secure Connection (TLS/SSL)
                          </FormLabel>
                          <FormDescription>
                            Enable for secure email transmission
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

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={emailForm.control}
                      name="fromEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Email address that will appear in the From field
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="fromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Name that will appear in the From field
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestEmailConnection}
                    >
                      Test Connection
                    </Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Recovery</CardTitle>
              <CardDescription>
                Configure database backup settings and recovery options
              </CardDescription>
            </CardHeader>
            <Form {...backupForm}>
              <form onSubmit={backupForm.handleSubmit(onSubmitBackup)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={backupForm.control}
                    name="enableAutomaticBackups"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enable Automatic Backups
                          </FormLabel>
                          <FormDescription>
                            Automatically backup the database on a schedule
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

                  {backupForm.watch("enableAutomaticBackups") && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={backupForm.control}
                          name="backupFrequency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Backup Frequency</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select frequency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">
                                    Monthly
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={backupForm.control}
                          name="backupTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Backup Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormDescription>
                                Time in 24-hour format (UTC)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={backupForm.control}
                        name="retentionPeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Retention Period (days)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Number of days to keep backups before automatic
                              deletion
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <Separator />

                  <FormField
                    control={backupForm.control}
                    name="backupLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backup Storage Location</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="local">Local Storage</SelectItem>
                            <SelectItem value="s3">Amazon S3</SelectItem>
                            <SelectItem value="gcs">
                              Google Cloud Storage
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {backupForm.watch("backupLocation") === "s3" && (
                    <div className="space-y-4 border rounded-md p-4">
                      <h3 className="text-sm font-medium">Amazon S3 Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={backupForm.control}
                          name="s3Bucket"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>S3 Bucket Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={backupForm.control}
                          name="s3Region"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>S3 Region</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={backupForm.control}
                          name="s3AccessKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Access Key ID</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={backupForm.control}
                          name="s3SecretKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Secret Access Key</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleTestBackupConnection}
                        >
                          Test Connection
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleManualBackup}
                    >
                      <Database className="mr-2 h-4 w-4" />
                      Create Manual Backup
                    </Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        {/* Logging Settings */}
        <TabsContent value="logging">
          <Card>
            <CardHeader>
              <CardTitle>Logging & Monitoring</CardTitle>
              <CardDescription>
                Configure system logging and error reporting
              </CardDescription>
            </CardHeader>
            <Form {...loggingForm}>
              <form onSubmit={loggingForm.handleSubmit(onSubmitLogging)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={loggingForm.control}
                    name="logLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Log Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select log level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="error">
                              Error (Minimal)
                            </SelectItem>
                            <SelectItem value="warn">Warning</SelectItem>
                            <SelectItem value="info">Info (Standard)</SelectItem>
                            <SelectItem value="debug">
                              Debug (Verbose)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Determines the verbosity of system logs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loggingForm.control}
                    name="enableAuditLogs"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enable Audit Logs
                          </FormLabel>
                          <FormDescription>
                            Track all administrative actions for security and
                            compliance
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
                    control={loggingForm.control}
                    name="logRetention"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Log Retention Period (days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Number of days to keep logs before automatic deletion
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={loggingForm.control}
                    name="enableErrorReporting"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enable Error Reporting
                          </FormLabel>
                          <FormDescription>
                            Automatically report errors to administrators
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

                  {loggingForm.watch("enableErrorReporting") && (
                    <FormField
                      control={loggingForm.control}
                      name="errorReportingEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Error Reporting Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="admin@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Email address to receive error notifications
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="rounded-md border p-4 bg-muted/50">
                    <h3 className="text-sm font-medium mb-2">Current System Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Database Connection</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Connected
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Log Storage</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          85% Available
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Last Error</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          None (24h)
                        </Badge>
