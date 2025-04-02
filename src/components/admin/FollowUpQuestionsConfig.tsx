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
import { RefreshCw, Save, Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FollowUpQuestionsConfigProps {
  onSave?: (config: FollowUpConfig) => Promise<void>;
  initialConfig?: FollowUpConfig;
}

export interface FollowUpConfig {
  enableFollowUpQuestions: boolean;
  maxFollowUpQuestions: number;
  showFollowUpAs: "buttons" | "chips" | "list";
  generateAutomatically: boolean;
  predefinedQuestions: PredefinedQuestionSet[];
  topicBasedQuestions: TopicBasedQuestionSet[];
}

export interface PredefinedQuestionSet {
  id: string;
  name: string;
  description?: string;
  questions: string[];
  triggerKeywords?: string[];
}

export interface TopicBasedQuestionSet {
  id: string;
  topic: string;
  questions: string[];
}

const defaultConfig: FollowUpConfig = {
  enableFollowUpQuestions: true,
  maxFollowUpQuestions: 3,
  showFollowUpAs: "buttons",
  generateAutomatically: true,
  predefinedQuestions: [
    {
      id: "general",
      name: "General Follow-ups",
      description: "General follow-up questions for any topic",
      questions: [
        "Can you explain that in more detail?",
        "How does this apply to my situation?",
        "What are the next steps I should take?",
      ],
    },
    {
      id: "technical",
      name: "Technical Support",
      description: "Follow-up questions for technical issues",
      questions: [
        "What error messages are you seeing?",
        "Have you tried restarting the application?",
        "What version are you currently using?",
      ],
      triggerKeywords: ["error", "bug", "issue", "problem", "not working"],
    },
  ],
  topicBasedQuestions: [
    {
      id: "product",
      topic: "Product Information",
      questions: [
        "What features does this product have?",
        "How much does it cost?",
        "Is there a free trial available?",
      ],
    },
    {
      id: "billing",
      topic: "Billing",
      questions: [
        "How can I update my payment method?",
        "When will I be charged?",
        "How do I cancel my subscription?",
      ],
    },
  ],
};

const FollowUpQuestionsConfig: React.FC<FollowUpQuestionsConfigProps> = ({
  onSave,
  initialConfig = defaultConfig,
}) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<FollowUpConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);

  // For editing predefined question sets
  const [editingPredefined, setEditingPredefined] =
    useState<PredefinedQuestionSet | null>(null);
  const [newPredefinedName, setNewPredefinedName] = useState("");
  const [newPredefinedDescription, setNewPredefinedDescription] = useState("");
  const [newPredefinedQuestions, setNewPredefinedQuestions] = useState("");
  const [newPredefinedKeywords, setNewPredefinedKeywords] = useState("");

  // For editing topic-based question sets
  const [editingTopicBased, setEditingTopicBased] =
    useState<TopicBasedQuestionSet | null>(null);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicQuestions, setNewTopicQuestions] = useState("");

  const handleSave = async () => {
    if (!onSave) return;

    setIsLoading(true);
    try {
      await onSave(config);
      toast({
        title: "Success",
        description: "Follow-up questions configuration saved successfully.",
      });
    } catch (error) {
      console.error("Error saving follow-up questions configuration:", error);
      toast({
        title: "Error",
        description: "Failed to save follow-up questions configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPredefinedSet = () => {
    if (!newPredefinedName || !newPredefinedQuestions) {
      toast({
        title: "Error",
        description: "Name and at least one question are required.",
        variant: "destructive",
      });
      return;
    }

    const questions = newPredefinedQuestions
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q);

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "At least one valid question is required.",
        variant: "destructive",
      });
      return;
    }

    const keywords = newPredefinedKeywords
      ? newPredefinedKeywords.split(",").map((k) => k.trim())
      : undefined;

    const newSet: PredefinedQuestionSet = {
      id: `predefined-${Date.now()}`,
      name: newPredefinedName,
      description: newPredefinedDescription || undefined,
      questions,
      triggerKeywords: keywords,
    };

    setConfig({
      ...config,
      predefinedQuestions: [...config.predefinedQuestions, newSet],
    });

    // Reset form
    setNewPredefinedName("");
    setNewPredefinedDescription("");
    setNewPredefinedQuestions("");
    setNewPredefinedKeywords("");

    toast({
      title: "Question Set Added",
      description: `Predefined question set "${newPredefinedName}" has been added.`,
    });
  };

  const handleUpdatePredefinedSet = () => {
    if (!editingPredefined) return;

    const questions = editingPredefined.questions;

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "At least one valid question is required.",
        variant: "destructive",
      });
      return;
    }

    const updatedSets = config.predefinedQuestions.map((set) =>
      set.id === editingPredefined.id ? editingPredefined : set,
    );

    setConfig({
      ...config,
      predefinedQuestions: updatedSets,
    });

    setEditingPredefined(null);

    toast({
      title: "Question Set Updated",
      description: `Predefined question set "${editingPredefined.name}" has been updated.`,
    });
  };

  const handleDeletePredefinedSet = (id: string) => {
    setConfig({
      ...config,
      predefinedQuestions: config.predefinedQuestions.filter(
        (set) => set.id !== id,
      ),
    });

    toast({
      title: "Question Set Deleted",
      description: "The predefined question set has been deleted.",
    });
  };

  const handleAddTopicBasedSet = () => {
    if (!newTopicName || !newTopicQuestions) {
      toast({
        title: "Error",
        description: "Topic name and at least one question are required.",
        variant: "destructive",
      });
      return;
    }

    const questions = newTopicQuestions
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q);

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "At least one valid question is required.",
        variant: "destructive",
      });
      return;
    }

    const newSet: TopicBasedQuestionSet = {
      id: `topic-${Date.now()}`,
      topic: newTopicName,
      questions,
    };

    setConfig({
      ...config,
      topicBasedQuestions: [...config.topicBasedQuestions, newSet],
    });

    // Reset form
    setNewTopicName("");
    setNewTopicQuestions("");

    toast({
      title: "Topic Added",
      description: `Topic-based question set "${newTopicName}" has been added.`,
    });
  };

  const handleUpdateTopicBasedSet = () => {
    if (!editingTopicBased) return;

    const questions = editingTopicBased.questions;

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "At least one valid question is required.",
        variant: "destructive",
      });
      return;
    }

    const updatedSets = config.topicBasedQuestions.map((set) =>
      set.id === editingTopicBased.id ? editingTopicBased : set,
    );

    setConfig({
      ...config,
      topicBasedQuestions: updatedSets,
    });

    setEditingTopicBased(null);

    toast({
      title: "Topic Updated",
      description: `Topic-based question set "${editingTopicBased.topic}" has been updated.`,
    });
  };

  const handleDeleteTopicBasedSet = (id: string) => {
    setConfig({
      ...config,
      topicBasedQuestions: config.topicBasedQuestions.filter(
        (set) => set.id !== id,
      ),
    });

    toast({
      title: "Topic Deleted",
      description: "The topic-based question set has been deleted.",
    });
  };

  const handleAddQuestionToPredefined = (setId: string, question: string) => {
    if (!question.trim()) return;

    const updatedSets = config.predefinedQuestions.map((set) => {
      if (set.id === setId) {
        return {
          ...set,
          questions: [...set.questions, question.trim()],
        };
      }
      return set;
    });

    setConfig({
      ...config,
      predefinedQuestions: updatedSets,
    });
  };

  const handleRemoveQuestionFromPredefined = (setId: string, index: number) => {
    const updatedSets = config.predefinedQuestions.map((set) => {
      if (set.id === setId) {
        const newQuestions = [...set.questions];
        newQuestions.splice(index, 1);
        return {
          ...set,
          questions: newQuestions,
        };
      }
      return set;
    });

    setConfig({
      ...config,
      predefinedQuestions: updatedSets,
    });
  };

  const handleAddQuestionToTopic = (setId: string, question: string) => {
    if (!question.trim()) return;

    const updatedSets = config.topicBasedQuestions.map((set) => {
      if (set.id === setId) {
        return {
          ...set,
          questions: [...set.questions, question.trim()],
        };
      }
      return set;
    });

    setConfig({
      ...config,
      topicBasedQuestions: updatedSets,
    });
  };

  const handleRemoveQuestionFromTopic = (setId: string, index: number) => {
    const updatedSets = config.topicBasedQuestions.map((set) => {
      if (set.id === setId) {
        const newQuestions = [...set.questions];
        newQuestions.splice(index, 1);
        return {
          ...set,
          questions: newQuestions,
        };
      }
      return set;
    });

    setConfig({
      ...config,
      topicBasedQuestions: updatedSets,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Follow-Up Questions Configuration
          </h2>
          <p className="text-muted-foreground">
            Configure how follow-up questions are generated and displayed
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="predefined">Predefined Questions</TabsTrigger>
          <TabsTrigger value="topics">Topic-Based Questions</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Follow-Up Questions Settings</CardTitle>
              <CardDescription>
                Configure general settings for follow-up questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableFollowUpQuestions">
                    Enable Follow-Up Questions
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show follow-up questions after AI responses
                  </p>
                </div>
                <Switch
                  id="enableFollowUpQuestions"
                  checked={config.enableFollowUpQuestions}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableFollowUpQuestions: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="generateAutomatically">
                    Generate Automatically
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate follow-up questions based on context
                  </p>
                </div>
                <Switch
                  id="generateAutomatically"
                  checked={config.generateAutomatically}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, generateAutomatically: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxFollowUpQuestions">
                  Maximum Follow-Up Questions
                </Label>
                <Select
                  value={config.maxFollowUpQuestions.toString()}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      maxFollowUpQuestions: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="maxFollowUpQuestions">
                    <SelectValue placeholder="Select maximum questions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Question</SelectItem>
                    <SelectItem value="2">2 Questions</SelectItem>
                    <SelectItem value="3">3 Questions</SelectItem>
                    <SelectItem value="4">4 Questions</SelectItem>
                    <SelectItem value="5">5 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="showFollowUpAs">Display Style</Label>
                <Select
                  value={config.showFollowUpAs}
                  onValueChange={(value: "buttons" | "chips" | "list") =>
                    setConfig({ ...config, showFollowUpAs: value })
                  }
                >
                  <SelectTrigger id="showFollowUpAs">
                    <SelectValue placeholder="Select display style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buttons">Buttons</SelectItem>
                    <SelectItem value="chips">Chips</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  {config.showFollowUpAs === "buttons"
                    ? "Buttons: Larger, more prominent follow-up options"
                    : config.showFollowUpAs === "chips"
                      ? "Chips: Compact, pill-shaped options that take less space"
                      : "List: Simple text list of follow-up questions"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predefined Questions Tab */}
        <TabsContent value="predefined" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Predefined Question Sets</CardTitle>
              <CardDescription>
                Create sets of follow-up questions that can be triggered by
                keywords
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Predefined Question Sets List */}
                {config.predefinedQuestions.map((set) => (
                  <div key={set.id} className="border rounded-md p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{set.name}</h3>
                        {set.description && (
                          <p className="text-sm text-muted-foreground">
                            {set.description}
                          </p>
                        )}
                        {set.triggerKeywords &&
                          set.triggerKeywords.length > 0 && (
                            <div className="mt-1">
                              <span className="text-xs font-medium">
                                Triggers:{" "}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {set.triggerKeywords.join(", ")}
                              </span>
                            </div>
                          )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPredefined(set)}
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePredefinedSet(set.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Questions</Label>
                      <ul className="list-disc pl-5 space-y-1">
                        {set.questions.map((question, index) => (
                          <li key={index} className="text-sm">
                            {question}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}

                {/* Add New Predefined Question Set Form */}
                {!editingPredefined && (
                  <div className="border rounded-md p-4 space-y-4">
                    <h3 className="font-medium">Add New Question Set</h3>
                    <div className="space-y-2">
                      <Label htmlFor="predefinedName">Set Name</Label>
                      <Input
                        id="predefinedName"
                        value={newPredefinedName}
                        onChange={(e) => setNewPredefinedName(e.target.value)}
                        placeholder="E.g., Product Questions"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="predefinedDescription">
                        Description (Optional)
                      </Label>
                      <Input
                        id="predefinedDescription"
                        value={newPredefinedDescription}
                        onChange={(e) =>
                          setNewPredefinedDescription(e.target.value)
                        }
                        placeholder="E.g., Questions about product features and pricing"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="predefinedQuestions">Questions</Label>
                      <Textarea
                        id="predefinedQuestions"
                        value={newPredefinedQuestions}
                        onChange={(e) =>
                          setNewPredefinedQuestions(e.target.value)
                        }
                        placeholder="Enter one question per line\nE.g., What features does this product have?\nHow much does it cost?"
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter one question per line
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="predefinedKeywords">
                        Trigger Keywords (Optional)
                      </Label>
                      <Input
                        id="predefinedKeywords"
                        value={newPredefinedKeywords}
                        onChange={(e) =>
                          setNewPredefinedKeywords(e.target.value)
                        }
                        placeholder="product, pricing, features, plan"
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated keywords that will trigger these
                        questions
                      </p>
                    </div>
                    <Button onClick={handleAddPredefinedSet}>
                      <Plus className="h-4 w-4 mr-1" /> Add Question Set
                    </Button>
                  </div>
                )}

                {/* Edit Predefined Question Set Form */}
                {editingPredefined && (
                  <div className="border rounded-md p-4 space-y-4">
                    <h3 className="font-medium">Edit Question Set</h3>
                    <div className="space-y-2">
                      <Label htmlFor="editPredefinedName">Set Name</Label>
                      <Input
                        id="editPredefinedName"
                        value={editingPredefined.name}
                        onChange={(e) =>
                          setEditingPredefined({
                            ...editingPredefined,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editPredefinedDescription">
                        Description (Optional)
                      </Label>
                      <Input
                        id="editPredefinedDescription"
                        value={editingPredefined.description || ""}
                        onChange={(e) =>
                          setEditingPredefined({
                            ...editingPredefined,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Questions</Label>
                      <ul className="list-disc pl-5 space-y-2">
                        {editingPredefined.questions.map((question, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">{question}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setEditingPredefined({
                                  ...editingPredefined,
                                  questions: editingPredefined.questions.filter(
                                    (_, i) => i !== index,
                                  ),
                                })
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="newQuestion"
                          placeholder="Add a new question"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const input = e.currentTarget;
                              if (input.value.trim()) {
                                setEditingPredefined({
                                  ...editingPredefined,
                                  questions: [
                                    ...editingPredefined.questions,
                                    input.value.trim(),
                                  ],
                                });
                                input.value = "";
                              }
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            const input = document.getElementById(
                              "newQuestion",
                            ) as HTMLInputElement;
                            if (input && input.value.trim()) {
                              setEditingPredefined({
                                ...editingPredefined,
                                questions: [
                                  ...editingPredefined.questions,
                                  input.value.trim(),
                                ],
                              });
                              input.value = "";
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editPredefinedKeywords">
                        Trigger Keywords (Optional)
                      </Label>
                      <Input
                        id="editPredefinedKeywords"
                        value={
                          editingPredefined.triggerKeywords
                            ? editingPredefined.triggerKeywords.join(", ")
                            : ""
                        }
                        onChange={(e) =>
                          setEditingPredefined({
                            ...editingPredefined,
                            triggerKeywords: e.target.value
                              ? e.target.value.split(",").map((k) => k.trim())
                              : undefined,
                          })
                        }
                        placeholder="product, pricing, features, plan"
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated keywords that will trigger these
                        questions
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdatePredefinedSet}>
                        Update Question Set
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingPredefined(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topic-Based Questions Tab */}
        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Topic-Based Question Sets</CardTitle>
              <CardDescription>
                Create sets of follow-up questions for specific topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Topic-Based Question Sets List */}
                {config.topicBasedQuestions.map((set) => (
                  <div key={set.id} className="border rounded-md p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{set.topic}</h3>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTopicBased(set)}
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTopicBasedSet(set.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Questions</Label>
                      <ul className="list-disc pl-5 space-y-1">
                        {set.questions.map((question, index) => (
                          <li key={index} className="text-sm">
                            {question}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}

                {/* Add New Topic-Based Question Set Form */}
                {!editingTopicBased && (
                  <div className="border rounded-md p-4 space-y-4">
                    <h3 className="font-medium">Add New Topic</h3>
                    <div className="space-y-2">
                      <Label htmlFor="topicName">Topic Name</Label>
                      <Input
                        id="topicName"
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        placeholder="E.g., Customer Support"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="topicQuestions">Questions</Label>
                      <Textarea
                        id="topicQuestions"
                        value={newTopicQuestions}
                        onChange={(e) => setNewTopicQuestions(e.target.value)}
                        placeholder="Enter one question per line\nE.g., How can I contact support?\nWhat are your support hours?"
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter one question per line
                      </p>
                    </div>
                    <Button onClick={handleAddTopicBasedSet}>
                      <Plus className="h-4 w-4 mr-1" /> Add Topic
                    </Button>
                  </div>
                )}

                {/* Edit Topic-Based Question Set Form */}
                {editingTopicBased && (
                  <div className="border rounded-md p-4 space-y-4">
                    <h3 className="font-medium">Edit Topic</h3>
                    <div className="space-y-2">
                      <Label htmlFor="editTopicName">Topic Name</Label>
                      <Input
                        id="editTopicName"
                        value={editingTopicBased.topic}
                        onChange={(e) =>
                          setEditingTopicBased({
                            ...editingTopicBased,
                            topic: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Questions</Label>
                      <ul className="list-disc pl-5 space-y-2">
                        {editingTopicBased.questions.map((question, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">{question}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setEditingTopicBased({
                                  ...editingTopicBased,
                                  questions: editingTopicBased.questions.filter(
                                    (_, i) => i !== index,
                                  ),
                                })
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="newTopicQuestion"
                          placeholder="Add a new question"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const input = e.currentTarget;
                              if (input.value.trim()) {
                                setEditingTopicBased({
                                  ...editingTopicBased,
                                  questions: [
                                    ...editingTopicBased.questions,
                                    input.value.trim(),
                                  ],
                                });
                                input.value = "";
                              }
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            const input = document.getElementById(
                              "newTopicQuestion",
                            ) as HTMLInputElement;
                            if (input && input.value.trim()) {
                              setEditingTopicBased({
                                ...editingTopicBased,
                                questions: [
                                  ...editingTopicBased.questions,
                                  input.value.trim(),
                                ],
                              });
                              input.value = "";
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateTopicBasedSet}>
                        Update Topic
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingTopicBased(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
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
  );
};

export default FollowUpQuestionsConfig;
