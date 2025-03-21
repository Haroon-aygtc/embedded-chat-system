import React from "react";
import ChatWidget from "@/components/chat/ChatWidget";

const ChatPage = () => {
  return (
    <div className="w-full h-screen">
      <ChatWidget
        isFullPage={true}
        title="AI Chat Assistant"
        subtitle="Ask me anything about our services"
      />
    </div>
  );
};

export default ChatPage;
