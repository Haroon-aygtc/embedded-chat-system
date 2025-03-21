import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ChatWidget from "@/components/chat/ChatWidget";

const ChatEmbedPage = () => {
  const [searchParams] = useSearchParams();
  const [params, setParams] = useState({
    contextRuleId: searchParams.get("contextRuleId") || undefined,
    title: searchParams.get("title") || "Chat Assistant",
    subtitle: searchParams.get("subtitle") || "Ask me anything",
    position:
      (searchParams.get("position") as
        | "bottom-right"
        | "bottom-left"
        | "top-right"
        | "top-left") || "bottom-right",
    contextMode:
      (searchParams.get("contextMode") as "restricted" | "general") ||
      "general",
    contextName: searchParams.get("contextName") || "",
    primaryColor:
      searchParams.get("color") ||
      searchParams.get("primaryColor") ||
      "#3b82f6",
    avatarSrc: searchParams.get("avatarSrc") || undefined,
    widgetId: searchParams.get("widgetId") || "default",
    theme: (searchParams.get("theme") as "light" | "dark") || "light",
    autoOpen: searchParams.get("autoOpen") === "true",
    deviceType: searchParams.get("deviceType") || "desktop",
    allowAttachments: searchParams.get("allowAttachments") !== "false",
    allowVoice: searchParams.get("allowVoice") !== "false",
    allowEmoji: searchParams.get("allowEmoji") !== "false",
    width: parseInt(searchParams.get("width") || "380", 10),
    height: parseInt(searchParams.get("height") || "600", 10),
  });

  // Apply any styles needed for the iframe
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";

    // Apply theme to body
    if (params.theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }

    // Listen for messages from parent window
    const handleMessage = (event: MessageEvent) => {
      // Verify the origin for security
      if (event.origin !== window.location.origin) return;

      // Handle resize events
      if (event.data && event.data.type === "chat-widget-resize") {
        // You could update state here if needed to adjust the widget size
        console.log("Resize event received:", event.data);
      }

      // Handle custom events from parent
      if (event.data && event.data.type === "chat-widget-config") {
        // Update widget configuration dynamically
        setParams((prev) => ({
          ...prev,
          ...event.data.config,
        }));
      }
    };

    window.addEventListener("message", handleMessage);

    // Notify parent that the iframe is loaded
    try {
      window.parent.postMessage(
        {
          type: "chat-widget-loaded",
          widgetId: params.widgetId,
          deviceInfo: {
            userAgent: navigator.userAgent,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
          },
        },
        window.location.origin,
      );
    } catch (e) {
      // Silently fail if parent communication fails
    }

    return () => {
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.body.style.overflow = "";
      window.removeEventListener("message", handleMessage);
    };
  }, [params.widgetId, params.theme]);

  // Send events to parent window
  const handleSendEvent = (eventType: string, data: any) => {
    try {
      window.parent.postMessage(
        {
          type: "chat-widget-event",
          eventType,
          data,
          widgetId: params.widgetId,
          timestamp: new Date().toISOString(),
        },
        window.location.origin,
      );
    } catch (e) {
      // Silently fail if parent communication fails
    }
  };

  // Custom message handler that also notifies the parent
  const handleSendMessage = async (message: string) => {
    // Notify parent of message sent
    handleSendEvent("message-sent", { content: message });
  };

  return (
    <div className="w-full h-screen">
      <ChatWidget
        isFullPage={true}
        title={params.title}
        subtitle={params.subtitle}
        position={params.position}
        contextMode={params.contextMode}
        contextName={params.contextName}
        contextRuleId={params.contextRuleId}
        primaryColor={params.primaryColor}
        avatarSrc={params.avatarSrc}
        embedded={true}
        initiallyOpen={params.autoOpen}
        allowAttachments={params.allowAttachments}
        allowVoice={params.allowVoice}
        allowEmoji={params.allowEmoji}
        width={params.width}
        height={params.height}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default ChatEmbedPage;
