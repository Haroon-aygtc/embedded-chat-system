import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  ColorPicker as UIColorPicker,
  ColorSwatch as UIColorSwatch,
} from "../ui/color-picker";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Code,
  Settings,
  Layout,
  Palette,
  Move,
  Maximize2,
  X,
  Send,
} from "lucide-react";

// Define the form schema using zod
const formSchema = z.object({
  // Appearance
  primaryColor: z.string().default("#4f46e5"),
  secondaryColor: z.string().default("#f9fafb"),
  fontFamily: z.string().default("Inter"),
  borderRadius: z.number().min(0).max(20).default(8),
  chatIconSize: z.number().min(20).max(60).default(40),

  // Behavior
  position: z
    .enum(["bottom-right", "bottom-left", "top-right", "top-left"])
    .default("bottom-right"),
  initialState: z.enum(["minimized", "expanded"]).default("minimized"),
  autoOpen: z.boolean().default(false),
  autoOpenDelay: z.number().min(1).max(60).default(5),
  showNotifications: z.boolean().default(true),

  // Content
  chatTitle: z.string().min(1).max(50).default("Chat Assistant"),
  welcomeMessage: z
    .string()
    .min(1)
    .max(500)
    .default("Hello! How can I help you today?"),
  placeholderText: z
    .string()
    .min(1)
    .max(100)
    .default("Type your message here..."),

  // Embedding
  embedMethod: z.enum(["iframe", "web-component"]).default("iframe"),
  zIndex: z.number().min(1).max(9999).default(9999),
});

type FormValues = z.infer<typeof formSchema>;

