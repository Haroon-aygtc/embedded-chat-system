import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Save, AlertCircle, Info, Edit, Eye, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { contextRulesApi } from "@/services/apiService";
import { ContextRule, ResponseFilter } from "@/types/contextRules";

// Define the schema for context rules
const contextRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  isActive: z.boolean().default(true),
  contextType: z.enum(["business", "general"]),
  keywords: z
    .array(z.string())
    .min(1, { message: "At least one keyword is required" }),
  excludedTopics: z.array(z.string()).optional(),
  promptTemplate: z
    .string()
    .min(10, { message: "Prompt template must be at least 10 characters" }),
  responseFilters: z
    .array(
      z.object({
        type: z.enum(["keyword", "regex", "semantic"]),
        value: z.string(),
        action: z.enum(["block", "flag", "modify"]),
      }),
    )
    .optional(),
});

type FormContextRule = z.infer<typeof contextRuleSchema>;

// Sample query for the example section
const sampleUserQuery = "Tell me about visa services in Dubai";

const ContextRulesEditor = () => {
  const [activeTab, setActiveTab] = useState("rules-list");
  const [rules, setRules] = useState<ContextRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRule, setSelectedRule] = useState<ContextRule | null>(null);
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [isAddingExcludedTopic, setIsAddingExcludedTopic] = useState(false);
  const [newExcludedTopic, setNewExcludedTopic] = useState("");
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [newFilter, setNewFilter] = useState<ResponseFilter>({
    type: "keyword",
    value: "",
    action: "block",
  });
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testQuery, setTestQuery] = useState("");
  const [testResult, setTestResult] = useState<{ result: string; matches: string[] } | null>(null);
  const [isTestingRule, setIsTestingRule] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormContextRule>({
    resolver: zodResolver(contextRuleSchema),
    defaultValues: {
      isActive: true,
      contextType: "business",
      keywords: [],
      excludedTopics: [],
      responseFilters: [],
    },
  });

  // Fetch rules on component mount
  useEffect(() => {
    const fetchRules = async () => {
      try {
        setIsLoading(true);
        const data = await contextRulesApi.getAll();
        setRules(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching context rules:", error);
        setError("Failed to load context rules. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRules();
  }, []);

  const handleCreateRule = async (data: FormContextRule) => {
    try {
      setIsSaving(true);
      const newRule = await contextRulesApi.create(data as Omit<ContextRule, "id" | "createdAt" | "updatedAt">);
      setRules([...rules, newRule]);
      setActiveTab("rules-list");
      reset();
      setError(null);
    } catch (error) {
      console.error("Error creating context rule:", error);
      setError("Failed to create context rule. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRule = async (data: FormContextRule) => {
    if (!selectedRule?.id) return;

    try {
      setIsSaving(true);
      const updatedRule = await contextRulesApi.update(selectedRule.id, data);
      setRules(rules.map(rule => rule.id === updatedRule.id ? updatedRule : rule));
      setSelectedRule(null);
      setActiveTab("rules-list");
      reset();
      setError(null);
    } catch (error) {
      console.error("Error updating context rule:", error);
      setError("Failed to update context rule. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this context rule?")) return;

    try {
      setIsLoading(true);
      await contextRulesApi.delete(id);
      setRules(rules.filter(rule => rule.id !== id));
      setError(null);
    } catch (error) {
      console.error("Error deleting context rule:", error);
      setError("Failed to delete context rule. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRule = (rule: ContextRule) => {
    setSelectedRule(rule);
    reset({
      ...rule,
      keywords: rule.keywords || [],
      excludedTopics: rule.excludedTopics || [],
      responseFilters: rule.responseFilters || [],
    });
    setActiveTab("create-rule");
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const currentKeywords = watch("keywords") || [];
    setValue("keywords", [...currentKeywords, newKeyword.trim()]);
    setNewKeyword("");
    setIsAddingKeyword(false);
  };

  const handleRemoveKeyword = (keyword: string) => {
    const currentKeywords = watch("keywords") || [];
    setValue("keywords", currentKeywords.filter(k => k !== keyword));
  };

  const handleAddExcludedTopic = () => {
    if (!newExcludedTopic.trim()) return;
    const currentTopics = watch("excludedTopics") || [];
    setValue("excludedTopics", [...currentTopics, newExcludedTopic.trim()]);
    setNewExcludedTopic("");
    setIsAddingExcludedTopic(false);
  };

  const handleRemoveExcludedTopic = (topic: string) => {
    const currentTopics = watch("excludedTopics") || [];
    setValue("excludedTopics", currentTopics.filter(t => t !== topic));
  };

  const handleAddFilter = () => {
    if (!newFilter.value.trim()) return;
    const currentFilters = watch("responseFilters") || [];
    setValue("responseFilters", [...currentFilters, newFilter]);
    setNewFilter({ type: "keyword", value: "", action: "block" });
    setIsAddingFilter(false);
  };

  const handleRemoveFilter = (index: number) => {
    const currentFilters = watch("responseFilters") || [];
    setValue("responseFilters", currentFilters.filter((_, i) => i !== index));
  };

  const handleTestRule = async () => {
    if (!selectedRule?.id || !testQuery.trim()) return;

    try {
      setIsTestingRule(true);
      const result = await contextRulesApi.testRule(selectedRule.id, testQuery);
      setTestResult(result);
    } catch (error) {
      console.error("Error testing context rule:", error);
      setError("Failed to test context rule. Please try again.");
    } finally {
      setIsTestingRule(false);
    }
  };

  const handleCancelEdit = () => {
    setSelectedRule(null);
    reset();
    setActiveTab("rules-list");
  };

  const formattedPromptTemplate = (template: string) => {
    return template.replace("{{ userQuery }}", `<span class="text-blue-500 font-semibold">${sampleUserQuery}</span>`);
  };

  return (
    <div className="p-6 bg-background">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Context Rules</h1>
          <p className="text-muted-foreground">
            Define and manage context rules to control AI responses
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedRule(null);
            reset();
            setActiveTab("create-rule");
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="rules-list">Rules List</TabsTrigger>
          <TabsTrigger value="create-rule">
            {selectedRule ? "Edit Rule" : "Create Rule"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules-list">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground mb-4">
                No context rules found. Create your first rule to get started.
              </p>
              <Button
                onClick={() => setActiveTab("create-rule")}
                variant="outline"
              >
                Create Rule
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rules.map((rule) => (
                <Card key={rule.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {rule.name}
                          {rule.isActive ? (
                            <Badge variant="default" className="ml-2">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="ml-2">
                              Inactive
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{rule.description}</CardDescription>
                      </div>
                      <div className="flex space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedRule(rule);
                                  setIsPreviewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Preview</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditRule(rule)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteRule(rule.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Type</h4>
                        <Badge
                          variant="outline"
                          className="capitalize bg-primary/5"
                        >
                          {rule.contextType}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-1">Keywords</h4>
                        <div className="flex flex-wrap gap-1">
                          {rule.keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {rule.excludedTopics && rule.excludedTopics.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">
                            Excluded Topics
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {rule.excludedTopics.map((topic) => (
                              <Badge
                                key={topic}
                                variant="outline"
                                className="bg-destructive/10 text-destructive"
                              >
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-3 text-xs text-muted-foreground">
                    <div className="w-full flex justify-between">
                      <span>
                        Created:{" "}
                        {new Date(rule.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        Updated:{" "}
                        {new Date(rule.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create-rule">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedRule ? "Edit Context Rule" : "Create Context Rule"}
              </CardTitle>
              <CardDescription>
                {selectedRule
                  ? "Update the settings for this context rule"
                  : "Define a new context rule to control AI responses"}
              </CardDescription>
            </CardHeader>
            <form
              onSubmit={handleSubmit(
                selectedRule ? handleUpdateRule : handleCreateRule
              )}
            >
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Rule Name</Label>
                      <Input
                        id="name"
                        placeholder="E.g., UAE Government Information"
                        {...register("name")}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the purpose of this context rule"
                        {...register("description")}
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive">
                          {errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contextType">Context Type</Label>
                      <Select
                        defaultValue={watch("contextType")}
                        onValueChange={(value) =>
                          setValue("contextType", value as "business" | "general")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select context type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={watch("isActive")}
                        onCheckedChange={(checked) =>
                          setValue("isActive", checked)
                        }
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Keywords</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingKeyword(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                      {isAddingKeyword ? (
                        <div className="flex space-x-2">
                          <Input
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            placeholder="Enter keyword"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={handleAddKeyword}
                            size="sm"
                          >
                            Add
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsAddingKeyword(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : null}
                      <div className="flex flex-wrap gap-1 min-h-[40px] p-2 border rounded-md">
                        {watch("keywords")?.map((keyword) => (