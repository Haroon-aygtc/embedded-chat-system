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
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Check,
  Code,
  Copy,
  ExternalLink,
  Globe,
  Info,
} from "lucide-react";

const EmbeddingTutorial = () => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const iframeCode = `<iframe 
  src="https://your-domain.com/chat-embed?widgetId=chat-widget-123&position=bottom-right&color=%234f46e5&size=medium" 
  width="380" 
  height="600" 
  style="border: none; position: fixed; bottom: 20px; right: 20px; z-index: 9999; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 12px; background-color: white;"
  title="Chat Widget"
></iframe>`;

  const webComponentCode = `<script src="https://your-domain.com/chat-widget.js"></script>
<chat-widget widget-id="chat-widget-123" position="bottom-right" color="#4f46e5" size="medium"></chat-widget>`;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Embedding Options Tutorial
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Learn how to embed the chat widget in your website
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="iframe">iframe Embedding</TabsTrigger>
          <TabsTrigger value="web-component">Web Component</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Embedding Options Overview</CardTitle>
              <CardDescription>
                Different ways to embed the chat widget in your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  The chat widget can be embedded in your website using two
                  different methods. Each method has its own advantages and use
                  cases.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium flex items-center mb-2">
                      <Globe className="h-5 w-5 mr-2 text-primary" />
                      iframe Embedding
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Simple and straightforward method that works with any
                      website
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1 text-muted-foreground">
                      <li>Easy to implement</li>
                      <li>Works with any website platform</li>
                      <li>Isolated from your website's CSS</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium flex items-center mb-2">
                      <Code className="h-5 w-5 mr-2 text-primary" />
                      Web Component
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Advanced method using Shadow DOM for better integration
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1 text-muted-foreground">
                      <li>Better performance</li>
                      <li>More customization options</li>
                      <li>Isolated using Shadow DOM</li>
                    </ul>
                  </div>
                </div>

                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Choosing the Right Method</AlertTitle>
                  <AlertDescription>
                    If you're looking for a quick and simple solution, use the
                    iframe method. If you need more customization and better
                    performance, use the Web Component method.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iframe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>iframe Embedding</CardTitle>
              <CardDescription>
                Embed the chat widget using an iframe element
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p>
                  The iframe method is the simplest way to embed the chat widget
                  in your website. It works by loading the widget in an iframe
                  element, which isolates it from your website's CSS and
                  JavaScript.
                </p>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Implementation Steps</h3>
                  <ol className="list-decimal list-inside space-y-3">
                    <li>
                      <span className="font-medium">
                        Generate your widget configuration
                      </span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Use the admin dashboard to configure your widget and
                        generate the embed code
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">Copy the iframe code</span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Copy the generated iframe code from the admin dashboard
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">
                        Paste the code into your website
                      </span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Paste the iframe code into your website's HTML where you
                        want the widget to appear
                      </p>
                    </li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Example Code</h3>
                  <div className="relative">
                    <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">
                      {iframeCode}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(iframeCode, "iframe")}
                    >
                      {copiedType === "iframe" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Customization Options</h3>
                  <p className="text-sm text-muted-foreground">
                    You can customize the iframe by modifying the following
                    attributes:
                  </p>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">Parameter</th>
                          <th className="px-4 py-2 text-left">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">
                            widgetId
                          </td>
                          <td className="px-4 py-2">
                            Your unique widget identifier
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">
                            position
                          </td>
                          <td className="px-4 py-2">
                            Widget position (bottom-right, bottom-left,
                            top-right, top-left)
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">color</td>
                          <td className="px-4 py-2">
                            Primary color in hex format (URL encoded)
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">size</td>
                          <td className="px-4 py-2">
                            Widget size (small, medium, large)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important Note</AlertTitle>
                  <AlertDescription>
                    The iframe method may be blocked by some browsers' security
                    policies if your website uses a Content Security Policy
                    (CSP). Make sure to update your CSP to allow the iframe from
                    your chat widget domain.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="web-component" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Web Component</CardTitle>
              <CardDescription>
                Embed the chat widget using a custom Web Component
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p>
                  The Web Component method uses the Shadow DOM to create an
                  isolated component that can be embedded in your website. This
                  provides better performance and more customization options.
                </p>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Implementation Steps</h3>
                  <ol className="list-decimal list-inside space-y-3">
                    <li>
                      <span className="font-medium">Include the script</span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Add the chat-widget.js script to your website
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">
                        Add the custom element
                      </span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Add the &lt;chat-widget&gt; element to your HTML
                      </p>
                    </li>
                    <li>
                      <span className="font-medium">
                        Configure the attributes
                      </span>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Set the attributes to customize the widget
                      </p>
                    </li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Example Code</h3>
                  <div className="relative">
                    <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">
                      {webComponentCode}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        handleCopy(webComponentCode, "web-component")
                      }
                    >
                      {copiedType === "web-component" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Available Attributes</h3>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">Attribute</th>
                          <th className="px-4 py-2 text-left">Description</th>
                          <th className="px-4 py-2 text-left">Default</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">
                            widget-id
                          </td>
                          <td className="px-4 py-2">
                            Your unique widget identifier
                          </td>
                          <td className="px-4 py-2">Required</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">
                            position
                          </td>
                          <td className="px-4 py-2">Widget position</td>
                          <td className="px-4 py-2">"bottom-right"</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">color</td>
                          <td className="px-4 py-2">
                            Primary color in hex format
                          </td>
                          <td className="px-4 py-2">"#4f46e5"</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">size</td>
                          <td className="px-4 py-2">Widget size</td>
                          <td className="px-4 py-2">"medium"</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">
                            initially-open
                          </td>
                          <td className="px-4 py-2">
                            Whether the widget starts open
                          </td>
                          <td className="px-4 py-2">"false"</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">
                            welcome-message
                          </td>
                          <td className="px-4 py-2">
                            Initial message from the AI
                          </td>
                          <td className="px-4 py-2">
                            "How can I help you today?"
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">JavaScript API</h3>
                  <p className="text-sm text-muted-foreground">
                    The Web Component also provides a JavaScript API for
                    programmatic control:
                  </p>
                  <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">
                    {`// Get the widget element
const widget = document.querySelector('chat-widget');

// Open the widget
widget.open();

// Close the widget
widget.close();

// Toggle the widget
widget.toggle();

// Send a message programmatically
widget.sendMessage('Hello from JavaScript!');`}
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Browser Compatibility</AlertTitle>
                  <AlertDescription>
                    Web Components are supported in all modern browsers. For
                    older browsers, a polyfill is automatically included in the
                    chat-widget.js script.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmbeddingTutorial;
