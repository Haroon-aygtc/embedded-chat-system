import React from "react";
import ChatWidget from "@/components/chat/ChatWidget";

export default function ChatWidgetEmbedDemo() {
  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Chat Widget Embed Demo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Standard Widget</h2>
          <div className="h-[500px] border border-gray-200 dark:border-gray-700 rounded-lg relative">
            <ChatWidget
              embedded={true}
              initiallyOpen={true}
              allowAttachments={true}
              allowVoice={true}
              allowEmoji={true}
              width={380}
              height={500}
              title="Customer Support"
              subtitle="How can we help you today?"
              primaryColor="#4f46e5"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">
            Restricted Context Widget
          </h2>
          <div className="h-[500px] border border-gray-200 dark:border-gray-700 rounded-lg relative">
            <ChatWidget
              embedded={true}
              initiallyOpen={true}
              allowAttachments={false}
              allowVoice={false}
              allowEmoji={true}
              width={380}
              height={500}
              title="Product Assistant"
              subtitle="Ask me about our products"
              primaryColor="#0ea5e9"
              contextMode="restricted"
              contextName="Product Information"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-6xl">
        <h2 className="text-lg font-semibold mb-4">Implementation Features</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <span className="font-medium">Embedded Mode:</span> Widget detects
            it's running in embedded mode and adjusts behavior
          </li>
          <li>
            <span className="font-medium">Initial State:</span> Can be
            configured to start open or closed
          </li>
          <li>
            <span className="font-medium">Feature Toggles:</span> Attachments,
            voice input, and emoji picker can be enabled/disabled
          </li>
          <li>
            <span className="font-medium">Parent Communication:</span> Widget
            sends events to parent window and listens for configuration changes
          </li>
          <li>
            <span className="font-medium">Responsive Design:</span> Adapts to
            different screen sizes and device types
          </li>
          <li>
            <span className="font-medium">Theme Support:</span> Light and dark
            mode compatible
          </li>
          <li>
            <span className="font-medium">Context Rules:</span> Can be
            restricted to specific business domains
          </li>
        </ul>
      </div>
    </div>
  );
}
