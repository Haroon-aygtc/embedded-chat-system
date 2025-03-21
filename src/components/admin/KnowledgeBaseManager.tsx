import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash,
  Save,
  X,
  Edit,
  Check,
  RefreshCw,
  Database,
  FileText,
  Globe,
  Server,
} from "lucide-react";
import { KnowledgeBaseConfig } from "@/services/knowledgeBaseService";
import knowledgeBaseService from "@/services/knowledgeBaseService";
import { useToast } from "@/components/ui/toast-container";
import { format } from "date-fns";

const KnowledgeBaseManager = () => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseConfig[]>(
    [],
  );
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testQuery, setTestQuery] = useState("");
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<Partial<KnowledgeBaseConfig>>({
    name: "",
    type: "api",
    endpoint: "",
    apiKey: "",
    connectionString: "",
    refreshInterval: 60,
    parameters: {},
    isActive: true,
  });

  // Fetch knowledge bases on component mount
  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  const fetchKnowledgeBases = async () => {
    setLoading(true);
    try {
      const kbs = await knowledgeBaseService.getAllConfigs();
      setKnowledgeBases(kbs);
      if (kbs.length > 0 && !selectedKbId) {
        setSelectedKbId(kbs[0].id);
        setFormData(kbs[0]);
      }
    } catch (error) {
      console.error("Error fetching knowledge bases:", error);
      toast({
        title: "Error",
        description: "Failed to fetch knowledge bases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectKnowledgeBase = (kbId: string) => {
    if (isEditing || isCreating) {
      // Confirm before switching
      if (
        !confirm("You have unsaved changes. Are you sure you want to switch?")
      ) {
        return;
      }
    }

    const kb = knowledgeBases.find((k) => k.id === kbId);
    if (kb) {
      setSelectedKbId(kbId);
      setFormData(kb);
      setIsEditing(false);
      setIsCreating(false);
    }
  };

  const handleCreateNew = () => {
    setFormData({
      name: "",
      type: "api",
      endpoint: "",
      apiKey: "",
      connectionString: "",
      refreshInterval: 60,
      parameters: {},
      isActive: true,
    });
    setSelectedKbId(null);
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value as any }));
  };

  const handleParametersChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    try {
      const params = JSON.parse(e.target.value);
      setFormData((prev) => ({ ...prev, parameters: params }));
    } catch (error) {
      // If not valid JSON, store as string to allow user to continue editing
      setFormData((prev) => ({ ...prev, parametersText: e.target.value }));
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name) {
        toast({
          title: "Validation Error",
          description: "Name is required",
          variant: "destructive",
        });
        return;
      }

      if (
        (formData.type === "api" || formData.type === "vector") &&
        !formData.endpoint
      ) {
        toast({
          title: "Validation Error",
          description:
            "Endpoint is required for API and Vector knowledge bases",
          variant: "destructive",
        });
        return;
      }

      if (formData.type === "database" && !formData.connectionString) {
        toast({
          title: "Validation Error",
          description:
            "Connection string is required for Database knowledge bases",
          variant: "destructive",
        });
        return;
      }

      if (isCreating) {
        // Create new knowledge base
        const newKb = await knowledgeBaseService.createConfig(formData as any);
        if (newKb) {
          toast({
            title: "Success",
            description: "Knowledge base created successfully",
          });
          setKnowledgeBases((prev) => [...prev, newKb]);
          setSelectedKbId(newKb.id);
          setFormData(newKb);
          setIsCreating(false);
        }
      } else if (isEditing && selectedKbId) {
        // Update existing knowledge base
        const updatedKb = await knowledgeBaseService.updateConfig(
          selectedKbId,
          formData,
        );
        if (updatedKb) {
          toast({
            title: "Success",
            description: "Knowledge base updated successfully",
          });
          setKnowledgeBases((prev) =>
            prev.map((kb) => (kb.id === selectedKbId ? updatedKb : kb)),
          );
          setFormData(updatedKb);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error("Error saving knowledge base:", error);
      toast({
        title: "Error",
        description: "Failed to save knowledge base",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedKbId) return;

    if (
      !confirm(
        "Are you sure you want to delete this knowledge base? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const success = await knowledgeBaseService.deleteConfig(selectedKbId);
      if (success) {
        toast({
          title: "Success",
          description: "Knowledge base deleted successfully",
        });
        setKnowledgeBases((prev) =>
          prev.filter((kb) => kb.id !== selectedKbId),
        );
        if (knowledgeBases.length > 1) {
          const newSelectedId = knowledgeBases.find(
            (kb) => kb.id !== selectedKbId,
          )?.id;
          if (newSelectedId) {
            handleSelectKnowledgeBase(newSelectedId);
          }
        } else {
          setSelectedKbId(null);
          setFormData({
            name: "",
            type: "api",
            endpoint: "",
            apiKey: "",
            connectionString: "",
            refreshInterval: 60,
            parameters: {},
            isActive: true,
          });
        }
      }
    } catch (error) {
      console.error("Error deleting knowledge base:", error);
      toast({
        title: "Error",
        description: "Failed to delete knowledge base",
        variant: "destructive",
      });
    }
  };

  const handleSync = async () => {
    if (!selectedKbId) return;

    setIsSyncing(true);
    try {
      const success =
        await knowledgeBaseService.syncKnowledgeBase(selectedKbId);
      if (success) {
        toast({
          title: "Success",
          description: "Knowledge base synced successfully",
        });
        // Refresh the knowledge base data
        fetchKnowledgeBases();
      } else {
        toast({
          title: "Error",
          description: "Failed to sync knowledge base",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error syncing knowledge base:", error);
      toast({
        title: "Error",
        description: "Failed to sync knowledge base",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTest = async () => {
    if (!testQuery.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a test query",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResults(null);

    try {
      const results = await knowledgeBaseService.query({
        query: testQuery,
        limit: 5,
        contextRuleId: undefined,
        userId: "test-user",
      });

      setTestResults(results);
    } catch (error) {
      console.error("Error testing knowledge base:", error);
      toast({
        title: "Error",
        description: "Failed to test knowledge base",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "api":
        return <Globe className="h-4 w-4" />;
      case "database":
        return <Database className="h-4 w-4" />;
      case "cms":
        return <Server className="h-4 w-4" />;
      case "file":
        return <FileText className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Knowledge Base Manager</CardTitle>
        <CardDescription>
          Configure external knowledge sources for your AI assistant
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left sidebar with knowledge base list */}
          <div className="md:col-span-1 border rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">Knowledge Bases</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateNew}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : knowledgeBases.length === 0 ? (
                <div className="text-center p-4 text-sm text-muted-foreground">
                  No knowledge bases found
                </div>
              ) : (
                knowledgeBases.map((kb) => (
                  <div
                    key={kb.id}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${selectedKbId === kb.id ? "bg-primary/10" : "hover:bg-muted"}`}
                    onClick={() => handleSelectKnowledgeBase(kb.id)}
                  >
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(kb.type)}
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {kb.name}
                      </span>
                    </div>
                    <Badge
                      variant={kb.isActive ? "default" : "outline"}
                      className="text-xs"
                    >
                      {kb.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right side with knowledge base details */}
          <div className="md:col-span-3 border rounded-md p-4">
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {isCreating
                      ? "Create New Knowledge Base"
                      : isEditing
                        ? "Edit Knowledge Base"
                        : "Knowledge Base Details"}
                  </h3>
                  <div className="flex space-x-2">
                    {!isCreating && !isEditing && selectedKbId && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSync}
                          disabled={isSyncing}
                        >
                          <RefreshCw
                            className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
                          />
                          Sync
                        </Button>
                        <Dialog
                          open={isTestDialogOpen}
                          onOpenChange={setIsTestDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Test
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Test Knowledge Base</DialogTitle>
                              <DialogDescription>
                                Enter a query to test this knowledge base
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="test-query">Query</Label>
                                <Input
                                  id="test-query"
                                  value={testQuery}
                                  onChange={(e) => setTestQuery(e.target.value)}
                                  placeholder="Enter your test query"
                                />
                              </div>

                              {testResults !== null && (
                                <div className="space-y-2">
                                  <Label>Results ({testResults.length})</Label>
                                  <div className="border rounded-md p-2 max-h-[300px] overflow-y-auto">
                                    {testResults.length === 0 ? (
                                      <div className="text-center p-4 text-sm text-muted-foreground">
                                        No results found
                                      </div>
                                    ) : (
                                      testResults.map((result, index) => (
                                        <div
                                          key={index}
                                          className="border-b last:border-b-0 py-2"
                                        >
                                          <div className="flex justify-between">
                                            <span className="text-sm font-medium">
                                              Source: {result.source}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              Score:{" "}
                                              {result.relevanceScore?.toFixed(
                                                2,
                                              ) || "N/A"}
                                            </span>
                                          </div>
                                          <p className="text-sm mt-1">
                                            {result.content}
                                          </p>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsTestDialogOpen(false)}
                              >
                                Close
                              </Button>
                              <Button onClick={handleTest} disabled={isTesting}>
                                {isTesting ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Testing...
                                  </>
                                ) : (
                                  "Test"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDelete}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </>
                    )}
                    {(isCreating || isEditing) && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (isCreating) {
                              setIsCreating(false);
                              if (selectedKbId) {
                                const kb = knowledgeBases.find(
                                  (k) => k.id === selectedKbId,
                                );
                                if (kb) setFormData(kb);
                              }
                            } else {
                              setIsEditing(false);
                              if (selectedKbId) {
                                const kb = knowledgeBases.find(
                                  (k) => k.id === selectedKbId,
                                );
                                if (kb) setFormData(kb);
                              }
                            }
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleSave}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name || ""}
                        onChange={handleInputChange}
                        placeholder="Knowledge Base Name"
                        disabled={!isEditing && !isCreating}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={handleTypeChange}
                        disabled={!isEditing && !isCreating}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api">API</SelectItem>
                          <SelectItem value="database">Database</SelectItem>
                          <SelectItem value="cms">CMS</SelectItem>
                          <SelectItem value="vector">
                            Vector Database
                          </SelectItem>
                          <SelectItem value="file">File System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Conditional fields based on type */}
                  {(formData.type === "api" || formData.type === "vector") && (
                    <div className="space-y-2">
                      <Label htmlFor="endpoint">API Endpoint</Label>
                      <Input
                        id="endpoint"
                        name="endpoint"
                        value={formData.endpoint || ""}
                        onChange={handleInputChange}
                        placeholder="https://api.example.com/knowledge"
                        disabled={!isEditing && !isCreating}
                      />
                    </div>
                  )}

                  {formData.type === "database" && (
                    <div className="space-y-2">
                      <Label htmlFor="connectionString">
                        Connection String
                      </Label>
                      <Input
                        id="connectionString"
                        name="connectionString"
                        value={formData.connectionString || ""}
                        onChange={handleInputChange}
                        placeholder="postgresql://user:password@localhost:5432/db"
                        disabled={!isEditing && !isCreating}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key (if required)</Label>
                    <Input
                      id="apiKey"
                      name="apiKey"
                      value={formData.apiKey || ""}
                      onChange={handleInputChange}
                      placeholder="API Key"
                      type="password"
                      disabled={!isEditing && !isCreating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="refreshInterval">
                      Refresh Interval (minutes)
                    </Label>
                    <Input
                      id="refreshInterval"
                      name="refreshInterval"
                      value={formData.refreshInterval || 60}
                      onChange={handleInputChange}
                      type="number"
                      min="1"
                      disabled={!isEditing && !isCreating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parameters">Parameters (JSON)</Label>
                    <Textarea
                      id="parameters"
                      name="parameters"
                      value={
                        formData.parametersText ||
                        (formData.parameters
                          ? JSON.stringify(formData.parameters, null, 2)
                          : "{}")
                      }
                      onChange={handleParametersChange}
                      placeholder='{"maxResults": 5}'
                      rows={5}
                      disabled={!isEditing && !isCreating}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={handleSwitchChange}
                      disabled={!isEditing && !isCreating}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>

                  {/* Display additional info for view mode */}
                  {!isEditing && !isCreating && selectedKbId && (
                    <div className="border rounded-md p-4 space-y-2 mt-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-sm text-muted-foreground">
                            Created:
                          </span>
                          <p className="text-sm">
                            {formData.createdAt
                              ? format(new Date(formData.createdAt), "PPpp")
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">
                            Last Updated:
                          </span>
                          <p className="text-sm">
                            {formData.updatedAt
                              ? format(new Date(formData.updatedAt), "PPpp")
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">
                            Last Synced:
                          </span>
                          <p className="text-sm">
                            {formData.lastSyncedAt
                              ? format(new Date(formData.lastSyncedAt), "PPpp")
                              : "Never"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KnowledgeBaseManager;
