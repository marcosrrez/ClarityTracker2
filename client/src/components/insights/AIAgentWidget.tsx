import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { 
  Send,
  Paperclip,
  CheckCircle,
  BookOpen,
  History,
  Trash2,
  Bot
} from "lucide-react";
import { createInsightCard } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { InsertInsightCard } from "@shared/schema";

interface AIAgentWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResourceAdded?: () => void;
}

export function AIAgentWidget({ open, onOpenChange, onResourceAdded }: AIAgentWidgetProps) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [lastResponse, setLastResponse] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setInputValue("");
      setResultMessage("");
      setShowSuccess(false);
      setAttachedFile(null);
      setShowCreateCard(false);
      setLastResponse("");
    }
    onOpenChange(newOpen);
  };

  const handleCreateLearningCard = async () => {
    if (!lastResponse) return;

    try {
      const learningCard: InsertInsightCard = {
        type: 'note',
        title: `Learning Card: ${inputValue.substring(0, 50)}...`,
        content: `**Original Question:** ${inputValue}${attachedFile ? ` (with ${attachedFile.name})` : ''}\n\n**AI Response:** ${lastResponse}`,
        tags: ['learning-card', 'ai-assistant', ...(attachedFile ? ['file-analysis'] : [])],
      };

      await createInsightCard(user?.uid || '', learningCard);
      
      toast({
        title: "Learning Card Created",
        description: "The conversation has been saved to your insights.",
      });

      setShowCreateCard(false);
      
      if (onResourceAdded) {
        onResourceAdded();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create learning card.",
        variant: "destructive",
      });
    }
  };

  const handleSaveConversation = async () => {
    if (conversationHistory.length === 0) return;

    try {
      const conversationText = conversationHistory
        .map(msg => `**${msg.role === 'user' ? 'You' : 'Assistant'}:** ${msg.content}`)
        .join('\n\n');

      const conversationCard: InsertInsightCard = {
        type: 'note',
        title: `AI Conversation - ${new Date().toLocaleDateString()}`,
        content: conversationText,
        tags: ['conversation', 'ai-assistant', 'saved-chat'],
      };

      await createInsightCard(user?.uid || '', conversationCard);
      
      toast({
        title: "Conversation Saved",
        description: "Your entire conversation has been saved to your insights.",
      });
      
      if (onResourceAdded) {
        onResourceAdded();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save conversation.",
        variant: "destructive",
      });
    }
  };

  const handleFileAttachment = (file: File) => {
    setAttachedFile(file);
    
    toast({
      title: "File attached",
      description: `${file.name} is ready for analysis.`,
    });
  };

  const processFileContent = async (file: File): Promise<string> => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    } else if (file.type === 'application/pdf') {
      return `PDF file: ${file.name} (${Math.round(file.size / 1024)}KB)`;
    } else {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsText(file);
      });
    }
  };

  const handleAIQuery = async (question: string, fileContent?: string) => {
    setIsLoading(true);
    setResultMessage("Thinking...");
    
    try {
      // Add to conversation history
      const userMessage = {
        role: 'user' as const,
        content: question + (attachedFile ? ` (with ${attachedFile.name})` : ''),
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, userMessage]);

      // Create a therapy-focused prompt
      const systemPrompt = `You are ClarityLog's AI assistant, specializing in helping Licensed Associate Counselors (LACs) with their professional development and licensure journey. You have expertise in:
      - Therapy techniques (CBT, DBT, motivational interviewing, etc.)
      - Professional development and supervision
      - Licensure requirements and progress tracking
      - Clinical documentation and reflection
      
      Provide helpful, professional responses that support their growth as counselors.`;

      // Combine question with file content if available
      let fullMessage = question;
      if (fileContent && attachedFile) {
        if (attachedFile.type.startsWith('image/')) {
          fullMessage += `\n\nI've attached an image file (${attachedFile.name}). Please analyze this image and provide relevant insights.`;
        } else {
          fullMessage += `\n\nFile content from ${attachedFile.name}:\n${fileContent}`;
        }
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: fullMessage,
          systemPrompt,
          userId: user?.uid,
          fileContent: attachedFile?.type.startsWith('image/') ? fileContent : undefined,
          fileType: attachedFile?.type
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Add AI response to conversation history
      const aiMessage = {
        role: 'assistant' as const,
        content: data.response,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, aiMessage]);
      
      setLastResponse(data.response);
      setResultMessage(`✓ ${data.response.substring(0, 100)}...`);
      setShowSuccess(true);
      setShowCreateCard(true);
      
    } catch (error) {
      console.error('Error with AI query:', error);
      setResultMessage("I'm having trouble connecting right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputSubmit = async () => {
    if (!inputValue.trim()) return;
    
    setIsLoading(true);
    setShowSuccess(false);
    setShowCreateCard(false);
    
    try {
      let fileContent = undefined;
      if (attachedFile) {
        fileContent = await processFileContent(attachedFile);
      }
      await handleAIQuery(inputValue, fileContent);
      
      // Clear the input but keep the file
      setInputValue("");
      
    } catch (error) {
      console.error('Error processing input:', error);
      setResultMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-none w-full h-full p-0 gap-0 bg-white dark:bg-slate-900" aria-describedby="ai-agent-description">
        <DialogTitle className="sr-only">AI Assistant</DialogTitle>
        
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your therapy expertise companion
                  </p>
                </div>
              </div>
              {conversationHistory.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveConversation}
                    className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <History className="h-4 w-4 mr-2" />
                    Save Chat
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConversationHistory([])}
                    className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {conversationHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  How can I help you today?
                </h3>
                <p className="text-gray-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                  Ask questions about therapy techniques, get guidance on cases, analyze documents, or discuss your professional development.
                </p>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {/* Conversation History */}
                {conversationHistory.map((message, index) => (
                  <div key={index} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className={`p-4 rounded-2xl ${
                        message.role === 'user' 
                          ? 'bg-purple-600 text-white rounded-br-md' 
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-md'
                      }`}>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                      </div>
                      <div className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-right text-purple-600' : 'text-left text-gray-500 dark:text-slate-400'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'order-1 bg-purple-600' 
                        : 'order-2 bg-gray-200 dark:bg-slate-700'
                    }`}>
                      {message.role === 'user' ? (
                        <span className="text-white text-xs font-medium">You</span>
                      ) : (
                        <Bot className="h-4 w-4 text-gray-600 dark:text-slate-300" />
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-gray-600 dark:text-slate-300" />
                    </div>
                    <div className="max-w-[80%]">
                      <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-2xl rounded-bl-md">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                          <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                          {resultMessage}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Create Learning Card Option */}
                {showCreateCard && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <div>
                          <span className="text-amber-700 dark:text-amber-300 font-medium text-sm">Save as learning card?</span>
                          <p className="text-amber-600 dark:text-amber-400 text-xs">Add this conversation to your insights collection</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCreateCard(false)}
                          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
                        >
                          Skip
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCreateLearningCard}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          Save Card
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            {attachedFile && (
              <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center gap-3">
                <Paperclip className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-purple-700 dark:text-purple-300 flex-1">{attachedFile.name}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 text-lg"
                >
                  ×
                </button>
              </div>
            )}
            
            <div className="flex gap-3">
              <div className="flex-1">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about therapy techniques, case guidance, or upload files for analysis..."
                  className="min-h-[80px] bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent rounded-xl text-sm"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleInputSubmit();
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => document.getElementById('ai-file-upload')?.click()}
                  variant="outline"
                  size="sm"
                  className={`px-3 ${attachedFile ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : ''}`}
                  disabled={isLoading}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleInputSubmit}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            id="ai-file-upload"
            type="file"
            accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileAttachment(file);
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}