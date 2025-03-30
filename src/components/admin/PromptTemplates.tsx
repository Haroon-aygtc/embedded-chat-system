import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PromptTemplate } from "@/types/promptTemplates";
import promptTemplateService from "@/services/promptTemplateService";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash2, Plus, RefreshCw, Check, X } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().optional(),
  template: z
    .string()
    .min(10, { message: "Template must be at least 10 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const PromptTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<PromptTemplate | null>(
    null,
  );
  const [previewVariables, setPreviewVariables] = useState<
    Record<string, string>
  >({});
  const [previewResult, setPreviewResult] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      template: "",
      category: "",
      variables: [],
      isActive: true,
    },
  });

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await promptTemplateService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load prompt templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await promptTemplateService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleCreateTemplate = async (values: FormValues) => {
    try {
      // Extract variables from template if not provided
      if (!values.variables || values.variables.length === 0) {
        values.variables = promptTemplateService.extractVariables(
          values.template,
        );
      }

      const newTemplate = await promptTemplateService.createTemplate({
        name: values.name,
        description: values.description || "",
        template: values.template,
        category: values.category,
        variables: values.variables,
        isActive: values.isActive,
      });

      if (newTemplate) {
        setTemplates([...templates, newTemplate]);
        toast({
          title: "Success",
          description: "Prompt template created successfully",
        });
        form.reset();
        setShowForm(false);

        // Update categories if a new one was added
        if (!categories.includes(values.category)) {
          setCategories([...categories, values.category]);
        }
      }
    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: "Failed to create prompt template",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTemplate = async (values: FormValues) => {
    if (!editingTemplate) return;

    try {
      // Extract variables from template if not provided
      if (!values.variables || values.variables.length === 0) {
        values.variables = promptTemplateService.extractVariables(
          values.template,
        );
      }

      const updatedTemplate = await promptTemplateService.updateTemplate(
        editingTemplate.id,
        {
          name: values.name,
          description: values.description,
          template: values.template,
          category: values.category,
          variables: values.variables,
          isActive: values.isActive,
        },
      );

      if (updatedTemplate) {
        setTemplates(
          templates.map((t) =>
            t.id === updatedTemplate.id ? updatedTemplate : t,
          ),
        );
        toast({
          title: "Success",
          description: "Prompt template updated successfully",
        });
        setEditingTemplate(null);
        form.reset();
        setShowForm(false);

        // Update categories if a new one was added
        if (!categories.includes(values.category)) {
          setCategories([...categories, values.category]);
        }
      }
    } catch (error) {
      console.error("Error updating template:", error);
      toast({
        title: "Error",
        description: "Failed to update prompt template",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const success = await promptTemplateService.deleteTemplate(id);
      if (success) {
        setTemplates(templates.filter((t) => t.id !== id));
        toast({
          title: "Success",
          description: "Prompt template deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete prompt template",
        variant: "destructive",
      });
    }
  };

  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      description: template.description,
      template: template.template,
      category: template.category,
      variables: template.variables,
      isActive: template.isActive || true,
    });
    setShowForm(true);
  };

  const handlePreviewTemplate = (template: PromptTemplate) => {
    setPreviewTemplate(template);

    // Initialize preview variables with empty values
    const vars: Record<string, string> = {};
    template.variables.forEach((v) => {
      vars[v] = "";
    });
    setPreviewVariables(vars);
    setPreviewResult("");
  };

  const handleApplyPreview = async () => {
    if (!previewTemplate) return;

    try {
      const result = await promptTemplateService.applyTemplate({
        templateId: previewTemplate.id,
        variables: previewVariables,
      });

      setPreviewResult(result || "Error applying template");
    } catch (error) {
      console.error("Error previewing template:", error);
      setPreviewResult("Error: Failed to apply template");
    }
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    form.reset({
      name: "",
      description: "",
      template: "",
      category: categories.length > 0 ? categories[0] : "",
      variables: [],
      isActive: true,
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    form.reset();
    setShowForm(false);
  };

  const filteredTemplates =
    activeTab === "all"
      ? templates
      : templates.filter((t) => t.category === activeTab);

  const handleExtractVariables = () => {
    const template = form.getValues("template");
    const extractedVars = promptTemplateService.extractVariables(template);
    form.setValue("variables", extractedVars);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Prompt Templates</h2>
        <Button onClick={handleNewTemplate}>
          <Plus className="mr-2 h-4 w-4" /> New Template
        </Button>
      </div>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </CardTitle>
            <CardDescription>
              {editingTemplate
                ? "Update the existing prompt template"
                : "Create a new prompt template for AI responses"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(
                  editingTemplate ? handleUpdateTemplate : handleCreateTemplate,
                )}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Template name" {...field} />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for the template
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                            <SelectItem value="new-category">
                              + Add new category
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {field.value === "new-category" && (
                          <Input
                            className="mt-2"
                            placeholder="New category name"
                            onChange={(e) => {
                              form.setValue("category", e.target.value);
                            }}
                          />
                        )}
                        <FormDescription>
                          Group templates by category
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the purpose and usage of this template"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description to help users understand when to
                        use this template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the template with variables in {{variable}} format"
                          className="min-h-[200px] font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="flex justify-between">
                        <span>Use {{ variable }} syntax for variables</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleExtractVariables}
                        >
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Extract Variables
                        </Button>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="variables"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variables</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                          {field.value?.map((variable, index) => (
                            <div
                              key={index}
                              className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center"
                            >
                              <span>{variable}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 ml-2"
                                onClick={() => {
                                  const newVariables = [...(field.value || [])];
                                  newVariables.splice(index, 1);
                                  form.setValue("variables", newVariables);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {(field.value?.length || 0) === 0 && (
                            <span className="text-muted-foreground text-sm">
                              No variables extracted yet. Click "Extract
                              Variables" to detect them from your template.
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Variables will be automatically extracted from the
                        template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Only active templates can be used in AI responses
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTemplate ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Templates</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-10 border rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    No prompt templates found in this category
                  </p>
                  <Button onClick={handleNewTemplate}>
                    <Plus className="mr-2 h-4 w-4" /> Create Template
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id} className="flex flex-col">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {template.name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Category: {template.category}
                            </CardDescription>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground mb-2">
                          {template.description || "No description provided"}
                        </p>
                        <div className="bg-muted p-2 rounded-md text-xs font-mono overflow-hidden text-ellipsis max-h-24">
                          {template.template.length > 150
                            ? `${template.template.substring(0, 150)}...`
                            : template.template}
                        </div>
                        {template.variables.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold mb-1">
                              Variables:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {template.variables.map((variable, index) => (
                                <span
                                  key={index}
                                  className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full"
                                >
                                  {variable}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          Preview & Test
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {previewTemplate && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  Preview: {previewTemplate.name}
                </CardTitle>
                <CardDescription>
                  Test how this template works with different variable values
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted p-3 rounded-md">
                    <p className="font-mono text-sm whitespace-pre-wrap">
                      {previewTemplate.template}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Variables</h4>
                    {previewTemplate.variables.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {previewTemplate.variables.map((variable) => (
                          <div key={variable} className="space-y-1">
                            <label className="text-sm">{variable}</label>
                            <Input
                              placeholder={`Value for ${variable}`}
                              value={previewVariables[variable] || ""}
                              onChange={(e) => {
                                setPreviewVariables({
                                  ...previewVariables,
                                  [variable]: e.target.value,
                                });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No variables in this template
                      </p>
                    )}
                  </div>

                  <Button onClick={handleApplyPreview}>Apply Template</Button>

                  {previewResult && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-semibold">Result</h4>
                      <div className="bg-secondary p-3 rounded-md">
                        <p className="whitespace-pre-wrap">{previewResult}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  onClick={() => setPreviewTemplate(null)}
                >
                  Close Preview
                </Button>
              </CardFooter>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default PromptTemplates;
