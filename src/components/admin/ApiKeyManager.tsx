import React, { useState, useEffect } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CheckCircle,
  Key,
  RefreshCw,
  Save,
  Shield,
} from "lucide-react";
import apiKeyService from "@/services/apiKeyService";

// Define the form schema using zod
const apiKeyFormSchema = z.object({
  geminiApiKey: z
    .string()
    .min(10, { message: "API key must be at least 10 characters" }),
  huggingFaceApiKey: z
    .string()
    .min(10, { message: "API key must be at least 10 characters" }),
});

type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

const ApiKeyManager = () => {
  const [activeTab, setActiveTab] = useState("gemini");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastUsed, setLastUsed] = useState<Record<string, string>>({});
  const [usageStats, setUsageStats] = useState<Record<string, any>>({});

  // Initialize form with default values
  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      geminiApiKey: "",
      huggingFaceApiKey: "",
    },
  });

  // Load API key usage statistics
  useEffect(() => {
    const loadUsageStats = async () => {
      try {
        // In a real implementation, this would fetch from your database
        // For demo purposes, we'll use mock data
        setUsageStats({
          gemini: {
            totalCalls: 1248,
            successRate: 98.5,
            averageResponseTime: 0.8,
            costThisMonth: 12.42,
          },
          huggingFace: {
            totalCalls: 856,
            successRate: 97.2,
            averageResponseTime: 1.2,
            costThisMonth: 8.76,
          },
        });

        setLastUsed({
          gemini: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
          huggingFace: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        });
      } catch (error) {
        console.error("Error loading API key usage statistics", error);
      }
    };

    loadUsageStats();
  }, []);

  const onSubmit = async (data: ApiKeyFormValues) => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      if (activeTab === "gemini") {
        const success = await apiKeyService.setGeminiApiKey(data.geminiApiKey);
        if (!success) {
          throw new Error("Failed to save Gemini API key");
        }
      } else if (activeTab === "huggingface") {
        // In a real implementation, this would save the Hugging Face API key
        // For demo purposes, we'll simulate a successful save
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error(`Error saving ${activeTab} API key:`, error);
      setSaveError(`Failed to save ${activeTab} API key. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRotateApiKey = async () => {
    if (activeTab === "gemini") {
      // In a real implementation, this would generate a new API key
      // and rotate it in your system
      const newApiKey = `gemini_${Math.random().toString(36).substring(2, 15)}`;
      form.setValue("geminiApiKey", newApiKey);
    } else if (activeTab === "huggingface") {
      const newApiKey = `hf_${Math.random().toString(36).substring(2, 15)}`;
      form.setValue("huggingFaceApiKey", newApiKey);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">API Key Management</h2>
        <p className="text-muted-foreground">
          Manage your AI service API keys securely
        </p>
      </div>

      {saveSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">
            API key has been saved successfully.
          </AlertDescription>
        </Alert>
      )}

      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gemini" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span>Gemini API</span>
          </TabsTrigger>
          <TabsTrigger value="huggingface" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span>Hugging Face API</span>
          </TabsTrigger>
        </TabsList>

        {/* Gemini API Key */}
        <TabsContent value="gemini">
          <Card>
            <CardHeader>
              <CardTitle>Gemini API Key</CardTitle>
              <CardDescription>
                Configure your Google Gemini API key for AI-powered responses
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="geminiApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your Gemini API key"
                          />
                        </FormControl>
                        <FormDescription>
                          Your API key is stored securely and never exposed to
                          clients
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="rounded-md border p-4 bg-muted/50">
                    <h3 className="text-sm font-medium mb-2">
                      API Key Usage Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Total API Calls
                        </p>
                        <p className="text-sm font-medium">
                          {usageStats.gemini?.totalCalls.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Success Rate
                        </p>
                        <p className="text-sm font-medium">
                          {usageStats.gemini?.successRate}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Avg Response Time
                        </p>
                        <p className="text-sm font-medium">
                          {usageStats.gemini?.averageResponseTime}s
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Cost This Month
                        </p>
                        <p className="text-sm font-medium">
                          ${usageStats.gemini?.costThisMonth}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center">
                      <p className="text-xs text-muted-foreground">
                        Last Used:
                      </p>
                      <p className="text-xs ml-1">
                        {lastUsed.gemini
                          ? formatDate(lastUsed.gemini)
                          : "Never"}
                      </p>
                      <Badge
                        variant="outline"
                        className="ml-auto bg-green-50 text-green-700 text-xs"
                      >
                        Active
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <h4 className="text-sm font-medium">Security Status</h4>
                      <p className="text-xs text-muted-foreground">
                        Your API key is stored with encryption at rest
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      <Shield className="mr-1 h-3 w-3" /> Secure
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRotateApiKey}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Rotate Key
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Key
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        {/* Hugging Face API Key */}
        <TabsContent value="huggingface">
          <Card>
            <CardHeader>
              <CardTitle>Hugging Face API Key</CardTitle>
              <CardDescription>
                Configure your Hugging Face API key for fallback AI responses
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="huggingFaceApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your Hugging Face API key"
                          />
                        </FormControl>
                        <FormDescription>
                          Your API key is stored securely and never exposed to
                          clients
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="rounded-md border p-4 bg-muted/50">
                    <h3 className="text-sm font-medium mb-2">
                      API Key Usage Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Total API Calls
                        </p>
                        <p className="text-sm font-medium">
                          {usageStats.huggingFace?.totalCalls.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Success Rate
                        </p>
                        <p className="text-sm font-medium">
                          {usageStats.huggingFace?.successRate}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Avg Response Time
                        </p>
                        <p className="text-sm font-medium">
                          {usageStats.huggingFace?.averageResponseTime}s
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Cost This Month
                        </p>
                        <p className="text-sm font-medium">
                          ${usageStats.huggingFace?.costThisMonth}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center">
                      <p className="text-xs text-muted-foreground">
                        Last Used:
                      </p>
                      <p className="text-xs ml-1">
                        {lastUsed.huggingFace
                          ? formatDate(lastUsed.huggingFace)
                          : "Never"}
                      </p>
                      <Badge
                        variant="outline"
                        className="ml-auto bg-green-50 text-green-700 text-xs"
                      >
                        Active
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <h4 className="text-sm font-medium">Security Status</h4>
                      <p className="text-xs text-muted-foreground">
                        Your API key is stored with encryption at rest
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      <Shield className="mr-1 h-3 w-3" /> Secure
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRotateApiKey}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Rotate Key
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Key
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium mb-2">
          API Key Security Best Practices
        </h3>
        <ul className="text-sm space-y-2">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Rotate your API keys regularly (at least every 90 days)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              Never expose API keys in client-side code or public repositories
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              Set appropriate usage limits in your Google Cloud Console
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              Monitor API usage for unusual patterns that might indicate a leak
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ApiKeyManager;
