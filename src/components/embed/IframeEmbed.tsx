import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/toast-container";

interface IframeEmbedProps {
  contextRuleId?: string;
  title?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

const IframeEmbed: React.FC<IframeEmbedProps> = ({
  contextRuleId,
  title = "Chat Assistant",
  position = "bottom-right",
}) => {
  const { toast } = useToast();
  const baseUrl = window.location.origin;

  // Generate the iframe code
  const generateIframeCode = () => {
    let url = `${baseUrl}/chat-embed`;
    const params = new URLSearchParams();

    if (contextRuleId) params.append("contextRuleId", contextRuleId);
    if (title) params.append("title", title);
    if (position) params.append("position", position);

    if (params.toString()) url += `?${params.toString()}`;

    return `<iframe 
  src="${url}" 
  width="100%" 
  height="600px" 
  frameborder="0" 
  allow="microphone" 
  loading="lazy"
  importance="low"
  style="border: none; width: 100%; height: 600px; max-width: 450px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);"
></iframe>

<!-- Responsive styles for the iframe -->
<style>
  @media (max-width: 480px) {
    iframe {
      width: 100% !important;
      max-width: 100% !important;
      height: 500px !important;
    }
  }
  
  @media (max-width: 768px) and (orientation: landscape) {
    iframe {
      height: 90vh !important;
      min-height: 300px !important;
    }
  }
</style>`;
  };

  // Generate the web component code
  const generateWebComponentCode = () => {
    let attributes = "";

    if (contextRuleId) attributes += ` context-rule-id="${contextRuleId}"`;
    if (title) attributes += ` title="${title}"`;
    if (position) attributes += ` position="${position}"`;

    return `<!-- Add this script to your page head for better performance -->
<script src="${baseUrl}/chat-widget.js" async defer></script>

<!-- Place this where you want the chat widget to appear -->
<chat-widget${attributes} lazy-load="true"></chat-widget>

<!-- Optional: Add custom styles for the chat widget -->
<style>
  chat-widget {
    display: block;
    width: 100%;
    max-width: 450px;
    height: 600px;
    margin: 0 auto;
  }
  
  @media (max-width: 480px) {
    chat-widget {
      max-width: 100%;
      height: 500px;
    }
  }
</style>`;
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const iframeCode = generateIframeCode();
  const webComponentCode = generateWebComponentCode();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>iFrame Embed</CardTitle>
          <CardDescription>
            Embed the chat widget in an iframe for complete isolation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <pre className="p-4 rounded-md bg-muted overflow-x-auto text-sm">
                {iframeCode}
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(iframeCode)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Web Component (Shadow DOM)</CardTitle>
          <CardDescription>
            Embed the chat widget as a web component using Shadow DOM for style
            encapsulation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <pre className="p-4 rounded-md bg-muted overflow-x-auto text-sm">
                {webComponentCode}
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(webComponentCode)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IframeEmbed;