const WidgetConfigurator = ({
  defaultValues = {},
}: {
  defaultValues?: Partial<FormValues>;
}) => {
  const [activeTab, setActiveTab] = useState("appearance");

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...formSchema.parse({}),
      ...defaultValues,
    },
  });

  const watchedValues = form.watch();

  const onSubmit = (data: FormValues) => {
    console.log("Form submitted:", data);
    // Here you would save the configuration to your backend
  };

  const generateEmbedCode = () => {
    const { embedMethod } = form.getValues();

    if (embedMethod === "iframe") {
      return `<iframe 
  src="https://your-chat-widget-url.com/embed" 
  width="100%" 
  height="600px" 
  style="border: none; position: fixed; bottom: 20px; right: 20px; width: 380px; height: 600px; z-index: ${watchedValues.zIndex};" 
  title="Chat Widget"
></iframe>`;
    } else {
      return `<script src="https://your-chat-widget-url.com/embed.js"></script>
<chat-widget 
  primary-color="${watchedValues.primaryColor}"
  position="${watchedValues.position}"
  initial-state="${watchedValues.initialState}"
></chat-widget>`;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full bg-white p-6 rounded-lg">
      {/* Configuration Form */}
      <div className="w-full lg:w-1/2">
        <h2 className="text-2xl font-bold mb-6">Widget Configurator</h2>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette size={16} />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center gap-2">
              <Settings size={16} />
              <span className="hidden sm:inline">Behavior</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <MessageSquare size={16} />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="embedding" className="flex items-center gap-2">
              <Code size={16} />
              <span className="hidden sm:inline">Embedding</span>
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Visual Style</CardTitle>
                    <CardDescription>
                      Customize how your chat widget looks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <FormControl>
                            <UIColorPicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            This color will be used for the chat header and
                            buttons
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Color</FormLabel>
                          <FormControl>
                            <UIColorPicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Used for backgrounds and secondary elements
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fontFamily"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Font Family</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a font" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Open Sans">
                                Open Sans
                              </SelectItem>
                              <SelectItem value="Lato">Lato</SelectItem>
                              <SelectItem value="Poppins">Poppins</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose a font for your chat widget
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="borderRadius"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Border Radius: {field.value}px</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={20}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) =>
                                field.onChange(value[0])
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Adjust the roundness of corners
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="chatIconSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chat Icon Size: {field.value}px</FormLabel>
                          <FormControl>
                            <Slider
                              min={20}
                              max={60}
                              step={2}
                              value={[field.value]}
                              onValueChange={(value) =>
                                field.onChange(value[0])
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Size of the chat button when minimized
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="behavior" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Widget Behavior</CardTitle>
                    <CardDescription>
                      Configure how your chat widget behaves
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Widget Position</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select position" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="bottom-right">
                                Bottom Right
                              </SelectItem>
                              <SelectItem value="bottom-left">
                                Bottom Left
                              </SelectItem>
                              <SelectItem value="top-right">
                                Top Right
                              </SelectItem>
                              <SelectItem value="top-left">Top Left</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Where the chat widget appears on the page
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="initialState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial State</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select initial state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="minimized">
                                Minimized
                              </SelectItem>
                              <SelectItem value="expanded">Expanded</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How the chat widget appears when first loaded
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="autoOpen"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Auto Open
                            </FormLabel>
                            <FormDescription>
                              Automatically open the chat after a delay
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {watchedValues.autoOpen && (
                      <FormField
                        control={form.control}
                        name="autoOpenDelay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Auto Open Delay: {field.value} seconds
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={60}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Time before the chat automatically opens
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="showNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Show Notifications
                            </FormLabel>
                            <FormDescription>
                              Display notification badges for new messages
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Widget Content</CardTitle>
                    <CardDescription>
                      Customize the text content of your chat widget
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="chatTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chat Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Chat Assistant" {...field} />
                          </FormControl>
                          <FormDescription>
                            The title displayed in the chat header
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="welcomeMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Welcome Message</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Hello! How can I help you today?"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            First message shown to the user
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="placeholderText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Input Placeholder</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Type your message here..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Placeholder text for the message input
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="embedding" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Embedding Options</CardTitle>
                    <CardDescription>
                      Configure how to embed the chat widget on your website
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="embedMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Embed Method</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select embed method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="iframe">iFrame</SelectItem>
                              <SelectItem value="web-component">
                                Web Component (Shadow DOM)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {field.value === "iframe"
                              ? "iFrame provides complete isolation from your website styles"
                              : "Web Component uses Shadow DOM for style encapsulation with better integration"}
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zIndex"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Z-Index: {field.value}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={9999}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Controls the stacking order of the widget
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <div className="pt-4">
                      <h3 className="text-lg font-medium mb-2">Embed Code</h3>
                      <div className="bg-slate-100 p-4 rounded-md">
                        <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                          {generateEmbedCode()}
                        </pre>
                      </div>
                      <p className="text-sm text-slate-500 mt-2">
                        Copy this code and paste it into your website
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button type="submit">Save Configuration</Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </div>

      {/* Live Preview */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <h2 className="text-2xl font-bold mb-6">Live Preview</h2>
        <div className="relative flex-1 border rounded-lg overflow-hidden bg-slate-100 min-h-[600px]">
          {/* Preview Website Background */}
          <div className="absolute inset-0 p-4">
            <div className="w-full h-12 bg-white rounded-md shadow-sm mb-4"></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="h-40 bg-white rounded-md shadow-sm"></div>
              <div className="h-40 bg-white rounded-md shadow-sm"></div>
            </div>
            <div className="h-60 bg-white rounded-md shadow-sm mb-4"></div>
          </div>

          {/* Chat Widget Preview */}
          {watchedValues.initialState === "minimized" ? (
            <motion.div
              className="absolute cursor-pointer shadow-lg rounded-full flex items-center justify-center"
              style={{
                backgroundColor: watchedValues.primaryColor,
                width: `${watchedValues.chatIconSize}px`,
                height: `${watchedValues.chatIconSize}px`,
                ...(watchedValues.position === "bottom-right" && {
                  bottom: "20px",
                  right: "20px",
                }),
                ...(watchedValues.position === "bottom-left" && {
                  bottom: "20px",
                  left: "20px",
                }),
                ...(watchedValues.position === "top-right" && {
                  top: "20px",
                  right: "20px",
                }),
                ...(watchedValues.position === "top-left" && {
                  top: "20px",
                  left: "20px",
                }),
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageSquare size={24} className="text-white" />
              {watchedValues.showNotifications && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  1
                </span>
              )}
            </motion.div>
          ) : (
            <motion.div
              className="absolute shadow-lg overflow-hidden flex flex-col"
              style={{
                width: "320px",
                height: "480px",
                borderRadius: `${watchedValues.borderRadius}px`,
                ...(watchedValues.position === "bottom-right" && {
                  bottom: "20px",
                  right: "20px",
                }),
                ...(watchedValues.position === "bottom-left" && {
                  bottom: "20px",
                  left: "20px",
                }),
                ...(watchedValues.position === "top-right" && {
                  top: "20px",
                  right: "20px",
                }),
                ...(watchedValues.position === "top-left" && {
                  top: "20px",
                  left: "20px",
                }),
                fontFamily: watchedValues.fontFamily,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {/* Chat Header */}
              <div
                className="flex items-center justify-between p-3"
                style={{ backgroundColor: watchedValues.primaryColor }}
              >
                <h3 className="text-white font-medium">
                  {watchedValues.chatTitle}
                </h3>
                <div className="flex gap-1">
                  <button className="text-white/80 hover:text-white">
                    <Maximize2 size={18} />
                  </button>
                  <button className="text-white/80 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div
                className="flex-1 p-4 overflow-y-auto"
                style={{ backgroundColor: watchedValues.secondaryColor }}
              >
                {/* AI Message */}
                <div className="flex gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MessageSquare size={16} className="text-blue-500" />
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm max-w-[80%]">
                    <p className="text-sm">{watchedValues.welcomeMessage}</p>
                  </div>
                </div>

                {/* User Message */}
                <div className="flex flex-row-reverse gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-indigo-600">
                      You
                    </span>
                  </div>
                  <div
                    className="p-3 rounded-lg shadow-sm max-w-[80%] text-white"
                    style={{ backgroundColor: watchedValues.primaryColor }}
                  >
                    <p className="text-sm">
                      Hello, I have a question about your service.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    placeholder={watchedValues.placeholderText}
                  />
                  <Button
                    size="icon"
                    style={{ backgroundColor: watchedValues.primaryColor }}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WidgetConfigurator;
