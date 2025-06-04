import { ConversationContainer } from "@/components/ai-coach/ConversationContainer";
import { useAuth } from "@/hooks/use-auth";

export default function AICoach() {
  const { user } = useAuth();

  const handleMessageSubmit = async (message: string) => {
    // Integration point for AI services
    console.log("AI Coach message:", message);
    
    // Here you would integrate with your AI service
    // Example: await sendToAIService(message, user?.uid);
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900">
      <ConversationContainer 
        onMessageSubmit={handleMessageSubmit}
        className="w-full"
      />
    </div>
  );
}