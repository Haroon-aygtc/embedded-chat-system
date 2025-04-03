import ChatWidget from "@/components/chat/ChatWidget";

export default function ChatWidgetStoryboard() {
  return (
    <div className="bg-gray-100 p-4 min-h-screen flex items-center justify-center">
      <ChatWidget
        initiallyOpen={true}
        contextMode="restricted"
        contextName="UAE Government Information"
      />
    </div>
  );
}
