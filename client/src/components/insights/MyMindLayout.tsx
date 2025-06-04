import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Plus, X, Upload, Calendar, Clock, Users, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InsightCard, InsertInsightCard } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ResourceWidget } from "./ResourceWidget_simple";

interface AiMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface Thread {
  id: string;
  messages: AiMessage[];
  lastMessage?: AiMessage;
  timestamp: Date;
}

interface GalleryItem {
  id: string;
  dateOfContact: Date;
  clientContactHours: number;
  notes: string;
  analysis?: any;
}

interface MyMindLayoutProps {
  galleryItems: GalleryItem[];
  onItemClick: (item: GalleryItem) => void;
  onRefresh?: () => void;
}

export function MyMindLayout({ galleryItems, onItemClick, onRefresh }: MyMindLayoutProps) {
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const [showResourceWidget, setShowResourceWidget] = useState(false);
  const [aiInputValue, setAiInputValue] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Record<string, Thread>>({});
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simplified without mutations for now

  useEffect(() => {
    if (aiMessages.length > 0) {
      aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages]);

  const handleSendAiMessage = async () => {
    if (!aiInputValue.trim() || isAiLoading) return;

    const userMessage: AiMessage = {
      id: Date.now().toString(),
      content: aiInputValue.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setAiMessages(prev => [...prev, userMessage]);
    setAiInputValue("");
    setIsAiLoading(true);

    try {
      const response = await apiRequest('/api/ai/chat', {
        method: 'POST',
        body: { message: userMessage.content }
      });

      const aiMessage: AiMessage = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        isUser: false,
        timestamp: new Date()
      };

      setAiMessages(prev => [...prev, aiMessage]);

      if (currentThreadId) {
        setThreads(prev => ({
          ...prev,
          [currentThreadId]: {
            ...prev[currentThreadId],
            messages: [...(prev[currentThreadId]?.messages || []), userMessage, aiMessage],
            lastMessage: aiMessage,
            timestamp: new Date()
          }
        }));
      }
    } catch (error) {
      console.error('AI chat error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleQuickNote = async () => {
    const newCard: InsertInsightCard = {
      userId: "current-user",
      title: "Quick Note",
      content: "",
      type: "note",
      category: "personal",
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await createInsightCardMutation.mutateAsync(newCard);
      toast({
        title: "Success",
        description: "Quick note created successfully",
      });
    } catch (error) {
      console.error('Error creating quick note:', error);
      toast({
        title: "Error",
        description: "Failed to create quick note",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            MyMind
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
            {galleryItems.length} insights
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowResourceWidget(true)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleQuickNote}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setShowAIAgent(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat with Dinger
          </Button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {galleryItems.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No insights yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Start by adding your first log entry or chatting with Dinger
            </p>
            <Button
              onClick={() => setShowAIAgent(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Conversation
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 cursor-pointer"
                onClick={() => onItemClick(item)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.dateOfContact.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    <Clock className="h-3 w-3" />
                    {item.clientContactHours}h
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-4">
                  {item.notes}
                </p>
                
                {item.analysis && (
                  <div className="flex flex-wrap gap-1">
                    {item.analysis.themes?.slice(0, 3).map((theme: string, index: number) => (
                      <span
                        key={index}
                        className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* AI Chat Interface */}
      <Dialog open={showAIAgent} onOpenChange={setShowAIAgent}>
        <DialogContent className="max-w-none w-full h-full p-0 gap-0 bg-[#FEFEFE] dark:bg-[#0D0D0D] [&>button]:hidden" aria-describedby="ai-coach-description">
          <DialogTitle className="sr-only">AI Coach Conversation</DialogTitle>
          <div className="flex flex-col h-full">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/30 dark:border-gray-800/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowThreads(true)}
                className="w-10 h-10 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-xl"
              >
                <div className="flex items-center gap-0.5">
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                </div>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIAgent(false)}
                className="w-10 h-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Chat Container - Mobile Optimized */}
            <div className="flex-1 overflow-y-auto" style={{ paddingBottom: '120px' }}>
              <div className="max-w-4xl mx-auto px-4 py-6">
                
                {/* Welcome Message */}
                {aiMessages.length === 0 && !isAiLoading && (
                  <div className="text-center space-y-6 py-12">
                    <h1 
                      className="text-2xl font-light text-gray-900 dark:text-gray-100"
                      style={{ 
                        fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      Hey there, great to meet you. I'm Dinger, your counseling AI assistant.
                    </h1>
                    <p 
                      className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                      style={{ 
                        fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                        lineHeight: '1.7'
                      }}
                    >
                      I specialize in mental health, counseling theories, therapeutic modalities, the DSM, cognitive psychology, neuroscience applications, clinical practice, and business guidance for LACs and LPCs.
                    </p>
                    <p 
                      className="text-sm text-gray-500 dark:text-gray-500"
                      style={{ 
                        fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                        lineHeight: '1.6'
                      }}
                    >
                      What aspect of counseling would you like to explore?
                    </p>
                  </div>
                )}

                {/* Messages */}
                {aiMessages.length > 0 && (
                  <div className="space-y-6">
                    {aiMessages.map((message) => (
                      <div key={message.id}>
                        {message.isUser ? (
                          <div className="flex justify-end">
                            <div 
                              className="max-w-[85%] text-gray-900 dark:text-gray-100 break-words"
                              style={{ 
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                fontSize: '1rem',
                                lineHeight: '1.6'
                              }}
                            >
                              {message.content}
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="text-gray-800 dark:text-gray-200 break-words whitespace-pre-wrap"
                            style={{ 
                              fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                              fontSize: '1rem',
                              lineHeight: '1.7',
                              letterSpacing: '0.01em',
                              fontWeight: '400'
                            }}
                          >
                            {message.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Loading Indicator */}
                {isAiLoading && (
                  <div className="flex items-center gap-3 text-gray-500 py-6">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span 
                      className="text-sm italic"
                      style={{ 
                        fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                      }}
                    >
                      Dinger is thinking...
                    </span>
                  </div>
                )}
                
                <div ref={aiMessagesEndRef} className="h-px" />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200/30 dark:border-gray-700/30 bg-white dark:bg-gray-900">
              <div className="px-4 py-4">
                <div className="relative bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
                  <textarea
                    value={aiInputValue}
                    onChange={(e) => setAiInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAiMessage();
                      }
                    }}
                    placeholder="Ask about counseling theories, DSM, clinical practice, or business guidance..."
                    className="w-full min-h-[80px] max-h-[160px] px-6 py-4 pr-16 border-none bg-transparent resize-none focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-3xl text-base"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      lineHeight: '1.5'
                    }}
                    disabled={isAiLoading}
                    rows={2}
                  />
                  <Button
                    onClick={handleSendAiMessage}
                    disabled={!aiInputValue.trim() || isAiLoading}
                    className="absolute right-3 bottom-3 w-10 h-10 rounded-2xl bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white transition-all duration-200"
                  >
                    {isAiLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Threads Panel */}
      <Dialog open={showThreads} onOpenChange={setShowThreads}>
        <DialogContent className="max-w-none w-full h-full p-0 gap-0 bg-[#FEFEFE] dark:bg-[#0D0D0D]">
          <DialogTitle className="sr-only">Conversation Threads</DialogTitle>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/30 dark:border-gray-800/30">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Conversations</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowThreads(false)}
                className="w-10 h-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {Object.keys(threads).length === 0 ? (
                <div className="text-center py-16">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No conversations yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start a new thread to begin chatting with Dinger</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(threads).map(([threadId, thread]) => (
                    <div
                      key={threadId}
                      className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm cursor-pointer"
                      onClick={() => {
                        setCurrentThreadId(threadId);
                        setAiMessages(thread.messages);
                        setShowThreads(false);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {thread.lastMessage?.content || 'No messages yet'}
                          </p>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                            {thread.lastMessage?.timestamp ? new Date(thread.lastMessage.timestamp).toLocaleDateString() : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resource Widget */}
      <ResourceWidget 
        open={showResourceWidget}
        onOpenChange={setShowResourceWidget}
        onResourceAdded={onRefresh}
      />
    </div>
  );
}