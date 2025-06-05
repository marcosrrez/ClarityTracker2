import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { DynamicInputBox } from "@/components/ui/dynamic-input-box";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Search, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  domain: string;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  searchResults?: SearchResult[];
  isResearchMode?: boolean;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectResearchIntent = (message: string): boolean => {
    const researchKeywords = [
      'search', 'find', 'research', 'study', 'article', 'paper', 'evidence',
      'pubmed', 'scholar', 'journal', 'literature', 'source', 'reference'
    ];
    return researchKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  };

  const performResearch = async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch('/api/research/search', {
        method: 'POST',
        body: JSON.stringify({ query, limit: 5 }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Research error:', error);
      return [];
    }
  };

  const summarizeContent = async (url: string, userContext: string): Promise<string> => {
    try {
      const response = await fetch('/api/research/summarize', {
        method: 'POST',
        body: JSON.stringify({ url, userContext }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      return data.summary || 'Unable to summarize content';
    } catch (error) {
      console.error('Summarization error:', error);
      return 'Failed to summarize content from this source';
    }
  };

  const handleSubmit = async (message: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: message,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsConversationActive(true);
    setIsProcessing(true);

    // Check if this is a research request
    const isResearchRequest = detectResearchIntent(message);
    
    try {
      if (isResearchRequest) {
        // Perform research
        const searchResults = await performResearch(message);
        
        // Create AI response with search results
        const aiResponse: Message = {
          id: `ai-${Date.now()}`,
          content: searchResults.length > 0 
            ? `I found ${searchResults.length} relevant research sources for your query. You can click on any result to get a summary tailored to your counseling practice.`
            : "I couldn't find specific research results for your query. You might want to try different keywords or check the sources directly.",
          isUser: false,
          timestamp: new Date(),
          searchResults,
          isResearchMode: true
        };

        setMessages(prev => [...prev, aiResponse]);
      } else {
        // Regular conversation handling
        if (onMessageSubmit) {
          onMessageSubmit(message);
        }
        
        // Placeholder AI response for non-research queries
        const aiResponse: Message = {
          id: `ai-${Date.now()}`,
          content: "I'm here to help with your counseling practice questions and research needs. Try asking me to search for research on a specific topic!",
          isUser: false,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('Message processing error:', error);
      const errorResponse: Message = {
        id: `ai-${Date.now()}`,
        content: "I encountered an error processing your request. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSummarizeClick = async (result: SearchResult) => {
    setIsProcessing(true);
    
    try {
      const summary = await summarizeContent(result.url, "Licensed Associate Counselor seeking practical applications");
      
      const summaryMessage: Message = {
        id: `summary-${Date.now()}`,
        content: `**Summary of "${result.title}"**\n\n${summary}\n\n*Source: ${result.domain}*`,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, summaryMessage]);
    } catch (error) {
      console.error('Summarization error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: `Unable to summarize content from ${result.domain}. You can visit the link directly for more information.`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
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

              {/* Search Results Display */}
              {message.searchResults && message.searchResults.length > 0 && (
                <div className="mt-4 space-y-3">
                  {message.searchResults.map((result, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                            {result.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                            {result.snippet}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                              {result.source}
                            </span>
                            <span>{result.domain}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSummarizeClick(result)}
                            disabled={isProcessing}
                            className="text-xs h-8"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Search className="h-3 w-3 mr-1" />
                            )}
                            Summarize
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(result.url, '_blank')}
                            className="text-xs h-8"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center max-w-md">
          <div className="mb-20">
            <h1 className="text-4xl font-semibold text-gray-900 dark:text-white mb-4">
              Ready when you are.
            </h1>
          </div>
        </div>
      )}
    </div>
  );
}