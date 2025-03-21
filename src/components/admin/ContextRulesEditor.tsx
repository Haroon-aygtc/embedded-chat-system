import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Save, AlertCircle, Info, Edit, Eye } from "lucide-react";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

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

type ContextRule = z.infer<typeof contextRuleSchema>;

// Sample query for the example section
const sampleUserQuery = "Tell me about visa services in Dubai";

const ContextRulesEditor = () => {
  const [activeTab, setActiveTab] = useState("rules-list");
  const [rules, setRules] = useState<ContextRule[]>([
    {
      id: "1",
      name: "UAE Government Information",
      description:
        "Limit responses to official UAE government information and services",
      isActive: true,
      contextType: "business",
      keywords: [
        "UAE",
        "government",
        "Dubai",
        "Abu Dhabi",
        "services",
        "visa",
        "Emirates ID",
      ],
      excludedTopics: ["politics", "criticism"],
      promptTemplate:
        "You are an assistant that provides information about UAE government services. {{ userQuery }}",
      responseFilters: [
        { type: "keyword", value: "unofficial", action: "block" },
        { type: "regex", value: "(criticism|negative)", action: "flag" },
      ],
    },
    {
      id: "2",
      name: "General Information",
      description:
        "Provide general information with no specific business context",
      isActive: false,
      contextType: "general",
      keywords: ["help", "information", "question", "what", "how", "when"],
      promptTemplate:
        "You are a helpful assistant. Please answer the following question: {{ userQuery }}",
      responseFilters: [],
    },
  ]);

  const [selectedRule, setSelectedRule] = useState<ContextRule | null>(null);
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [isAddingExcludedTopic, setIsAddingExcludedTopic] = useState(false);
  const [newExcludedTopic, setNewExcludedTopic] = useState("");
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [newFilter, setNewFilter] = useState<{
    type: "keyword" | "regex" | "semantic";
    value: string;
    action: "block" | "flag" | "modify";
  }>({
    type: "keyword",
    value: "",
    action: "block",
  });
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ContextRule>({
    resolver: zodResolver(contextRuleSchema),
    defaultValues: {
      isActive: true,
      contextType: "business",
      keywords: [],
      excludedTopics: [],
      responseFilters: [],
    },
  });

  const handleAddRule = () => {
    setSelectedRule(null);
    reset({
      isActive: true,
      contextType: "business",
      keywords: [],
      excludedTopics: [],
      responseFilters: [],
      name: "",
      description: "",
      promptTemplate: "",
    });
    setActiveTab("rule-editor");
  };

  const handleEditRule = (rule: ContextRule) => {
    setSelectedRule(rule);
    reset(rule);
    setActiveTab("rule-editor");
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  const handlePreviewRule = (rule: ContextRule) => {
    setSelectedRule(rule);
    setIsPreviewDialogOpen(true);
  };

  const onSubmit = (data: ContextRule) => {
    if (selectedRule) {
      // Update existing rule
      setRules(
        rules.map((rule) =>
          rule.id === selectedRule.id ? { ...data, id: selectedRule.id } : rule,
        ),
      );
    } else {
      // Add new rule
      setRules([...rules, { ...data, id: Date.now().toString() }]);
    }
    setActiveTab("rules-list");
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      const currentKeywords = watch("keywords") || [];
      setValue("keywords", [...currentKeywords, newKeyword.trim()]);
      setNewKeyword("");
      setIsAddingKeyword(false);
    }
  };

  const removeKeyword = (keyword: string) => {
    const currentKeywords = watch("keywords") || [];
    setValue(
      "keywords",
      currentKeywords.filter((k) => k !== keyword),
    );
  };

  const addExcludedTopic = () => {
    if (newExcludedTopic.trim()) {
      const currentTopics = watch("excludedTopics") || [];
      setValue("excludedTopics", [...currentTopics, newExcludedTopic.trim()]);
      setNewExcludedTopic("");
      setIsAddingExcludedTopic(false);
    }
  };

  const removeExcludedTopic = (topic: string) => {
    const currentTopics = watch("excludedTopics") || [];
    setValue(
      "excludedTopics",
      currentTopics.filter((t) => t !== topic),
    );
  };

  const addResponseFilter = () => {
    if (newFilter.value.trim()) {
      const currentFilters = watch("responseFilters") || [];
      setValue("responseFilters", [...currentFilters, newFilter]);
      setNewFilter({ type: "keyword", value: "", action: "block" });
      setIsAddingFilter(false);
    }
  };

  const removeResponseFilter = (index: number) => {
    const currentFilters = watch("responseFilters") || [];
    setValue(
      "responseFilters",
      currentFilters.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Context Rules Editor</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="rules-list">Rules List</TabsTrigger>
          <TabsTrigger value="rule-editor">Rule Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="rules-list" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Context Rules</h2>
            <Button onClick={handleAddRule}>
              <Plus className="mr-2 h-4 w-4" /> Add New Rule
            </Button>
          </div>

          {rules.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No rules defined</AlertTitle>
              <AlertDescription>
                Create your first context rule to start controlling AI
                responses.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rules.map((rule) => (
                <Card key={rule.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          {rule.name}
                          <Badge
                            variant={rule.isActive ? "default" : "outline"}
                            className="ml-2"
                          >
                            {rule.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="secondary" className="ml-2">
                            {rule.contextType === "business"
                              ? "Business"
                              : "General"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{rule.description}</CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePreviewRule(rule)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Preview Rule</p>
                            </TooltipContent>
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
                            <TooltipContent>
                              <p>Edit Rule</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteRule(rule.id || "")}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Rule</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {rule.keywords.map((keyword) => (
                        <Badge key={keyword} variant="outline">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    {rule.excludedTopics && rule.excludedTopics.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm font-medium">
                          Excluded Topics:{" "}
                        </span>
                        {rule.excludedTopics.map((topic) => (
                          <Badge
                            key={topic}
                            variant="outline"
                            className="ml-1 bg-red-50"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <p className="text-sm text-muted-foreground truncate">
                      <span className="font-medium">Prompt Template:</span>{" "}
                      {rule.promptTemplate.substring(0, 60)}...
                    </p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rule-editor">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedRule ? "Edit Context Rule" : "Create New Context Rule"}
              </CardTitle>
              <CardDescription>
                Define how the AI should respond based on specific contexts and
                keywords.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Rule Name</Label>
                      <Input id="name" {...register("name")} />
                      {errors.name && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" {...register("description")} />
                      {errors.description && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="isActive" {...register("isActive")} />
                      <Label htmlFor="isActive">Active</Label>
                    </div>

                    <div>
                      <Label htmlFor="contextType">Context Type</Label>
                      <Select
                        onValueChange={(value) =>
                          setValue(
                            "contextType",
                            value as "business" | "general",
                          )
                        }
                        defaultValue={watch("contextType")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select context type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="business">
                            Business Specific
                          </SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Keywords</Label>
                      <div className="flex flex-wrap gap-2 mt-2 mb-2">
                        {(watch("keywords") || []).map((keyword) => (
                          <Badge
                            key={keyword}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {keyword}
                            <button
                              type="button"
                              onClick={() => removeKeyword(keyword)}
                              className="text-xs ml-1 hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        {isAddingKeyword ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={newKeyword}
                              onChange={(e) => setNewKeyword(e.target.value)}
                              className="w-40 h-8"
                              placeholder="Enter keyword"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={addKeyword}
                            >
                              Add
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setIsAddingKeyword(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddingKeyword(true)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Keyword
                          </Button>
                        )}
                      </div>
                      {errors.keywords && (
                        <p className="text-sm text-red-500">
                          {errors.keywords.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Excluded Topics</Label>
                      <div className="flex flex-wrap gap-2 mt-2 mb-2">
                        {(watch("excludedTopics") || []).map((topic) => (
                          <Badge
                            key={topic}
                            variant="outline"
                            className="flex items-center gap-1 bg-red-50"
                          >
                            {topic}
                            <button
                              type="button"
                              onClick={() => removeExcludedTopic(topic)}
                              className="text-xs ml-1 hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        {isAddingExcludedTopic ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={newExcludedTopic}
                              onChange={(e) =>
                                setNewExcludedTopic(e.target.value)
                              }
                              className="w-40 h-8"
                              placeholder="Enter topic"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={addExcludedTopic}
                            >
                              Add
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setIsAddingExcludedTopic(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddingExcludedTopic(true)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Excluded Topic
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="promptTemplate">Prompt Template</Label>
                  <div className="flex items-center mb-1">
                    <Info className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm text-muted-foreground">
                      Use {"{{"} userQuery {"}}"} as a placeholder for the
                      user's message
                    </span>
                  </div>
                  <Textarea
                    id="promptTemplate"
                    {...register("promptTemplate")}
                    rows={4}
                    placeholder="You are an assistant that provides information about... {{ userQuery }}"
                  />
                  {errors.promptTemplate && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.promptTemplate.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Response Filters</Label>
                  <div className="mt-2 space-y-2">
                    {(watch("responseFilters") || []).map((filter, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{filter.type}</Badge>
                          <span className="font-mono text-sm">
                            {filter.value}
                          </span>
                          <Badge
                            variant={
                              filter.action === "block"
                                ? "destructive"
                                : filter.action === "flag"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {filter.action}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeResponseFilter(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}

                    {isAddingFilter ? (
                      <div className="p-3 border rounded-md space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label htmlFor="filterType">Type</Label>
                            <Select
                              value={newFilter.type}
                              onValueChange={(value) =>
                                setNewFilter({
                                  ...newFilter,
                                  type: value as
                                    | "keyword"
                                    | "regex"
                                    | "semantic",
                                })
                              }
                            >
                              <SelectTrigger id="filterType">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="keyword">Keyword</SelectItem>
                                <SelectItem value="regex">Regex</SelectItem>
                                <SelectItem value="semantic">
                                  Semantic
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="filterValue">Value</Label>
                            <Input
                              id="filterValue"
                              value={newFilter.value}
                              onChange={(e) =>
                                setNewFilter({
                                  ...newFilter,
                                  value: e.target.value,
                                })
                              }
                              placeholder={
                                newFilter.type === "regex"
                                  ? "(pattern)"
                                  : "term"
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="filterAction">Action</Label>
                            <Select
                              value={newFilter.action}
                              onValueChange={(value) =>
                                setNewFilter({
                                  ...newFilter,
                                  action: value as "block" | "flag" | "modify",
                                })
                              }
                            >
                              <SelectTrigger id="filterAction">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="block">Block</SelectItem>
                                <SelectItem value="flag">Flag</SelectItem>
                                <SelectItem value="modify">Modify</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={addResponseFilter}
                          >
                            Add Filter
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsAddingFilter(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingFilter(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Response Filter
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("rules-list")}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {selectedRule ? "Update Rule" : "Create Rule"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Rule Preview: {selectedRule?.name}</DialogTitle>
            <DialogDescription>
              This is how your context rule is configured.
            </DialogDescription>
          </DialogHeader>

          {selectedRule && (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Basic Information</h3>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-medium">Name:</p>
                      <p className="text-sm">{selectedRule.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status:</p>
                      <Badge
                        variant={selectedRule.isActive ? "default" : "outline"}
                      >
                        {selectedRule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Context Type:</p>
                      <Badge variant="secondary">
                        {selectedRule.contextType === "business"
                          ? "Business"
                          : "General"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Description:</p>
                      <p className="text-sm">{selectedRule.description}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Keywords</h3>
                  <Separator className="my-2" />
                  <div className="flex flex-wrap gap-2">
                    {selectedRule.keywords.map((keyword) => (
                      <Badge key={keyword} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedRule.excludedTopics &&
                  selectedRule.excludedTopics.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium">Excluded Topics</h3>
                      <Separator className="my-2" />
                      <div className="flex flex-wrap gap-2">
                        {selectedRule.excludedTopics.map((topic) => (
                          <Badge
                            key={topic}
                            variant="outline"
                            className="bg-red-50"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                <div>
                  <h3 className="text-sm font-medium">Prompt Template</h3>
                  <Separator className="my-2" />
                  <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                    {selectedRule.promptTemplate}
                  </div>
                </div>

                {selectedRule.responseFilters &&
                  selectedRule.responseFilters.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium">Response Filters</h3>
                      <Separator className="my-2" />
                      <div className="space-y-2">
                        {selectedRule.responseFilters.map((filter, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 border rounded-md"
                          >
                            <Badge variant="outline">{filter.type}</Badge>
                            <span className="font-mono text-sm">
                              {filter.value}
                            </span>
                            <Badge
                              variant={
                                filter.action === "block"
                                  ? "destructive"
                                  : filter.action === "flag"
                                    ? "secondary"
                                    : "default"
                              }
                            >
                              {filter.action}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div>
                  <h3 className="text-sm font-medium">Example Usage</h3>
                  <Separator className="my-2" />
                  <div className="p-4 border rounded-md">
                    <p className="text-sm mb-2">
                      <strong>User Query:</strong> "{sampleUserQuery}"
                    </p>
                    <p className="text-sm mb-2">
                      <strong>Matched Keywords:</strong> UAE, Dubai, services,
                      visa
                    </p>
                    <p className="text-sm">
                      <strong>Resulting Prompt:</strong> "You are an assistant
                      that provides information about UAE government services.
                      {sampleUserQuery}"
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button onClick={() => setIsPreviewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContextRulesEditor;
