import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Check, Code2, Globe } from "lucide-react";

interface EmbedCodeGeneratorProps {
  widgetId?: string;
  widgetColor?: string;
  widgetPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  widgetSize?: "small" | "medium" | "large";
}

const EmbedCodeGenerator = ({
  widgetId = "chat-widget-123",
  widgetColor = "#4f46e5",
  widgetPosition = "bottom-right",
  widgetSize = "medium",
}: EmbedCodeGeneratorProps) => {
  const [copied, setCopied] = useState<string | null>(null);

  // Generate iframe embed code
  const iframeCode = `<iframe 
  src="https://chat-widget.example.com/embed/${widgetId}" 
  width="${widgetSize === "small" ? "300" : widgetSize === "medium" ? "380" : "450"}" 
  height="600" 
  style="border: none; position: fixed; ${widgetPosition.includes("bottom") ? "bottom: 20px;" : "top: 20px;"} ${widgetPosition.includes("right") ? "right: 20px;" : "left: 20px;"} z-index: 9999; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 12px; background-color: white;"
  title="Chat Widget"
></iframe>`;

  // Generate Web Component (Shadow DOM) embed code
  const webComponentCode = `<script>
  (function() {
    const script = document.createElement('script');
    script.src = 'https://chat-widget.example.com/loader.js';
    script.async = true;
    script.onload = function() {
      window.ChatWidget.init({
        widgetId: '${widgetId}',
        color: '${widgetColor}',
        position: '${widgetPosition}',
        size: '${widgetSize}'
      });
    };
    document.head.appendChild(script);
  })();
</script>`;

  // Handle copy button click
  const handleCopy = (type: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Embed Code Generator
        </h2>
        <p className="text-gray-600">
          Generate code to embed the chat widget on your website using either an
          iframe or a Web Component.
        </p>
      </div>

      <Tabs defaultValue="iframe" className="w-full">
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
                onClick={() => handleCopy("iframe", iframeCode)}
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
                <code>{iframeCode}</code>
              </pre>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              About iframe Embedding
            </h4>
            <p className="text-sm text-blue-700">
              The iframe method provides complete isolation from your website's
              styles and scripts. It's simple to implement but offers less
              customization options.
            </p>
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
                onClick={() => handleCopy("web-component", webComponentCode)}
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
                <code>{webComponentCode}</code>
              </pre>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              About Web Component Embedding
            </h4>
            <p className="text-sm text-blue-700">
              The Web Component method uses Shadow DOM to encapsulate styles and
              scripts. It offers better integration with your website and more
              customization options.
            </p>
          </div>
        </TabsContent>
      </Tabs>

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
