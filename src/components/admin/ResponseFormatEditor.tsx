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
import { useToast } from "@/components/ui/use-toast";
import {
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  Check,
  X,
  Code,
  FileJson,
  Layout,
  Palette,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import responseFormatService from "@/services/responseFormatService";
import { ResponseFormat } from "@/types/responseFormat";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().optional(),
  formatType: z.enum(["json", "markdown", "html", "text"]),
  template: z
    .string()
    .min(10, { message: "Template must be at least 10 characters" }),
  isActive: z.boolean().default(true),
  brandingEnabled: z.boolean().default(false),
  brandName: z.string().optional(),
  brandColor: z.string().optional(),
  brandLogo: z.string().optional(),
  structuredData: z.boolean().default(false),
  dataSchema: z.string().optional(),
  variables: z.array(z.string()).optional(),
  contextRuleId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ResponseFormatEditor: React.FC = () => {
  const [formats, setFormats] = useState<ResponseFormat[]>([]);
  const [categories, setCategories] = useState<string[]>([
    "General",
    "Customer Support",
    "Technical",
    "Marketing",
  ]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editingFormat, setEditingFormat] = useState<ResponseFormat | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<ResponseFormat | null>(
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
      formatType: "json",
      template: "",
      isActive: true,
      brandingEnabled: false,
      brandName: "",
      brandColor: "#3b82f6",
      brandLogo: "",
      structuredData: false,
      dataSchema: "",
      variables: [],
      contextRuleId: "",
    },
  });

  useEffect(() => {
    fetchFormats();
  }, []);

  const fetchFormats = async () => {
    setLoading(true);
    try {
      const data = await responseFormatService.getAllFormats();
      setFormats(data);
    } catch (error) {
      console.error("Error fetching response formats:", error);
      toast({
        title: "Error",
        description: "Failed to load response formats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFormat = async (values: FormValues) => {
    try {
      // Extract variables from template if not provided
      if (!values.variables || values.variables.length === 0) {
        values.variables = extractVariables(values.template);
      }

      const newFormat = await responseFormatService.createFormat({
        name: values.name,
        description: values.description || "",
        formatType: values.formatType,
        template: values.template,
        isActive: values.isActive,
        brandingEnabled: values.brandingEnabled,
        brandName: values.brandName,
        brandColor: values.brandColor,
        brandLogo: values.brandLogo,
        structuredData: values.structuredData,
        dataSchema: values.dataSchema,
        variables: values.variables,
        contextRuleId: values.contextRuleId,
      });

      if (newFormat) {
        setFormats([...formats, newFormat]);
        toast({
          title: "Success",
          description: "Response format created successfully",
        });
        form.reset();
        setShowForm(false);
      }
    } catch (error) {
      console.error("Error creating format:", error);
      toast({
        title: "Error",
        description: "Failed to create response format",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFormat = async (values: FormValues) => {
    if (!editingFormat) return;

    try {
      // Extract variables from template if not provided
      if (!values.variables || values.variables.length === 0) {
        values.variables = extractVariables(values.template);
      }

      const updatedFormat = await responseFormatService.updateFormat(
        editingFormat.id,
        {
          name: values.name,
          description: values.description,
          formatType: values.formatType,
          template: values.template,
          isActive: values.isActive,
          brandingEnabled: values.brandingEnabled,
          brandName: values.brandName,
          brandColor: values.brandColor,
          brandLogo: values.brandLogo,
          structuredData: values.structuredData,
          dataSchema: values.dataSchema,
          variables: values.variables,
          contextRuleId: values.contextRuleId,
        },
      );

      if (updatedFormat) {
        setFormats(
          formats.map((f) => (f.id === updatedFormat.id ? updatedFormat : f)),
        );
        toast({
          title: "Success",
          description: "Response format updated successfully",
        });
        setEditingFormat(null);
        form.reset();
        setShowForm(false);
      }
    } catch (error) {
      console.error("Error updating format:", error);
      toast({
        title: "Error",
        description: "Failed to update response format",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFormat = async (id: string) => {
    if (!confirm("Are you sure you want to delete this format?")) return;

    try {
      const success = await responseFormatService.deleteFormat(id);
      if (success) {
        setFormats(formats.filter((f) => f.id !== id));
        toast({
          title: "Success",
          description: "Response format deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error deleting format:", error);
      toast({
        title: "Error",
        description: "Failed to delete response format",
        variant: "destructive",
      });
    }
  };

  const handleEditFormat = (format: ResponseFormat) => {
    setEditingFormat(format);
    form.reset({
      name: format.name,
      description: format.description,
      formatType: format.formatType,
      template: format.template,
      isActive: format.isActive,
      brandingEnabled: format.brandingEnabled || false,
      brandName: format.brandName || "",
      brandColor: format.brandColor || "#3b82f6",
      brandLogo: format.brandLogo || "",
      structuredData: format.structuredData || false,
      dataSchema: format.dataSchema || "",
      variables: format.variables || [],
      contextRuleId: format.contextRuleId || "",
    });
    setShowForm(true);
  };

  const handlePreviewFormat = (format: ResponseFormat) => {
    setPreviewFormat(format);

    // Initialize preview variables with empty values
    const vars: Record<string, string> = {};
    format.variables.forEach((v) => {
      vars[v] = "";
    });
    setPreviewVariables(vars);
    setPreviewResult("");
  };

  const handleApplyPreview = async () => {
    if (!previewFormat) return;

    try {
      const result = await responseFormatService.applyFormat({
        formatId: previewFormat.id,
        variables: previewVariables,
        sampleContent:
          "This is a sample AI response content that will be formatted according to the template.",
      });

      setPreviewResult(result || "Error applying format");
    } catch (error) {
      console.error("Error previewing format:", error);
      setPreviewResult("Error: Failed to apply format");
    }
  };

  const handleNewFormat = () => {
    setEditingFormat(null);
    form.reset({
      name: "",
      description: "",
      formatType: "json",
      template: "",
      isActive: true,
      brandingEnabled: false,
      brandName: "",
      brandColor: "#3b82f6",
      brandLogo: "",
      structuredData: false,
      dataSchema: "",
      variables: [],
      contextRuleId: "",
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingFormat(null);
    form.reset();
    setShowForm(false);
  };

  const extractVariables = (template: string): string[] => {
    const regex = /\{\{\s*([\w\.]+)\s*\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  };

  const handleExtractVariables = () => {
    const template = form.getValues("template");
    const extractedVars = extractVariables(template);
    form.setValue("variables", extractedVars);
  };

  const getFormatTypeIcon = (type: string) => {
    switch (type) {
      case "json":
        return <FileJson className="h-4 w-4" />;
      case "markdown":
        return <Code className="h-4 w-4" />;
      case "html":
        return <Layout className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Response Formats</h2>
        <Button onClick={handleNewFormat}>
          <Plus className="mr-2 h-4 w-4" /> New Format
        </Button>
      </div>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingFormat ? "Edit Format" : "Create New Format"}
            </CardTitle>
            <CardDescription>
              {editingFormat
                ? "Update the existing response format"
                : "Create a new format for AI responses"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(
                  editingFormat ? handleUpdateFormat : handleCreateFormat,
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
                          <Input placeholder="Format name" {...field} />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for the format
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="formatType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a format type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="json">
                              <div className="flex items-center">
                                <FileJson className="mr-2 h-4 w-4" />
                                JSON
                              </div>
                            </SelectItem>
                            <SelectItem value="markdown">
                              <div className="flex items-center">
                                <Code className="mr-2 h-4 w-4" />
                                Markdown
                              </div>
                            </SelectItem>
                            <SelectItem value="html">
                              <div className="flex items-center">
                                <Layout className="mr-2 h-4 w-4" />
                                HTML
                              </div>
                            </SelectItem>
                            <SelectItem value="text">
                              <div className="flex items-center">
                                <Code className="mr-2 h-4 w-4" />
                                Plain Text
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The output format for AI responses
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
                          placeholder="Describe the purpose and usage of this format"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description to help users understand when to
                        use this format
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Tabs defaultValue="template" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="template">Template</TabsTrigger>
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                    <TabsTrigger value="data">Data Structure</TabsTrigger>
                  </TabsList>

                  <TabsContent value="template" className="space-y-4">
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
                                      const newVariables = [
                                        ...(field.value || []),
                                      ];
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
                  </TabsContent>

                  <TabsContent value="branding" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="brandingEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Enable Branding</FormLabel>
                            <FormDescription>
                              Apply custom branding to AI responses
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("brandingEnabled") && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="brandName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Brand Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your brand name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="brandColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Brand Color</FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input
                                    type="color"
                                    {...field}
                                    className="w-12 h-8 p-1"
                                  />
                                </FormControl>
                                <Input
                                  value={field.value}
                                  onChange={field.onChange}
                                  className="flex-1"
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="brandLogo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Brand Logo URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/logo.png"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                URL to your brand logo image
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="data" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="structuredData"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Enable Structured Data</FormLabel>
                            <FormDescription>
                              Define a schema for structured data output
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("structuredData") && (
                      <FormField
                        control={form.control}
                        name="dataSchema"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Schema (JSON)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder='{"type":"object","properties":{"title":{"type":"string"},"content":{"type":"string"}}}'
                                className="min-h-[200px] font-mono"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              JSON Schema that defines the structure of the data
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </TabsContent>
                </Tabs>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Only active formats can be used in AI responses
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
                    {editingFormat ? "Update" : "Create"}
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
              <TabsTrigger value="all">All Formats</TabsTrigger>
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
              ) : formats.length === 0 ? (
                <div className="text-center py-10 border rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    No response formats found
                  </p>
                  <Button onClick={handleNewFormat}>
                    <Plus className="mr-2 h-4 w-4" /> Create Format
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formats.map((format) => (
                    <Card key={format.id} className="flex flex-col">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {getFormatTypeIcon(format.formatType)}
                              {format.name}
                              {format.isActive ? (
                                <Badge variant="default" className="ml-2">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="ml-2">
                                  Inactive
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Format: {format.formatType.toUpperCase()}
                            </CardDescription>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditFormat(format)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFormat(format.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground mb-2">
                          {format.description || "No description provided"}
                        </p>
                        <div className="bg-muted p-2 rounded-md text-xs font-mono overflow-hidden text-ellipsis max-h-24">
                          {format.template.length > 150
                            ? `${format.template.substring(0, 150)}...`
                            : format.template}
                        </div>
                        {format.variables.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold mb-1">
                              Variables:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {format.variables.map((variable, index) => (
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
                        {format.brandingEnabled && (
                          <div className="mt-2 flex items-center gap-1">
                            <Palette className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Branding Enabled
                            </span>
                          </div>
                        )}
                        {format.structuredData && (
                          <div className="mt-1 flex items-center gap-1">
                            <FileJson className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Structured Data
                            </span>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handlePreviewFormat(format)}
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

          {previewFormat && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  Preview: {previewFormat.name}
                </CardTitle>
                <CardDescription>
                  Test how this format works with different variable values
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted p-3 rounded-md">
                    <p className="font-mono text-sm whitespace-pre-wrap">
                      {previewFormat.template}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Variables</h4>
                    {previewFormat.variables.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {previewFormat.variables.map((variable) => (
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
                        No variables in this format
                      </p>
                    )}
                  </div>

                  <Button onClick={handleApplyPreview}>Apply Format</Button>

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
                  onClick={() => setPreviewFormat(null)}
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

export default ResponseFormatEditor;
