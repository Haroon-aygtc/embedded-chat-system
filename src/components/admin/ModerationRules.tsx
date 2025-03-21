import { useState, useEffect } from "react";
import moderationService, {
  ModerationRule,
} from "@/services/moderationService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertCircle, Plus, Edit, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function ModerationRules() {
  const [rules, setRules] = useState<ModerationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState<Partial<ModerationRule>>({});
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<{
    isAllowed: boolean;
    flagged: boolean;
    modifiedContent?: string;
  } | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const rules = await moderationService.getRules();
      setRules(rules);
    } catch (error) {
      console.error("Error loading moderation rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    setCurrentRule({
      name: "",
      description: "",
      pattern: "",
      action: "flag",
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleEditRule = (rule: ModerationRule) => {
    setCurrentRule(rule);
    setDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!currentRule.name || !currentRule.pattern) {
      return; // Validation would be better in a real app
    }

    try {
      await moderationService.saveRule(currentRule as any);
      setDialogOpen(false);
      loadRules();
    } catch (error) {
      console.error("Error saving rule:", error);
    }
  };

  const handleTestRule = async () => {
    if (!testInput) return;

    try {
      // For testing purposes, we'll use a dummy user ID
      const result = await moderationService.checkContent(
        testInput,
        "test-user",
      );
      setTestResult(result);
    } catch (error) {
      console.error("Error testing rule:", error);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "flag":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Flag
          </Badge>
        );
      case "block":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Block
          </Badge>
        );
      case "replace":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Replace
          </Badge>
        );
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Moderation Rules</h1>
        <Button onClick={handleCreateRule}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No moderation rules defined. Create your first rule to start
                moderating content.
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-250px)]">
              {rules.map((rule) => (
                <Card
                  key={rule.id}
                  className={`mb-4 ${!rule.isActive ? "opacity-60" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{rule.name}</CardTitle>
                          {getActionLabel(rule.action)}
                          {!rule.isActive && (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {rule.description}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditRule(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Pattern:</p>
                        <code className="text-sm mt-1 block p-2 bg-gray-100 rounded">
                          {rule.pattern}
                        </code>
                      </div>
                      {rule.action === "replace" && rule.replacement && (
                        <div>
                          <p className="text-sm font-medium">Replacement:</p>
                          <p className="text-sm mt-1">{rule.replacement}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Test Moderation</CardTitle>
              <CardDescription>
                Test how your moderation rules will affect content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-input">Sample Content</Label>
                  <Textarea
                    id="test-input"
                    placeholder="Enter content to test against moderation rules..."
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    rows={5}
                  />
                </div>
                <Button onClick={handleTestRule} className="w-full">
                  Test Content
                </Button>

                {testResult && (
                  <div className="mt-4 p-4 border rounded-md">
                    <h3 className="font-medium mb-2">Test Results:</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Status:</span>
                        {testResult.isAllowed ? (
                          <Badge className="bg-green-100 text-green-800">
                            Allowed
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            Blocked
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Flagged:</span>
                        {testResult.flagged ? (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Yes
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100">No</Badge>
                        )}
                      </div>
                      {testResult.modifiedContent && (
                        <div>
                          <p className="font-medium">Modified Content:</p>
                          <p className="mt-1 p-2 bg-gray-100 rounded text-sm">
                            {testResult.modifiedContent}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentRule.id ? "Edit Rule" : "Create Rule"}
            </DialogTitle>
            <DialogDescription>
              Define how content should be moderated based on pattern matching.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={currentRule.name || ""}
                onChange={(e) =>
                  setCurrentRule({ ...currentRule, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={currentRule.description || ""}
                onChange={(e) =>
                  setCurrentRule({
                    ...currentRule,
                    description: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pattern" className="text-right">
                Pattern (Regex)
              </Label>
              <Input
                id="pattern"
                value={currentRule.pattern || ""}
                onChange={(e) =>
                  setCurrentRule({ ...currentRule, pattern: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="action" className="text-right">
                Action
              </Label>
              <Select
                value={currentRule.action || "flag"}
                onValueChange={(value) =>
                  setCurrentRule({ ...currentRule, action: value as any })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flag">Flag for review</SelectItem>
                  <SelectItem value="block">Block content</SelectItem>
                  <SelectItem value="replace">Replace text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currentRule.action === "replace" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="replacement" className="text-right">
                  Replacement
                </Label>
                <Input
                  id="replacement"
                  value={currentRule.replacement || ""}
                  onChange={(e) =>
                    setCurrentRule({
                      ...currentRule,
                      replacement: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Active
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={currentRule.isActive}
                  onCheckedChange={(checked) =>
                    setCurrentRule({ ...currentRule, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">
                  {currentRule.isActive ? "Enabled" : "Disabled"}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule}>
              {currentRule.id ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
