import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  RefreshCw,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import aiModelService from "@/services/aiModelService";
import { getMySQLClient } from "@/services/mysqlClient";
import { useAdmin } from "@/context/AdminContext";
import { useToast } from "@/components/ui/use-toast";

interface AIModel {
  id: string;
  name: string;
  provider: string;
  isAvailable?: boolean;
  isDefault?: boolean;
  apiKeyConfigured?: boolean;
  maxTokens?: number;
  temperature?: number;
  customEndpoint?: string;
  additionalParams?: Record<string, any>;
}

interface ModelPerformance {
  modelId: string;
  avgResponseTime: number;
  totalRequests: number;
  successRate: number;
  lastUsed: string;
}

const AIConfiguration = () => {
  const { toast } = useToast();
  const { refreshTrigger, triggerRefresh } = useAdmin();
  const [activeTab, setActiveTab] = useState("models");
  const [isLoading, setIsLoading] = useState(false);
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [testQuery, setTestQuery] = useState("What is the current weather?");
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<"connected" | "error" | "checking">(
    "checking",
  );

  // Models state
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [defaultModel, setDefaultModel] = useState<string>("");
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>(
    [],
  );

  // API Keys state
  const [apiKeys, setApiKeys] = useState({
    gemini: "",
    huggingFace: "",
    grok: "",
    anthropic: "",
    mistral: "",
  });

  // Model being edited
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);

  // Load data
  useEffect(() => {
    checkDatabaseConnection();
    loadModels();
    loadModelPerformance();
    // We don't load API keys directly for security reasons
    // Instead we just check which ones are configured
  }, [refreshTrigger]);

  const checkDatabaseConnection = async () => {
    try {
      setDbStatus("checking");
      const sequelize = await getMySQLClient();
      await sequelize.query("SELECT 1");
      setDbStatus("connected");
    } catch (error) {
      console.error("Database connection error:", error);
      setDbStatus("error");
    }
  };

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const models = await aiModelService.getAvailableModels();
      setAvailableModels(models);

      // Get default model
      const defaultModelResult = models.find((m) => m.isDefault);
      if (defaultModelResult) {
        setDefaultModel(defaultModelResult.id);
      }
    } catch (error) {
      console.error("Error loading AI models:", error);
      toast({
        title: "Error",
        description: "Failed to load AI models. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadModelPerformance = async () => {
    try {
      const performanceData = await aiModelService.getModelPerformance();
      setModelPerformance(performanceData);
    } catch (error) {
      console.error("Error loading model performance:", error);
    }
  };

  const handleSetDefaultModel = async (modelId: string) => {
    setIsLoading(true);
    try {
      const success = await aiModelService.setDefaultModel(modelId);
      if (success) {
        setDefaultModel(modelId);
        toast({
          title: "Success",
          description: "Default AI model updated successfully.",
        });
        triggerRefresh();
      } else {
        throw new Error("Failed to update default model");
      }
    } catch (error) {
      console.error("Error setting default model:", error);
      toast({
        title: "Error",
        description: "Failed to update default AI model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKeys = async () => {
    setIsLoading(true);
    try {
      // Save each API key to the database
      for (const [provider, key] of Object.entries(apiKeys)) {
        if (key) {
          await aiModelService.saveApiKey(provider, key);
        }
      }

      toast({
        title: "Success",
        description: "API keys updated successfully.",
      });

      // Clear the form for security
      setApiKeys({
        gemini: "",
        huggingFace: "",
        grok: "",
        anthropic: "",
        mistral: "",
      });

      triggerRefresh();
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast({
        title: "Error",
        description: "Failed to update API keys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestModel = async (modelId: string) => {
    setTestingModel(modelId);
    setTestResponse(null);
    setTestError(null);

    try {
      const result = await aiModelService.testModel(modelId, testQuery);
      if (result.success) {
        setTestResponse(result.response || "No response received");
      } else {
        setTestError(result.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error testing model:", error);
      setTestError(
        "Failed to get response from model. Please check your API key and try again.",
      );
    } finally {
      setTestingModel(null);
    }
  };

  const handleEditModel = (model: AIModel) => {
    setEditingModel({
      ...model,
      maxTokens: model.maxTokens || 1024,
      temperature: model.temperature || 0.7,
      customEndpoint: model.customEndpoint || "",
      additionalParams: model.additionalParams || {},
    });
  };

  const handleSaveModelConfig = async () => {
    if (!editingModel) return;

    setIsLoading(true);
    try {
      const success = await aiModelService.updateModelConfig(editingModel.id, {
        maxTokens: editingModel.maxTokens,
        temperature: editingModel.temperature,
        customEndpoint: editingModel.customEndpoint,
        additionalParams: editingModel.additionalParams,
      });

      if (success) {
        toast({
          title: "Success",
          description: `${editingModel.name} configuration updated successfully.`,
        });

        setEditingModel(null);
        triggerRefresh();
      } else {
        throw new Error("Failed to update model configuration");
      }
    } catch (error) {
      console.error("Error saving model configuration:", error);
      toast({
        title: "Error",
        description: "Failed to update model configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomModel = async () => {
    const name = (
      document.getElementById("customModelName") as HTMLInputElement
    ).value;
    const endpoint = (
      document.getElementById("customModelEndpoint") as HTMLInputElement
    ).value;

    if (!name || !endpoint) {
      toast({
        title: "Error",
        description: "Please provide both a name and endpoint URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const modelId = await aiModelService.addCustomModel(name, endpoint);
      if (modelId) {
        toast({
          title: "Custom Model Added",
          description: `${name} has been added to your available models.`,
        });

        (document.getElementById("customModelName") as HTMLInputElement).value =
          "";
        (
          document.getElementById("customModelEndpoint") as HTMLInputElement
        ).value = "";
        triggerRefresh();
      } else {
        throw new Error("Failed to add custom model");
      }
    } catch (error) {
      console.error("Error adding custom model:", error);
      toast({
        title: "Error",
        description:
          "Failed to add custom model. Please check the endpoint URL.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveModel = async (model: AIModel) => {
    if (!confirm(`Are you sure you want to remove ${model.name}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await aiModelService.removeModel(
        model.id,
        model.provider === "Custom",
      );

      if (success) {
        toast({
          title: "Model Removed",
          description: `${model.name} has been removed from your available models.`,
        });
        triggerRefresh();
      } else {
        throw new Error("Failed to remove model");
      }
    } catch (error) {
      console.error("Error removing model:", error);
      toast({
        title: "Error",
        description: "Failed to remove model.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            AI Configuration
          </h2>
          <p className="text-muted-foreground">
            Manage AI models, API keys, and performance settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={dbStatus === "connected" ? "default" : "destructive"}
            className="px-3 py-1"
          >
            {dbStatus === "connected" ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" /> Database Connected
              </>
            ) : dbStatus === "error" ? (
              <>
                <AlertTriangle className="w-4 h-4 mr-1" /> Database Error
              </>
            ) : (
              "Checking Database..."
            )}
          </Badge>
          <Button
            onClick={() => triggerRefresh()}
            variant="outline"
            size="icon"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {dbStatus === "error" && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Database Connection Error</AlertTitle>
          <AlertDescription>
            Unable to connect to the database. Please check your database
            configuration and try again.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="apikeys">API Keys</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* AI Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available AI Models</CardTitle>
              <CardDescription>
                Configure and manage available AI models for your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableModels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                  <p className="text-center text-muted-foreground">
                    No AI models available. Please configure your API keys
                    first.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 className="text-lg font-medium mb-2">Test AI Models</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter a test query below, then click Send to test with the
                      first available model.
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="space-y-2 w-full">
                        <Label htmlFor="testQuery">Test Query</Label>
                        <div className="flex gap-2">
                          <Input
                            id="testQuery"
                            placeholder="Enter your test query here"
                            value={testQuery}
                            onChange={(e) => setTestQuery(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => {
                              if (
                                availableModels.length > 0 &&
                                testQuery.trim() !== ""
                              ) {
                                const firstAvailableModel =
                                  availableModels.find((m) => m.isAvailable);
                                if (firstAvailableModel) {
                                  handleTestModel(firstAvailableModel.id);
                                } else {
                                  setTestError(
                                    "No available models to test. Please configure API keys first.",
                                  );
                                }
                              } else if (testQuery.trim() === "") {
                                setTestError(
                                  "Please enter a test query first.",
                                );
                              }
                            }}
                            disabled={isLoading || testingModel !== null}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {testingModel !== null ? (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              "Send"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableModels.map((model) => (
                        <TableRow key={model.id}>
                          <TableCell className="font-medium">
                            {model.name}
                          </TableCell>
                          <TableCell>{model.provider}</TableCell>
                          <TableCell>
                            {model.isAvailable ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />{" "}
                                Available
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-700 border-red-200"
                              >
                                <XCircle className="h-3 w-3 mr-1" /> Unavailable
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {defaultModel === model.id ? (
                              <Badge className="bg-blue-500">Default</Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetDefaultModel(model.id)}
                                disabled={!model.isAvailable || isLoading}
                              >
                                Set Default
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditModel(model)}
                                disabled={isLoading}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTestModel(model.id)}
                                disabled={
                                  testingModel === model.id ||
                                  !model.isAvailable ||
                                  isLoading
                                }
                              >
                                {testingModel === model.id ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                    Testing...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Test Model
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleRemoveModel(model)}
                                disabled={isLoading}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Test Results</h3>
                    {!testResponse && !testError && (
                      <div className="p-4 border border-dashed border-gray-300 rounded-md bg-gray-50 text-center">
                        <p className="text-muted-foreground">
                          Test results will appear here after clicking "Test
                          Model" on any available model above.
                        </p>
                      </div>
                    )}

                    {testResponse && (
                      <Alert className="mt-4 bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle>Test Successful</AlertTitle>
                        <AlertDescription className="mt-2">
                          <div className="p-3 bg-white rounded border border-green-100 max-h-60 overflow-y-auto">
                            {testResponse}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {testError && (
                      <Alert className="mt-4 bg-red-50 border-red-200">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertTitle>Test Failed</AlertTitle>
                        <AlertDescription className="mt-2">
                          {testError}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Model Configuration Dialog */}
          {editingModel && (
            <Card>
              <CardHeader>
                <CardTitle>Configure {editingModel.name}</CardTitle>
                <CardDescription>
                  Adjust parameters for this AI model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          id="maxTokens"
                          min={256}
                          max={8192}
                          step={256}
                          value={[editingModel.maxTokens || 1024]}
                          onValueChange={(value) =>
                            setEditingModel({
                              ...editingModel,
                              maxTokens: value[0],
                            })
                          }
                        />
                        <span className="w-12 text-right">
                          {editingModel.maxTokens}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          id="temperature"
                          min={0}
                          max={1}
                          step={0.1}
                          value={[editingModel.temperature || 0.7]}
                          onValueChange={(value) =>
                            setEditingModel({
                              ...editingModel,
                              temperature: value[0],
                            })
                          }
                        />
                        <span className="w-12 text-right">
                          {editingModel.temperature}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customEndpoint">
                      Custom Endpoint URL (Optional)
                    </Label>
                    <Input
                      id="customEndpoint"
                      placeholder="https://api.example.com/v1"
                      value={editingModel.customEndpoint || ""}
                      onChange={(e) =>
                        setEditingModel({
                          ...editingModel,
                          customEndpoint: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="streamingEnabled">Enable Streaming</Label>
                      <Switch
                        id="streamingEnabled"
                        checked={
                          editingModel.additionalParams?.streaming || false
                        }
                        onCheckedChange={(checked) =>
                          setEditingModel({
                            ...editingModel,
                            additionalParams: {
                              ...editingModel.additionalParams,
                              streaming: checked,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingModel(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveModelConfig}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Configuration
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="apikeys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys Configuration</CardTitle>
              <CardDescription>
                Configure API keys for different AI providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertTitle>Security Notice</AlertTitle>
                <AlertDescription>
                  API keys are stored securely and encrypted. They are never
                  exposed in client-side code.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="geminiKey">Google Gemini API Key</Label>
                  <Input
                    id="geminiKey"
                    type="password"
                    placeholder="Enter your Gemini API key"
                    value={apiKeys.gemini}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, gemini: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="huggingFaceKey">Hugging Face API Key</Label>
                  <Input
                    id="huggingFaceKey"
                    type="password"
                    placeholder="Enter your Hugging Face API key"
                    value={apiKeys.huggingFace}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, huggingFace: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grokKey">Grok API Key</Label>
                  <Input
                    id="grokKey"
                    type="password"
                    placeholder="Enter your Grok API key"
                    value={apiKeys.grok}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, grok: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anthropicKey">Anthropic API Key</Label>
                  <Input
                    id="anthropicKey"
                    type="password"
                    placeholder="Enter your Anthropic API key"
                    value={apiKeys.anthropic}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, anthropic: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mistralKey">Mistral API Key</Label>
                  <Input
                    id="mistralKey"
                    type="password"
                    placeholder="Enter your Mistral API key"
                    value={apiKeys.mistral}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, mistral: e.target.value })
                    }
                  />
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleSaveApiKeys}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save API Keys"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance</CardTitle>
              <CardDescription>
                View performance metrics for your AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              {modelPerformance.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                  <p className="text-center text-muted-foreground">
                    No performance data available yet. Use your models to
                    generate data.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Total Requests</TableHead>
                      <TableHead>Avg. Response Time</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Last Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelPerformance.map((perf) => (
                      <TableRow key={perf.modelId}>
                        <TableCell className="font-medium">
                          {availableModels.find((m) => m.id === perf.modelId)
                            ?.name || perf.modelId}
                        </TableCell>
                        <TableCell>{perf.totalRequests}</TableCell>
                        <TableCell>
                          {perf.avgResponseTime.toFixed(2)}s
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              perf.successRate > 90 ? "default" : "outline"
                            }
                          >
                            {perf.successRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(perf.lastUsed).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIConfiguration;
