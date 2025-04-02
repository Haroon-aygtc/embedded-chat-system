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
import { RefreshCw, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ResponseFormattingOptionsProps {
  onSave?: (config: ResponseFormattingConfig) => Promise<void>;
  initialConfig?: ResponseFormattingConfig;
}

export interface ResponseFormattingConfig {
  enableMarkdown: boolean;
  defaultHeadingLevel: number;
  enableBulletPoints: boolean;
  enableNumberedLists: boolean;
  enableEmphasis: boolean;
  responseVariability: "concise" | "balanced" | "detailed";
  customTemplates: ResponseTemplate[];
  defaultTemplate?: string;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  template: string;
  description?: string;
}

const defaultConfig: ResponseFormattingConfig = {
  enableMarkdown: true,
  defaultHeadingLevel: 2,
  enableBulletPoints: true,
  enableNumberedLists: true,
  enableEmphasis: true,
  responseVariability: "balanced",
  customTemplates: [
    {
      id: "default",
      name: "Default Template",
      template: "# {title}\n\n{content}\n\n## Summary\n{summary}",
      description: "Standard response format with title, content and summary",
    },
    {
      id: "concise",
      name: "Concise Template",
      template: "**{title}**\n{content}",
      description: "Brief format with just the essential information",
    },
  ],
  defaultTemplate: "default",
};

const ResponseFormattingOptions: React.FC<ResponseFormattingOptionsProps> = ({
  onSave,
  initialConfig = defaultConfig,
}) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<ResponseFormattingConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<ResponseTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");

  const handleSave = async () => {
    if (!onSave) return;

    setIsLoading(true);
    try {
      await onSave(config);
      toast({
        title: "Success",
        description: "Response formatting options saved successfully.",
      });
    } catch (error) {
      console.error("Error saving response formatting options:", error);
      toast({
        title: "Error",
        description: "Failed to save response formatting options.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTemplate = () => {
    if (!newTemplateName || !newTemplateContent) {
      toast({
        title: "Error",
        description: "Template name and content are required.",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: ResponseTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplateName,
      template: newTemplateContent,
      description: newTemplateDescription || undefined,
    };

    setConfig({
      ...config,
      customTemplates: [...config.customTemplates, newTemplate],
    });

    // Reset form
    setNewTemplateName("");
    setNewTemplateDescription("");
    setNewTemplateContent("");

    toast({
      title: "Template Added",
      description: `Template "${newTemplateName}" has been added.`,
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    // Don't allow deleting the default template
    if (templateId === "default") {
      toast({
        title: "Cannot Delete",
        description: "The default template cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    // Update default template if needed
    let updatedConfig = {
      ...config,
      customTemplates: config.customTemplates.filter(
        (t) => t.id !== templateId,
      ),
    };

    // If we're deleting the current default template, set it to the first available template
    if (
      config.defaultTemplate === templateId &&
      updatedConfig.customTemplates.length > 0
    ) {
      updatedConfig.defaultTemplate = updatedConfig.customTemplates[0].id;
    }

    setConfig(updatedConfig);

    toast({
      title: "Template Deleted",
      description: "The template has been deleted.",
    });
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;

    const updatedTemplates = config.customTemplates.map((t) =>
      t.id === editingTemplate.id ? editingTemplate : t,
    );

    setConfig({
      ...config,
      customTemplates: updatedTemplates,
    });

    setEditingTemplate(null);

    toast({
      title: "Template Updated",
      description: `Template "${editingTemplate.name}" has been updated.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Response Formatting Options
          </h2>
          <p className="text-muted-foreground">
            Configure how AI responses are formatted and structured
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="templates">Response Templates</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Formatting Options</CardTitle>
              <CardDescription>
                Configure basic formatting options for AI responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableMarkdown">Enable Markdown</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow AI to use Markdown formatting in responses
                  </p>
                </div>
                <Switch
                  id="enableMarkdown"
                  checked={config.enableMarkdown}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableMarkdown: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableBulletPoints">
                    Enable Bullet Points
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow AI to use bullet points in responses
                  </p>
                </div>
                <Switch
                  id="enableBulletPoints"
                  checked={config.enableBulletPoints}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableBulletPoints: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableNumberedLists">
                    Enable Numbered Lists
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow AI to use numbered lists in responses
                  </p>
                </div>
                <Switch
                  id="enableNumberedLists"
                  checked={config.enableNumberedLists}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableNumberedLists: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableEmphasis">Enable Emphasis</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow AI to use bold and italic text for emphasis
                  </p>
                </div>
                <Switch
                  id="enableEmphasis"
                  checked={config.enableEmphasis}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableEmphasis: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultHeadingLevel">
                  Default Heading Level
                </Label>
                <Select
                  value={config.defaultHeadingLevel.toString()}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      defaultHeadingLevel: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="defaultHeadingLevel">
                    <SelectValue placeholder="Select heading level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">H1 (Largest)</SelectItem>
                    <SelectItem value="2">H2</SelectItem>
                    <SelectItem value="3">H3</SelectItem>
                    <SelectItem value="4">H4</SelectItem>
                    <SelectItem value="5">H5</SelectItem>
                    <SelectItem value="6">H6 (Smallest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responseVariability">
                  Response Variability
                </Label>
                <Select
                  value={config.responseVariability}
                  onValueChange={(value: "concise" | "balanced" | "detailed") =>
                    setConfig({ ...config, responseVariability: value })
                  }
                >
                  <SelectTrigger id="responseVariability">
                    <SelectValue placeholder="Select response style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  {config.responseVariability === "concise"
                    ? "Concise: Brief responses with just the essential information"
                    : config.responseVariability === "balanced"
                      ? "Balanced: Moderate detail with clear explanations"
                      : "Detailed: Comprehensive responses with examples and context"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultTemplate">Default Template</Label>
                <Select
                  value={config.defaultTemplate || "default"}
                  onValueChange={(value) =>
                    setConfig({ ...config, defaultTemplate: value })
                  }
                >
                  <SelectTrigger id="defaultTemplate">
                    <SelectValue placeholder="Select default template" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.customTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Templates</CardTitle>
              <CardDescription>
                Create and manage templates for structured AI responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Template List */}
                <div className="border rounded-md">
                  {config.customTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 border-b last:border-b-0 flex justify-between items-start"
                    >
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        )}
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {template.template.length > 100
                            ? `${template.template.substring(0, 100)}...`
                            : template.template}
                        </pre>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          disabled={template.id === "default"}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Template Form */}
                {!editingTemplate && (
                  <div className="border rounded-md p-4 space-y-4">
                    <h3 className="font-medium">Add New Template</h3>
                    <div className="space-y-2">
                      <Label htmlFor="templateName">Template Name</Label>
                      <Input
                        id="templateName"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="E.g., Technical Response"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="templateDescription">
                        Description (Optional)
                      </Label>
                      <Input
                        id="templateDescription"
                        value={newTemplateDescription}
                        onChange={(e) =>
                          setNewTemplateDescription(e.target.value)
                        }
                        placeholder="E.g., Detailed technical explanation with code examples"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="templateContent">Template Content</Label>
                      <Textarea
                        id="templateContent"
                        value={newTemplateContent}
                        onChange={(e) => setNewTemplateContent(e.target.value)}
                        placeholder="# {title}\n\n{content}\n\n## Code Example\n```\n{code}\n```"
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use placeholders like {"{title}"}, {"{content}"},{" "}
                        {"{summary}"} that will be replaced with actual content.
                      </p>
                    </div>
                    <Button onClick={handleAddTemplate}>Add Template</Button>
                  </div>
                )}

                {/* Edit Template Form */}
                {editingTemplate && (
                  <div className="border rounded-md p-4 space-y-4">
                    <h3 className="font-medium">Edit Template</h3>
                    <div className="space-y-2">
                      <Label htmlFor="editTemplateName">Template Name</Label>
                      <Input
                        id="editTemplateName"
                        value={editingTemplate.name}
                        onChange={(e) =>
                          setEditingTemplate({
                            ...editingTemplate,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editTemplateDescription">
                        Description (Optional)
                      </Label>
                      <Input
                        id="editTemplateDescription"
                        value={editingTemplate.description || ""}
                        onChange={(e) =>
                          setEditingTemplate({
                            ...editingTemplate,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editTemplateContent">
                        Template Content
                      </Label>
                      <Textarea
                        id="editTemplateContent"
                        value={editingTemplate.template}
                        onChange={(e) =>
                          setEditingTemplate({
                            ...editingTemplate,
                            template: e.target.value,
                          })
                        }
                        rows={6}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateTemplate}>
                        Update Template
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingTemplate(null)}
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

export default ResponseFormattingOptions;
