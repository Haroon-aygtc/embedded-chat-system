import React, { useEffect, useRef } from "react";
import ChatWidget from "@/components/chat/ChatWidget";

interface WebComponentWrapperProps {
  contextMode?: "business" | "general";
  contextRuleId?: string;
  title?: string;
  subtitle?: string;
  avatarSrc?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

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
  const { contextMode, contextRuleId, title, subtitle, avatarSrc, position } =
    props;
  const isDefined = useRef(false);

  useEffect(() => {
    if (!isDefined.current) {
      // Define the custom element if it hasn't been defined yet
      if (!customElements.get("chat-widget")) {
        customElements.define("chat-widget", ChatWidgetElement);
      }
      isDefined.current = true;
    }
  }, []);

  return (
    <ChatWidget
      contextMode={contextMode}
      contextRuleId={contextRuleId}
      title={title}
      subtitle={subtitle}
      avatarSrc={avatarSrc}
      position={position}
      embedded={true}
    />
  );
};

export default WebComponentWrapper;
