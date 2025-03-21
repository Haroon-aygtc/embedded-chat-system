import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  Code2,
  Globe,
  AlertCircle,
  RefreshCw,
  FileCode,
} from "lucide-react";
import { contextRulesApi, widgetConfigApi } from "@/services/apiService";
import { useEffect } from "react";
import { ContextRule } from "@/types/contextRules";
import { useRealtime } from "@/hooks/useRealtime";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface EmbedCodeGeneratorProps {
  widgetId?: string;
  widgetColor?: string;
  widgetPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  widgetSize?: "small" | "medium" | "large";
  userId?: string;
}

const EmbedCodeGenerator = ({
  widgetId: initialWidgetId = "chat-widget-123",
  widgetColor: initialWidgetColor = "#4f46e5",
  widgetPosition: initialWidgetPosition = "bottom-right",
  widgetSize: initialWidgetSize = "medium",
  userId = "current-user", // In a real app, this would come from auth context
}: EmbedCodeGeneratorProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [contextRules, setContextRules] = useState<ContextRule[]>([]);
  const [selectedContextRuleId, setSelectedContextRuleId] =
    useState<string>("");
  const [contextMode, setContextMode] = useState<"general" | "business">(
    "general",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetId, setWidgetId] = useState(initialWidgetId);
  const [widgetColor, setWidgetColor] = useState(initialWidgetColor);
  const [widgetPosition, setWidgetPosition] = useState(initialWidgetPosition);
  const [widgetSize, setWidgetSize] = useState(initialWidgetSize);
  const [configId, setConfigId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("iframe");
  const [chatTitle, setChatTitle] = useState("Chat Assistant");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hello! How can I help you today?",
  );
  const [zIndex, setZIndex] = useState(9999);
  const [initialState, setInitialState] = useState<"minimized" | "expanded">(
    "minimized",
  );
  const [enableKnowledgeBase, setEnableKnowledgeBase] = useState(false);
  const [knowledgeBaseId, setKnowledgeBaseId] = useState("");
  const { toast } = useToast();

  // Subscribe to real-time changes in widget_configs table
  const { data: realtimeConfig } = useRealtime<any>(
    "widget_configs",
    ["UPDATE"],
    `user_id=eq.${userId}`,
    true,
  );

  // Fetch available context rules and widget configuration
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch context rules
        const rules = await contextRulesApi.getAll();
        setContextRules(rules.filter((rule) => rule.isActive));
        if (rules.length > 0) {
          setSelectedContextRuleId(rules[0].id);
        }

        // Fetch widget configuration
        const config = await widgetConfigApi.getByUserId(userId);
        if (config) {
          setConfigId(config.id);

          // Update state with configuration values if available
          if (config.settings) {
            const settings = config.settings;
            if (settings.primaryColor) setWidgetColor(settings.primaryColor);
            if (settings.position) setWidgetPosition(settings.position);
            if (settings.chatTitle) setChatTitle(settings.chatTitle);
            if (settings.welcomeMessage)
              setWelcomeMessage(settings.welcomeMessage);
            if (settings.zIndex) setZIndex(settings.zIndex);
            if (settings.initialState) setInitialState(settings.initialState);

            // Map widget size based on chatIconSize
            if (settings.chatIconSize) {
              if (settings.chatIconSize <= 30) setWidgetSize("small");
              else if (settings.chatIconSize >= 50) setWidgetSize("large");
              else setWidgetSize("medium");
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setError("Failed to load configuration data. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load configuration data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, toast]);

  // Update widget configuration when real-time changes occur
  useEffect(() => {
    if (realtimeConfig && realtimeConfig.settings) {
      const settings = realtimeConfig.settings;

      // Update state with new configuration values
      if (settings.primaryColor) setWidgetColor(settings.primaryColor);
      if (settings.position) setWidgetPosition(settings.position);
      if (settings.chatTitle) setChatTitle(settings.chatTitle);
      if (settings.welcomeMessage) setWelcomeMessage(settings.welcomeMessage);
      if (settings.zIndex) setZIndex(settings.zIndex);
      if (settings.initialState) setInitialState(settings.initialState);

      // Map widget size based on chatIconSize
      if (settings.chatIconSize) {
        if (settings.chatIconSize <= 30) setWidgetSize("small");
        else if (settings.chatIconSize >= 50) setWidgetSize("large");
        else setWidgetSize("medium");
      }

      toast({
        title: "Configuration Updated",
        description: "Widget configuration has been updated",
      });
    }
  }, [realtimeConfig, toast]);

  const baseUrl = window.location.origin;

  // Generate iframe embed code
  const generateIframeCode = () => {
    let url = `${baseUrl}/chat-embed`;
    const params = new URLSearchParams();

    params.append("widgetId", widgetId);
    params.append("position", widgetPosition);
    params.append("color", widgetColor);
    params.append("size", widgetSize);
    params.append("contextMode", contextMode);
    params.append("chatTitle", encodeURIComponent(chatTitle));
    params.append("welcomeMessage", encodeURIComponent(welcomeMessage));
    params.append("initialState", initialState);
    params.append("zIndex", zIndex.toString());

    if (contextMode === "business" && selectedContextRuleId) {
      params.append("contextRuleId", selectedContextRuleId);
    }

    if (enableKnowledgeBase && knowledgeBaseId) {
      params.append("knowledgeBaseId", knowledgeBaseId);
    }

    return `<iframe 
  src="${url}?${params.toString()}" 
  width="${widgetSize === "small" ? "300" : widgetSize === "medium" ? "380" : "450"}" 
  height="600" 
  style="border: none; position: fixed; ${widgetPosition.includes("bottom") ? "bottom: 20px;" : "top: 20px;"} ${widgetPosition.includes("right") ? "right: 20px;" : "left: 20px;"} z-index: ${zIndex}; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 12px; background-color: white;"
  title="Chat Widget"
></iframe>`;
  };

  // Generate Web Component (Shadow DOM) embed code
  const generateWebComponentCode = () => {
    let attributes = `widget-id="${widgetId}" position="${widgetPosition}" color="${widgetColor}" size="${widgetSize}" context-mode="${contextMode}" chat-title="${chatTitle}" welcome-message="${welcomeMessage}" initial-state="${initialState}" z-index="${zIndex}"`;

    if (contextMode === "business" && selectedContextRuleId) {
      attributes += ` context-rule-id="${selectedContextRuleId}"`;
    }

    if (enableKnowledgeBase && knowledgeBaseId) {
      attributes += ` knowledge-base-id="${knowledgeBaseId}"`;
    }

    return `<script src="${baseUrl}/chat-widget.js"></script>
<chat-widget ${attributes}></chat-widget>`;
  };

  // Handle copy button click
  const handleCopy = (type: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);

    toast({
      title: "Copied to clipboard",
      description: "The embed code has been copied to your clipboard",
    });
  };

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      {isLoading && (
        <div className="flex items-center justify-center p-4 mb-4 bg-blue-50 rounded-md">
          <RefreshCw className="h-5 w-5 text-blue-500 animate-spin mr-2" />
          <p className="text-blue-700">Loading configuration data...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Embed Code Generator
        </h2>
        <p className="text-gray-600">
          Generate code to embed the chat widget on your website using either an
          iframe or a Web Component.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Widget Settings</CardTitle>
            <CardDescription>
              Customize how your chat widget will appear and behave
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="embedMethod">Embed Method</Label>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="mt-2"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="iframe"
                    className="flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    iFrame
                  </TabsTrigger>
                  <TabsTrigger
                    value="web-component"
                    className="flex items-center gap-2"
                  >
                    <Code2 className="h-4 w-4" />
                    Web Component
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-sm text-muted-foreground mt-2">
                {activeTab === "iframe"
                  ? "iFrame provides complete isolation from your website styles"
                  : "Web Component uses Shadow DOM for style encapsulation with better integration"}
              </p>
            </div>

            <div>
              <Label htmlFor="widgetColor">Primary Color</Label>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: widgetColor }}
                />
                <Input
                  id="widgetColor"
                  type="text"
                  value={widgetColor}
                  onChange={(e) => setWidgetColor(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="widgetPosition">Widget Position</Label>
              <Select value={widgetPosition} onValueChange={setWidgetPosition}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="initialState">Initial State</Label>
              <Select value={initialState} onValueChange={setInitialState}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select initial state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimized">Minimized</SelectItem>
                  <SelectItem value="expanded">Expanded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="chatTitle">Chat Title</Label>
              <Input
                id="chatTitle"
                className="mt-2"
                value={chatTitle}
                onChange={(e) => setChatTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="welcomeMessage">Welcome Message</Label>
              <Textarea
                id="welcomeMessage"
                className="mt-2"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="zIndex">Z-Index</Label>
              <Input
                id="zIndex"
                type="number"
                className="mt-2"
                value={zIndex}
                onChange={(e) => setZIndex(parseInt(e.target.value))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Controls the stacking order of the widget (higher numbers appear
                on top)
              </p>
            </div>

            <div className="border rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="contextMode">Context Mode</Label>
                <Select
                  value={contextMode}
                  onValueChange={(value) =>
                    setContextMode(value as "general" | "business")
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select context mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {contextMode === "business" && (
                <div>
                  <Label htmlFor="contextRuleId">Context Rule</Label>
                  <Select
                    value={selectedContextRuleId}
                    onValueChange={setSelectedContextRuleId}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select context rule" />
                    </SelectTrigger>
                    <SelectContent>
                      {contextRules.length === 0 ? (
                        <SelectItem value="">No rules available</SelectItem>
                      ) : (
                        contextRules.map((rule) => (
                          <SelectItem key={rule.id} value={rule.id}>
                            {rule.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="border rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableKnowledgeBase">
                  Enable Knowledge Base
                </Label>
                <Switch
                  id="enableKnowledgeBase"
                  checked={enableKnowledgeBase}
                  onCheckedChange={setEnableKnowledgeBase}
                />
              </div>

              {enableKnowledgeBase && (
                <div>
                  <Label htmlFor="knowledgeBaseId">Knowledge Base ID</Label>
                  <Input
                    id="knowledgeBaseId"
                    className="mt-2"
                    value={knowledgeBaseId}
                    onChange={(e) => setKnowledgeBaseId(e.target.value)}
                    placeholder="Enter knowledge base ID"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Code Preview Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Embed Code</CardTitle>
            <CardDescription>
              Copy this code and paste it into your website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-4 w-full flex justify-start">
                <TabsTrigger value="iframe" className="flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  iframe Embed
                </TabsTrigger>
                <TabsTrigger
                  value="web-component"
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Web Component
                </TabsTrigger>
              </TabsList>

              <TabsContent value="iframe" className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      iframe Embed Code
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy("iframe", generateIframeCode())}
                      className="h-8"
                    >
                      {copied === "iframe" ? (
                        <>
                          <Check className="h-4 w-4 mr-2" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" /> Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="relative">
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-md overflow-x-auto text-sm">
                      <code>{generateIframeCode()}</code>
                    </pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="web-component" className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      Web Component Embed Code
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopy("web-component", generateWebComponentCode())
                      }
                      className="h-8"
                    >
                      {copied === "web-component" ? (
                        <>
                          <Check className="h-4 w-4 mr-2" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" /> Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="relative">
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-md overflow-x-auto text-sm">
                      <code>{generateWebComponentCode()}</code>
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Alert className="w-full">
              <FileCode className="h-4 w-4" />
              <AlertTitle>Implementation Tips</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                  <li>
                    Add this code just before the closing{" "}
                    <code>&lt;/body&gt;</code> tag
                  </li>
                  <li>
                    For iFrame, ensure your CSP allows embedding from your
                    domain
                  </li>
                  <li>For Web Component, ensure JavaScript is enabled</li>
                  <li>Test on all major browsers to ensure compatibility</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-amber-50 rounded-md border border-amber-100">
        <h4 className="text-sm font-medium text-amber-800 mb-2">
          Implementation Notes
        </h4>
        <ul className="list-disc pl-5 text-sm text-amber-700 space-y-1">
          <li>
            The chat widget will automatically initialize when the page loads.
          </li>
          <li>
            You can customize the appearance and behavior through the admin
            dashboard.
          </li>
          <li>
            For advanced customization options, refer to the documentation.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EmbedCodeGenerator;
