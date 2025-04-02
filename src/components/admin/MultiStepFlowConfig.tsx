import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Save,
  Plus,
  Trash2,
  Edit,
  ArrowDown,
  ArrowUp,
  Copy,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface MultiStepFlowConfigProps {
  onSave?: (config: MultiStepConfig) => Promise<void>;
  initialConfig?: MultiStepConfig;
}

export interface MultiStepConfig {
  enableMultiStepFlows: boolean;
  flows: ConversationFlow[];
  defaultFlow?: string;
  allowUserToSkip: boolean;
  rememberUserProgress: boolean;
}

export interface ConversationFlow {
  id: string;
  name: string;
  description?: string;
  triggerKeywords?: string[];
  steps: ConversationStep[];
  isActive: boolean;
}

export interface ConversationStep {
  id: string;
  question: string;
  description?: string;
  responseOptions?: string[];
  isRequired: boolean;
  nextStepLogic?: NextStepLogic[];
}

export interface NextStepLogic {
  responseContains: string;
  nextStepId: string;
}

const defaultConfig: MultiStepConfig = {
  enableMultiStepFlows: true,
  allowUserToSkip: true,
  rememberUserProgress: true,
  flows: [
    {
      id: "onboarding",
      name: "User Onboarding",
      description: "Guide new users through the platform",
      triggerKeywords: ["start", "begin", "new", "help", "guide"],
      isActive: true,
      steps: [
        {
          id: "step1",
          question: "Welcome! What would you like to accomplish today?",
          description: "Initial question to understand user goals",
          responseOptions: [
            "Learn about features",
            "Set up my account",
            "Troubleshoot an issue",
          ],
          isRequired: true,
        },
        {
          id: "step2",
          question: "Great! What specific feature are you interested in?",
          description: "Follow-up to narrow down user interest",
          isRequired: false,
        },
      ],
    },
    {
      id: "support",
      name: "Technical Support",
      description: "Help users troubleshoot technical issues",
      triggerKeywords: ["problem", "issue", "error", "not working", "help"],
      isActive: true,
      steps: [
        {
          id: "support1",
          question: "I'm sorry to hear you're having trouble. What issue are you experiencing?",
          description: "Initial question to identify the problem",
          isRequired: true,
        },
        {
          id: "support2",
          question: "Have you tried restarting the application?",
          description: "Basic troubleshooting step",
          responseOptions: ["Yes", "No"],
          isRequired: true,
          nextStepLogic: [
            {
              responseContains: "yes",
              nextStepId: "support4",
            },
          ],
        },
        {
          id: "support3",
          question: "Please try restarting the application and let me know if that resolves the issue.",
          description: "Instruction to restart",
          isRequired: false,
        },
        {
          id: "support4",
          question: "What version of the software are you currently using?",
          description: "Version check",
          isRequired: false,
        },
      ],
    },
  ],
  defaultFlow: "onboarding",
};

