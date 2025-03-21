import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Code,
  Maximize2,
  MessageSquare,
  Minimize2,
  Settings,
} from "lucide-react";
import ChatWidget from "@/components/chat/ChatWidget";

const ChatWidgetTutorial = () => {
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState<
    "bottom-right" | "bottom-left" | "top-right" | "top-left"
  >("bottom-right");
  const [widgetColor, setWidgetColor] = useState("#4f46e5");

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Chat Widget Tutorial
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Learn how to use and customize the embeddable chat widget
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="customization">Customization</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Chat Widget Overview</CardTitle>
                  <CardDescription>
                    Understanding the core functionality of the chat widget
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>
                      The chat widget is a React component that provides a
                      real-time chat interface that can be embedded in any
                      website. It connects to a WebSocket server for real-time
                      communication and uses AI models to generate responses.
                    </p>

                    <h3 className="text-lg font-medium mt-4">Key Features</h3>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Real-time messaging using WebSockets</li>
                      <li>AI-powered responses based on context rules</li>
                      <li>Customizable appearance and behavior</li>
                      <li>Responsive design that works on all devices</li>
                      <li>
                        Multiple embedding options (iframe or Web Component)
                      </li>
                    </ul>

                    <h3 className="text-lg font-medium mt-4">Widget States</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Minimized State</h4>
                          <Badge variant="outline">Default</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Shows only a chat icon in the specified position
                        </p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Expanded State</h4>
                          <Badge variant="outline">On Click</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Shows the full chat interface with messages and input
                        </p>
                      </div>
                    </div>

                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Try it yourself</AlertTitle>
                      <AlertDescription>
                        Use the controls in the right panel to interact with a
                        live demo of the chat widget.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="components" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Widget Components</CardTitle>
                  <CardDescription>
                    Understanding the structure of the chat widget
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="font-medium flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                        ChatWidget
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        The main container component that manages the state and
                        renders the child components. Located at{" "}
                        <code className="bg-muted px-1 py-0.5 rounded">
                          src/components/chat/ChatWidget.tsx
                        </code>
                      </p>
                      <div className="bg-muted rounded-md p-3 text-sm mt-2">
                        <code>
                          {
                            '<ChatWidget position="bottom-right" primaryColor="#4f46e5" />'
                          }
                        </code>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="font-medium">ChatHeader</h3>
                      <p className="text-sm text-muted-foreground">
                        The header component with title and control buttons.
                        Located at{" "}
                        <code className="bg-muted px-1 py-0.5 rounded">
                          src/components/chat/ChatHeader.tsx
                        </code>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">ChatMessages</h3>
                      <p className="text-sm text-muted-foreground">
                        Displays the conversation history with user and AI
                        messages. Located at{" "}
                        <code className="bg-muted px-1 py-0.5 rounded">
                          src/components/chat/ChatMessages.tsx
                        </code>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">ChatInput</h3>
                      <p className="text-sm text-muted-foreground">
                        The input field for typing messages with send button.
                        Located at{" "}
                        <code className="bg-muted px-1 py-0.5 rounded">
                          src/components/chat/ChatInput.tsx
                        </code>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">TypingIndicator</h3>
                      <p className="text-sm text-muted-foreground">
                        Shows when the AI is "typing" a response. Located at{" "}
                        <code className="bg-muted px-1 py-0.5 rounded">
                          src/components/chat/TypingIndicator.tsx
                        </code>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">WebSocket Connection</h3>
                      <p className="text-sm text-muted-foreground">
                        The widget connects to a WebSocket server for real-time
                        communication. The connection is managed by{" "}
                        <code className="bg-muted px-1 py-0.5 rounded">
                          src/services/websocketService.ts
                        </code>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customization" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Customization Options</CardTitle>
                  <CardDescription>
                    Ways to customize the appearance and behavior of the widget
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="font-medium flex items-center">
                        <Settings className="h-5 w-5 mr-2 text-primary" />
                        Available Props
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        The ChatWidget component accepts the following props for
                        customization:
                      </p>

                      <div className="mt-4 border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-2 text-left">Prop</th>
                              <th className="px-4 py-2 text-left">Type</th>
                              <th className="px-4 py-2 text-left">Default</th>
                              <th className="px-4 py-2 text-left">
                                Description
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            <tr>
                              <td className="px-4 py-2 font-mono text-xs">
                                position
                              </td>
                              <td className="px-4 py-2 font-mono text-xs">
                                string
                              </td>
                              <td className="px-4 py-2 font-mono text-xs">
                                "bottom-right"
                              </td>
                              <td className="px-4 py-2">
                                Position of the widget on the page
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 font-mono text-xs">
                                primaryColor
                              </td>
                              <td className="px-4 py-2 font-mono text-xs">
                                string
                              </td>
                              <td className="px-4 py-2 font-mono text-xs">
                                "#4f46e5"
                              </td>
                              <td className="px-4 py-2">
                                Main color for the widget
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 font-mono text-xs">
                                initiallyOpen
                              </td>
                              <td className="px-4 py-2 font-mono text-xs">
                                boolean
                              </td>
                              <td className="px-4 py-2 font-mono text-xs">
                                false
                              </td>
                              <td className="px-4 py-2">
                                Whether the widget starts in expanded state
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 font-mono text-xs">
                                welcomeMessage
                              </td>
                              <td className="px-4 py-2 font-mono text-xs">
                                string
                              </td>
                              <td className="px-4 py-2 font-mono text-xs">
                                "How can I help you today?"
                              </td>
                              <td className="px-4 py-2">
                                Initial message from the AI
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 font-mono text-xs">
                                chatIconSize
                              </td>
                              <td className="px-4 py-2 font-mono text-xs">
                                number
                              </td>
                              <td className="px-4 py-2 font-mono text-xs">
                                50
                              </td>
                              <td className="px-4 py-2">
                                Size of the chat icon in pixels
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium flex items-center">
                        <Code className="h-5 w-5 mr-2 text-primary" />
                        Usage Example
                      </h3>
                      <div className="bg-muted rounded-md p-3 font-mono text-sm overflow-x-auto">
                        {`import ChatWidget from "@/components/chat/ChatWidget";

const MyPage = () => {
  return (
    <div>
      <h1>My Website</h1>
      <p>Welcome to my website!</p>
      
      <ChatWidget 
        position="bottom-right"
        primaryColor="#0ea5e9"
        initiallyOpen={false}
        welcomeMessage="Hello! How can I assist you today?"
        chatIconSize={60}
      />
    </div>
  );
};

export default MyPage;`}
                      </div>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Admin Configuration</AlertTitle>
                      <AlertDescription>
                        For more advanced customization, use the Widget
                        Configurator in the admin dashboard. This allows you to
                        change settings without modifying code.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Live Demo</CardTitle>
              <CardDescription>Interact with the chat widget</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Widget Controls</h3>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => setWidgetOpen(!widgetOpen)}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      {widgetOpen ? (
                        <>
                          <Minimize2 className="h-4 w-4 mr-2" />
                          Minimize Widget
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-4 w-4 mr-2" />
                          Expand Widget
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Position</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={
                        widgetPosition === "bottom-right"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => setWidgetPosition("bottom-right")}
                    >
                      Bottom Right
                    </Button>
                    <Button
                      variant={
                        widgetPosition === "bottom-left" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setWidgetPosition("bottom-left")}
                    >
                      Bottom Left
                    </Button>
                    <Button
                      variant={
                        widgetPosition === "top-right" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setWidgetPosition("top-right")}
                    >
                      Top Right
                    </Button>
                    <Button
                      variant={
                        widgetPosition === "top-left" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setWidgetPosition("top-left")}
                    >
                      Top Left
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Primary Color</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      className="w-8 h-8 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: "#4f46e5" }}
                      onClick={() => setWidgetColor("#4f46e5")}
                    />
                    <button
                      className="w-8 h-8 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: "#0ea5e9" }}
                      onClick={() => setWidgetColor("#0ea5e9")}
                    />
                    <button
                      className="w-8 h-8 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: "#10b981" }}
                      onClick={() => setWidgetColor("#10b981")}
                    />
                    <button
                      className="w-8 h-8 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: "#f43f5e" }}
                      onClick={() => setWidgetColor("#f43f5e")}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Alert variant="outline" className="bg-muted/50">
                    <p className="text-xs text-muted-foreground">
                      This is a simplified demo. The actual widget connects to a
                      WebSocket server for real-time communication.
                    </p>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Simplified Chat Widget Demo */}
      <div
        className="fixed"
        style={{
          [widgetPosition.includes("bottom") ? "bottom" : "top"]: "20px",
          [widgetPosition.includes("right") ? "right" : "left"]: "20px",
          zIndex: 1000,
        }}
      >
        {widgetOpen ? (
          <div className="bg-white rounded-lg shadow-lg w-80 h-96 flex flex-col overflow-hidden border">
            <div
              className="p-3 flex justify-between items-center"
              style={{ backgroundColor: widgetColor }}
            >
              <span className="text-white font-medium">Chat Support</span>
              <button
                onClick={() => setWidgetOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-1"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
              <div className="space-y-3">
                <div className="flex">
                  <div className="bg-white rounded-lg p-2 shadow-sm max-w-[80%]">
                    <p className="text-sm">Hello! How can I help you today?</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div
                    className="rounded-lg p-2 shadow-sm max-w-[80%]"
                    style={{ backgroundColor: widgetColor, color: "white" }}
                  >
                    <p className="text-sm">
                      I have a question about your services.
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="bg-white rounded-lg p-2 shadow-sm max-w-[80%]">
                    <p className="text-sm">
                      I'd be happy to help! What would you like to know about
                      our services?
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ focusRing: widgetColor }}
                />
                <button
                  className="p-2 rounded-md"
                  style={{ backgroundColor: widgetColor, color: "white" }}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: widgetColor }}
            onClick={() => setWidgetOpen(true)}
          >
            <MessageSquare className="h-6 w-6 text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatWidgetTutorial;
