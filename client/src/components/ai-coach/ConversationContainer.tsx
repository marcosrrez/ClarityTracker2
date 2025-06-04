import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { DynamicInputBox } from "@/components/ui/dynamic-input-box";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ConversationContainerProps {
  onMessageSubmit?: (message: string) => void;
  initialMessages?: Message[];
  className?: string;
}

export function ConversationContainer({ 
  onMessageSubmit,
  initialMessages = [],
  className = ""
}: ConversationContainerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isConversationActive, setIsConversationActive] = useState(initialMessages.length > 0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (message: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: message,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsConversationActive(true);

    if (onMessageSubmit) {
      onMessageSubmit(message);
    }

    // AI response integration point
    setTimeout(() => {
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        content: "I'm here to help with your counseling journey! This connects to your professional development insights and supervision guidance.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className={`relative h-screen flex flex-col ${className}`}>
      <div 
        ref={conversationRef}
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          isConversationActive ? 'pb-24' : 'pb-0'
        }`}
        style={{
          scrollBehavior: 'smooth',
          paddingBottom: isConversationActive ? '120px' : '0px'
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.isUser ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className={
                message.isUser 
                  ? "bg-blue-100 text-blue-600" 
                  : "bg-purple-100 text-purple-600"
              }>
                {message.isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>

            <Card className={`max-w-[70%] p-4 ${
              message.isUser
                ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
            }`}>
              <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100">
                {message.content}
              </p>
              <div className={`text-xs mt-2 ${
                message.isUser ? "text-blue-600" : "text-gray-500"
              }`}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </Card>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      <DynamicInputBox
        onSubmit={handleSubmit}
        placeholder="Ask me about counseling techniques, supervision, or professional development..."
        isConversationActive={isConversationActive}
        className="transition-all duration-500 ease-in-out"
      />

      {!isConversationActive && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center max-w-md">
          <div className="mb-8">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              AI Coaching Assistant
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              I'm here to support your professional development journey. Ask me about counseling techniques, supervision topics, or career guidance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}