const MultiStepFlowConfig: React.FC<MultiStepFlowConfigProps> = ({
  onSave,
  initialConfig = defaultConfig,
}) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<MultiStepConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState("general");
  const [activeFlowId, setActiveFlowId] = useState<string | null>(
    config.flows.length > 0 ? config.flows[0].id : null
  );
  const [isLoading, setIsLoading] = useState(false);

  // For editing flows
  const [editingFlow, setEditingFlow] = useState<ConversationFlow | null>(null);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDescription, setNewFlowDescription] = useState("");
  const [newFlowKeywords, setNewFlowKeywords] = useState("");

  // For editing steps
  const [editingStep, setEditingStep] = useState<ConversationStep | null>(null);
  const [newStepQuestion, setNewStepQuestion] = useState("");
  const [newStepDescription, setNewStepDescription] = useState("");
  const [newStepOptions, setNewStepOptions] = useState("");
  const [newStepRequired, setNewStepRequired] = useState(true);

  const handleSave = async () => {
    if (!onSave) return;

    setIsLoading(true);
    try {
      await onSave(config);
      toast({
        title: "Success",
        description: "Multi-step flow configuration saved successfully.",
      });
    } catch (error) {
      console.error("Error saving multi-step flow configuration:", error);
      toast({
        title: "Error",
        description: "Failed to save multi-step flow configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFlow = () => {
    if (!newFlowName) {
      toast({
        title: "Error",
        description: "Flow name is required.",
        variant: "destructive",
      });
      return;
    }

    const keywords = newFlowKeywords
      ? newFlowKeywords.split(",").map((k) => k.trim())
      : undefined;

    const newFlow: ConversationFlow = {
      id: `flow-${Date.now()}`,
      name: newFlowName,
      description: newFlowDescription || undefined,
      triggerKeywords: keywords,
      steps: [],
      isActive: true,
    };

    setConfig({
      ...config,
      flows: [...config.flows, newFlow],
    });

    // Set this as the active flow
    setActiveFlowId(newFlow.id);

    // Reset form
    setNewFlowName("");
    setNewFlowDescription("");
    setNewFlowKeywords("");

    toast({
      title: "Flow Added",
      description: `Conversation flow "${newFlowName}" has been added.`,
    });
  };

  const handleUpdateFlow = () => {
    if (!editingFlow) return;

    const updatedFlows = config.flows.map((flow) =>
      flow.id === editingFlow.id ? editingFlow : flow
    );

    setConfig({
      ...config,
      flows: updatedFlows,
    });

    setEditingFlow(null);

    toast({
      title: "Flow Updated",
      description: `Conversation flow "${editingFlow.name}" has been updated.`,
    });
  };

  const handleDeleteFlow = (id: string) => {
    // Update default flow if needed
    let updatedConfig = {
      ...config,
      flows: config.flows.filter((flow) => flow.id !== id),
    };

    // If we're deleting the current default flow, set it to the first available flow
    if (config.defaultFlow === id && updatedConfig.flows.length > 0) {
      updatedConfig.defaultFlow = updatedConfig.flows[0].id;
    } else if (updatedConfig.flows.length === 0) {
      updatedConfig.defaultFlow = undefined;
    }

    setConfig(updatedConfig);

    // Update active flow if needed
    if (activeFlowId === id) {
      setActiveFlowId(updatedConfig.flows.length > 0 ? updatedConfig.flows[0].id : null);
    }

    toast({
      title: "Flow Deleted",
      description: "The conversation flow has been deleted.",
    });
  };

  const handleAddStep = (flowId: string) => {
    if (!newStepQuestion) {
      toast({
        title: "Error",
        description: "Question is required.",
        variant: "destructive",
      });
      return;
    }

    const options = newStepOptions
      ? newStepOptions.split("\n").map((o) => o.trim()).filter((o) => o)
      : undefined;

    const newStep: ConversationStep = {
      id: `step-${Date.now()}`,
      question: newStepQuestion,
      description: newStepDescription || undefined,
      responseOptions: options,
      isRequired: newStepRequired,
    };

    const updatedFlows = config.flows.map((flow) => {
      if (flow.id === flowId) {
        return {
          ...flow,
          steps: [...flow.steps, newStep],
        };
      }
      return flow;
    });

    setConfig({
      ...config,
      flows: updatedFlows,
    });

    // Reset form
    setNewStepQuestion("");
    setNewStepDescription("");
    setNewStepOptions("");
    setNewStepRequired(true);

    toast({
      title: "Step Added",
      description: "The conversation step has been added.",
    });
  };

  const handleUpdateStep = (flowId: string) => {
    if (!editingStep) return;

    const updatedFlows = config.flows.map((flow) => {
      if (flow.id === flowId) {
        return {
          ...flow,
          steps: flow.steps.map((step) =>
            step.id === editingStep.id ? editingStep : step
          ),
        };
      }
      return flow;
    });

    setConfig({
      ...config,
      flows: updatedFlows,
    });

    setEditingStep(null);

    toast({
      title: "Step Updated",
      description: "The conversation step has been updated.",
    });
  };

  const handleDeleteStep = (flowId: string, stepId: string) => {
    const updatedFlows = config.flows.map((flow) => {
      if (flow.id === flowId) {
        return {
          ...flow,
          steps: flow.steps.filter((step) => step.id !== stepId),
        };
      }
      return flow;
    });

    // Also need to remove any nextStepLogic references to this step
    const cleanedFlows = updatedFlows.map((flow) => {
      if (flow.id === flowId) {
        return {
          ...flow,
          steps: flow.steps.map((step) => {
            if (step.nextStepLogic) {
              return {
                ...step,
                nextStepLogic: step.nextStepLogic.filter(
                  (logic) => logic.nextStepId !== stepId
                ),
              };
            }
            return step;
          }),
        };
      }
      return flow;
    });

    setConfig({
      ...config,
      flows: cleanedFlows,
    });

    toast({
      title: "Step Deleted",
      description: "The conversation step has been deleted.",
    });
  };

  const handleMoveStep = (flowId: string, stepId: string, direction: "up" | "down") => {
    const flowIndex = config.flows.findIndex((flow) => flow.id === flowId);
    if (flowIndex === -1) return;

    const flow = config.flows[flowIndex];
    const stepIndex = flow.steps.findIndex((step) => step.id === stepId);
    if (stepIndex === -1) return;

    // Can't move up if already at the top
    if (direction === "up" && stepIndex === 0) return;
    // Can't move down if already at the bottom
    if (direction === "down" && stepIndex === flow.steps.length - 1) return;

    const newSteps = [...flow.steps];
    const step = newSteps[stepIndex];
    newSteps.splice(stepIndex, 1);
    newSteps.splice(
      direction === "up" ? stepIndex - 1 : stepIndex + 1,
      0,
      step
    );

    const updatedFlows = [...config.flows];
    updatedFlows[flowIndex] = {
      ...flow,
      steps: newSteps,
    };

    setConfig({
      ...config,
      flows: updatedFlows,
    });
  };

  const handleDuplicateStep = (flowId: string, stepId: string) => {
    const flowIndex = config.flows.findIndex((flow) => flow.id === flowId);
    if (flowIndex === -1) return;

    const flow = config.flows[flowIndex];
    const stepIndex = flow.steps.findIndex((step) => step.id === stepId);
    if (stepIndex === -1) return;

    const originalStep = flow.steps[stepIndex];
    const duplicatedStep: ConversationStep = {
      ...originalStep,
      id: `step-${Date.now()}`,
      question: `${originalStep.question} (Copy)`,
    };

    const newSteps = [...flow.steps];
    newSteps.splice(stepIndex + 1, 0, duplicatedStep);

    const updatedFlows = [...config.flows];
    updatedFlows[flowIndex] = {
      ...flow,
      steps: newSteps,
    };

    setConfig({
      ...config,
      flows: updatedFlows,
    });

    toast({
      title: "Step Duplicated",
      description: "The conversation step has been duplicated.",
    });
  };

  const activeFlow = config.flows.find((flow) => flow.id === activeFlowId) || null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Multi-Step Interaction Flows
          </h2>
          <p className="text-muted-foreground">
            Configure guided conversation flows with sequential questions
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="flows">Conversation Flows</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Step Flow Settings</CardTitle>
              <CardDescription>
                Configure general settings for multi-step interaction flows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableMultiStepFlows">
                    Enable Multi-Step Flows
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow guided conversation flows with sequential questions
                  </p>
                </div>
                <Switch
                  id="enableMultiStepFlows"
                  checked={config.enableMultiStepFlows}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableMultiStepFlows: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowUserToSkip">Allow Users to Skip Steps</Label>
                  <p className="text-sm text-muted-foreground">
                    Let users skip non-required steps in the flow
                  </p>
                </div>
                <Switch
                  id="allowUserToSkip"
                  checked={config.allowUserToSkip}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, allowUserToSkip: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="rememberUserProgress">
                    Remember User Progress
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Save user progress in flows between sessions
                  </p>
                </div>
                <Switch
                  id="rememberUserProgress"
                  checked={config.rememberUserProgress}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, rememberUserProgress: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultFlow">Default Flow</Label>
                <Select
                  value={config.defaultFlow || ""}
                  onValueChange={(value) =>
                    setConfig({ ...config, defaultFlow: value || undefined })
                  }
                >
                  <SelectTrigger id="defaultFlow">
                    <SelectValue placeholder="Select default flow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {config.flows.map((flow) => (
                      <SelectItem key={flow.id} value={flow.id}>
                        {flow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  The default flow will be used when no specific flow is triggered
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversation Flows Tab */}
        <TabsContent value="flows" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {/* Flow List Sidebar */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Conversation Flows</CardTitle>
                <CardDescription>
                  Select a flow to edit or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {config.flows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No flows created yet. Create your first flow below.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {config.flows.map((flow) => (
                        <Button
                          key={flow.id}
                          variant={activeFlowId === flow.id ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => setActiveFlowId(flow.id)}
                        >
                          <div className="truncate">{flow.name}</div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Add New Flow</h4>
                  <div className="space-y-2">
                    <Input
                      placeholder="Flow Name"
                      value={newFlowName}
                      onChange={(e) => setNewFlowName(e.target.value)}
                    />
                    <Input
                      placeholder="Description (Optional)"
                      value={newFlowDescription}
                      onChange={(e) => setNewFlowDescription(e.target.value)}
                    />
                    <Input
                      placeholder="Trigger Keywords (comma-separated)"
                      value={newFlowKeywords}
                      onChange={(e) => setNewFlowKeywords(e.target.value)}
                    />
                    <Button
                      onClick={handleAddFlow}
                      className="w-full"
                      disabled={!newFlowName}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Flow
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Flow Editor */}
            <div className="col-span-3">
              {activeFlow ? (
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle>{activeFlow.name}</CardTitle>
                      <CardDescription>
                        {activeFlow.description || "No description provided"}
                      </CardDescription>
                      {activeFlow.triggerKeywords && activeFlow.triggerKeywords.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium">Triggers: </span>
                          <span className="text-xs text-muted-foreground">
                            {activeFlow.triggerKeywords.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingFlow(activeFlow)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit Flow
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFlow(activeFlow.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete Flow
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Conversation Steps</h3>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`flow-${activeFlow.id}-active`}
                            checked={activeFlow.isActive}
                            onCheckedChange={(checked) => {
                              const updatedFlows = config.flows.map((flow) =>
                                flow.id === activeFlow.id
                                  ? { ...flow, isActive: checked }
                                  : flow
                              );
                              setConfig({ ...config, flows: updatedFlows });
                            }}
                          />
                          <Label htmlFor={`flow-${activeFlow.id}-active`}>
                            Active
                          </Label>
                        </div>
                      </div>

                      {/* Steps List */}
                      {activeFlow.steps.length === 0 ? (
                        <div className="text-center p-8 border border-dashed rounded-md">
                          <p className="text-muted-foreground">
                            No steps added yet. Add your first step below.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activeFlow.steps.map((step, index) => (
                            <div
                              key={step.id}
                              className="border rounded-md p-4 space-y-2"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium flex items-center gap-2">
                                    Step {index + 1}:
                                    {step.isRequired && (
                                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                        Required
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-sm">{step.question}</p>
                                  {step.description && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {step.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  {index > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleMoveStep(activeFlow.id, step.id, "up")
                                      }
                                    >
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {index < activeFlow.steps.length - 1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleMoveStep(activeFlow.id, step.id, "down")
                                      }
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleDuplicateStep(activeFlow.id, step.id)
                                    }
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditingStep(step)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleDeleteStep(activeFlow.id, step.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {step.responseOptions && step.responseOptions.length > 0 && (
                                <div className="mt-2">
                                  <Label className="text-xs">Response Options:</Label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {step.responseOptions.map((option, i) => (
                                      <div
                                        key={i}
                                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                                      >
                                        {option}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {step.nextStepLogic && step.nextStepLogic.length > 0 && (
                                <div className="mt-2">
                                  <Label className="text-xs">Conditional Logic:</Label>
                                  <div className="space-y-1 mt-1">
                                    {step.nextStepLogic.map((logic, i) => {
                                      const nextStep = activeFlow.steps.find(
                                        (s) => s.id === logic.nextStepId
                                      );
                                      return (
                                        <div
                                          key={i}
                                          className="text-xs flex items-center gap-1"
                                        >
                                          <span>If response contains</span>
                                          <span className="font-medium bg-blue-100 px-1 rounded">
                                            {logic.responseContains}
                                          </span>
                                          <span>go to</span>
                                          <span className="font-medium bg-green-100 px-1 rounded">
                                            {nextStep
                                              ? `Step ${activeFlow.steps.indexOf(nextStep) + 1}`
                                              : "Unknown Step"}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add New Step Form */}
                      {!editingStep && (
                        <div className="border rounded-md p-4 space-y-4">
                          <h3 className="font-medium">Add New Step</h3>
                          <div className="space-y-2">
                            <Label htmlFor="stepQuestion">Question</Label>
                            <Input
                              id="stepQuestion"
                              value={newStepQuestion}
                              onChange={(e) => setNewStepQuestion(e.target.value)}
                              placeholder="E.g., What would you like to know about our product?"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="stepDescription">
                              Description (Optional)
                            </Label>
                            <Input
                              id="stepDescription"
                              value={newStepDescription}
                              onChange={(e) =>
                                setNewStepDescription(e.target.value)
                              }
                              placeholder="E.g., This helps us understand the user's interests"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="stepOptions">
                              Response Options (Optional)
                            </Label>
                            <Textarea
                              id="stepOptions"
                              value={newStepOptions}
                              onChange={(e) => setNewStepOptions(e.target.value)}
                              placeholder="Enter one option per line\nE.g., Features\nPricing\nSupport"
                              rows={3}
                            />
                            <p className="text-xs text-muted-foreground">
                              Enter one option per line. Leave empty for free-form responses.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              id="stepRequired"
                              checked={newStepRequired}
                              onCheckedChange={setNewStepRequired}
                            />
                            <Label htmlFor="stepRequired">Required Step</Label>
                          </div>
                          <Button
                            onClick={() => handleAddStep(activeFlow.id)}
                            disabled={!newStepQuestion}
                          >
                            <Plus className="h-4