import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Info } from "lucide-react";

interface EmbedOptionsProps {
  title?: string;
  description?: string;
}

const EmbedOptionsSection = ({
  title = "Flexible Embedding Options",
  description = "Choose the integration method that works best for your website. Our chat widget can be embedded using either an iframe or a Web Component with Shadow DOM for complete style isolation.",
}: EmbedOptionsProps) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real implementation, you would show a toast notification here
  };

  const iframeCode = `<iframe 
  src="https://your-chat-widget-url.com/embed" 
  width="380" 
  height="600" 
  frameborder="0"
  allow="microphone"
  style="position: fixed; bottom: 20px; right: 20px; border: none; z-index: 9999;"
></iframe>`;

  const webComponentCode = `<script src="https://your-chat-widget-url.com/loader.js"></script>
<chat-widget 
  api-key="YOUR_API_KEY" 
  theme="light" 
  position="bottom-right"
></chat-widget>`;

  return (
    <section className="py-20 px-4 md:px-8 bg-slate-50 w-full">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <Tabs defaultValue="iframe" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="iframe">iFrame Embedding</TabsTrigger>
              <TabsTrigger value="webcomponent">Web Component</TabsTrigger>
            </TabsList>

            <TabsContent value="iframe" className="space-y-6">
              <div className="flex items-start gap-6 flex-col md:flex-row">
                <div className="w-full md:w-1/2">
                  <h3 className="text-xl font-semibold mb-3">
                    iFrame Integration
                  </h3>
                  <p className="text-slate-600 mb-4">
                    The simplest way to add our chat widget to your website.
                    Just copy and paste this code snippet into your HTML.
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <Info size={18} className="text-blue-500" />
                    <span className="text-sm text-slate-500">
                      Complete isolation from your website's styles and scripts
                    </span>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(iframeCode)}
                    className="mt-2"
                  >
                    <Copy size={16} className="mr-2" /> Copy Code
                  </Button>
                </div>
                <div className="w-full md:w-1/2 bg-slate-900 text-slate-100 p-4 rounded-md overflow-x-auto">
                  <pre className="text-sm">
                    <code>{iframeCode}</code>
                  </pre>
                </div>
              </div>
              <div className="mt-6 border-t pt-6">
                <h4 className="font-medium mb-2">Key Benefits:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>No conflicts with existing styles or scripts</li>
                  <li>Secure sandboxed environment</li>
                  <li>Easiest implementation for non-technical users</li>
                  <li>Automatic updates without changing your code</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="webcomponent" className="space-y-6">
              <div className="flex items-start gap-6 flex-col md:flex-row">
                <div className="w-full md:w-1/2">
                  <h3 className="text-xl font-semibold mb-3">
                    Web Component Integration
                  </h3>
                  <p className="text-slate-600 mb-4">
                    For more advanced integration, use our Web Component with
                    Shadow DOM for style encapsulation and better performance.
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <Info size={18} className="text-blue-500" />
                    <span className="text-sm text-slate-500">
                      More customization options with better performance
                    </span>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(webComponentCode)}
                    className="mt-2"
                  >
                    <Copy size={16} className="mr-2" /> Copy Code
                  </Button>
                </div>
                <div className="w-full md:w-1/2 bg-slate-900 text-slate-100 p-4 rounded-md overflow-x-auto">
                  <pre className="text-sm">
                    <code>{webComponentCode}</code>
                  </pre>
                </div>
              </div>
              <div className="mt-6 border-t pt-6">
                <h4 className="font-medium mb-2">Key Benefits:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Shadow DOM for style encapsulation</li>
                  <li>More customization options via attributes</li>
                  <li>Better performance and smaller footprint</li>
                  <li>Seamless integration with modern web applications</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-10 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-700 mb-2">Need Help?</h4>
            <p className="text-blue-600">
              Our documentation provides detailed instructions for both
              integration methods, including advanced customization options and
              troubleshooting tips.
            </p>
            <Button variant="link" className="mt-2 text-blue-700 p-0">
              View Documentation →
            </Button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold mb-4">See It In Action</h3>
          <div className="aspect-video max-w-3xl mx-auto bg-slate-200 rounded-lg overflow-hidden shadow-md">
            {/* Placeholder for a demo video or animated GIF */}
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-slate-600">Integration Demo Video</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmbedOptionsSection;
