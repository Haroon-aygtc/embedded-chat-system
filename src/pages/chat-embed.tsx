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
    primaryColor: searchParams.get("primaryColor") || "#3b82f6",
    avatarSrc: searchParams.get("avatarSrc") || undefined,
  });

  // Apply any styles needed for the iframe
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.body.style.overflow = "";
    };
  }, []);

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
      />
    </div>
  );
};

export default ChatEmbedPage;
