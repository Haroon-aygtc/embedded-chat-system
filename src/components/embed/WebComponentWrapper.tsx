import React, { useEffect, useRef } from "react";
import ChatWidget from "@/components/chat/ChatWidget";

interface WebComponentWrapperProps {
  contextMode?: "business" | "general";
  contextRuleId?: string;
  title?: string;
  subtitle?: string;
  avatarSrc?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  widgetId?: string;
  color?: string;
  size?: "small" | "medium" | "large";
  theme?: "light" | "dark";
  autoOpen?: boolean;
  lazyLoad?: boolean;
}

// This class is only used for type definition
// The actual implementation is in public/chat-widget.js
class ChatWidgetElement extends HTMLElement {
  private root: ShadowRoot;
  private mountPoint: HTMLDivElement;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.mountPoint = document.createElement("div");
    this.root.appendChild(this.mountPoint);
  }

  connectedCallback() {
    // This will be implemented when the component is mounted
  }

  disconnectedCallback() {
    // Cleanup when component is removed
  }
}

const WebComponentWrapper: React.FC<WebComponentWrapperProps> = (props) => {
  const {
    contextMode,
    contextRuleId,
    title,
    subtitle,
    avatarSrc,
    position,
    widgetId,
    color,
    size,
    theme,
    autoOpen,
    lazyLoad,
  } = props;

  const isDefined = useRef(false);

  useEffect(() => {
    if (!isDefined.current) {
      // Define the custom element if it hasn't been defined yet
      if (!customElements.get("chat-widget")) {
        customElements.define("chat-widget", ChatWidgetElement);
      }
      isDefined.current = true;
    }

    // Set up event listener for chat widget events
    const handleWidgetEvent = (event: CustomEvent) => {
      console.log("Chat widget event:", event.detail);
      // Handle different event types here
      // For example: analytics tracking, UI updates, etc.

      // Track events for analytics if needed
      if (event.detail && event.detail.type) {
        // Example: track widget open/close events
        if (
          event.detail.type === "widget-opened" ||
          event.detail.type === "widget-closed"
        ) {
          // Could send to analytics service
        }

        // Example: track message sent events
        if (event.detail.type === "message-sent") {
          // Could track message metrics
        }
      }
    };

    // Listen for browser visibility changes to optimize performance
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";
      // Could pause/resume certain operations based on visibility
      // For example, pause polling or animations when not visible
    };

    document.addEventListener(
      "chat-widget-event",
      handleWidgetEvent as EventListener,
    );

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener(
        "chat-widget-event",
        handleWidgetEvent as EventListener,
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <ChatWidget
      contextMode={contextMode}
      contextRuleId={contextRuleId}
      title={title}
      subtitle={subtitle}
      avatarSrc={avatarSrc}
      position={position}
      widgetId={widgetId}
      color={color}
      size={size}
      theme={theme}
      autoOpen={autoOpen}
      lazyLoad={lazyLoad}
      embedded={true}
    />
  );
};

export default WebComponentWrapper;
