import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Search, 
  Plus, 
  MessageCircle, 
  Sparkles, 
  Edit, 
  MoreHorizontal, 
  X,
  Clock,
  Star,
  ChevronDown,
  Brain,
  Lightbulb,
  Target,
  BookOpen
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLogEntries } from "@/hooks/use-firestore";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'insight' | 'suggestion';
}

interface Thread {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  category?: string;
}

interface GrokStyleCoachProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GrokStyleCoach = ({ isOpen, onClose }: GrokStyleCoachProps) => {
  const { user, userProfile } = useAuth();
  const { entries: logEntries = [] } = useLogEntries();
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome thread
  useEffect(() => {
    if (threads.length === 0) {
      const welcomeThread: Thread = {
        id: 'welcome',
        title: 'Welcome to ClarityLog AI',
        createdAt: new Date(),
        updatedAt: new Date(),
        category: 'Welcome',
        messages: [
          {
            id: '1',
            content: `Hi ${userProfile?.preferredName || 'there'}! I'm your AI coaching assistant for professional development. I'm here to help you with insights about your therapy practice, supervision preparation, and licensure journey.`,
            isUser: false,
            timestamp: new Date(),
            type: 'text'
          },
          {
            id: '2',
            content: "I can help you analyze patterns in your sessions, prepare for supervision, identify growth opportunities, and provide personalized coaching based on your actual practice data.",
            isUser: false,
            timestamp: new Date(),
            type: 'insight'
          },
          {
            id: '3',
            content: "What would you like to explore today? You can ask about your progress, get supervision prep help, or discuss any challenges you're facing.",
            isUser: false,
            timestamp: new Date(),
            type: 'suggestion'
          }
        ]
      };
      setThreads([welcomeThread]);
      setCurrentThreadId('welcome');
    }
  }, [userProfile?.preferredName]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threads]);

  const currentThread = threads.find(t => t.id === currentThreadId);

  const createNewThread = () => {
    const newThread: Thread = {
      id: `thread-${Date.now()}`,
      title: 'New Conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };
    setThreads(prev => [newThread, ...prev]);
    setCurrentThreadId(newThread.id);
  };

  const generateContextualResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    const totalHours = logEntries.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
    const recentEntries = logEntries.slice(-5);
    
    if (lowerInput.includes('progress') || lowerInput.includes('hour')) {
      return `You've completed ${totalHours} direct client contact hours so far. Based on your recent sessions, you're making consistent progress toward your licensure goals. Your documentation has been thorough, which will be valuable for supervision discussions.`;
    }
    
    if (lowerInput.includes('supervision') || lowerInput.includes('supervisor')) {
      const supervisionHours = logEntries.reduce((sum, entry) => sum + (entry.supervisionHours || 0), 0);
      return `You've completed ${supervisionHours} supervision hours. For your next session, consider discussing your therapeutic approach with recent clients and any challenges you're encountering. Your recent entries show good clinical reasoning.`;
    }
    
    if (lowerInput.includes('competenc') || lowerInput.includes('skill')) {
      return `Your session notes demonstrate growing competency in several areas. Focus on developing your assessment skills and exploring evidence-based interventions that align with your client population. Consider documenting specific techniques you're using.`;
    }
    
    if (lowerInput.includes('challenge') || lowerInput.includes('difficult')) {
      return `Challenges are a normal part of professional development. Based on your practice patterns, consider discussing difficult cases in supervision and exploring additional training in areas where you feel less confident. Remember that growth comes from working through challenges.`;
    }
    
    if (lowerInput.includes('goal') || lowerInput.includes('milestone')) {
      return `Your current trajectory suggests you're on track for licensure. Key milestones ahead include reaching competency benchmarks and maintaining consistent supervision. Focus on quality documentation and seeking diverse clinical experiences.`;
    }

    return `I understand you're asking about "${input}". Based on your professional development journey, I recommend focusing on consistent documentation, seeking feedback from supervision, and identifying specific learning goals for your next phase of growth.`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
      type: 'text'
    };

    // Add user message
    setThreads(prev => prev.map(thread => 
      thread.id === currentThreadId 
        ? { ...thread, messages: [...thread.messages, userMessage], updatedAt: new Date() }
        : thread
    ));

    // Update thread title if it's the first user message
    if (currentThread && currentThread.messages.filter(m => m.isUser).length === 0) {
      const newTitle = inputValue.slice(0, 30) + (inputValue.length > 30 ? '...' : '');
      setThreads(prev => prev.map(thread => 
        thread.id === currentThreadId 
          ? { ...thread, title: newTitle }
          : thread
      ));
    }

    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: generateContextualResponse(inputValue),
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };

      setThreads(prev => prev.map(thread => 
        thread.id === currentThreadId 
          ? { ...thread, messages: [...thread.messages, aiMessage], updatedAt: new Date() }
          : thread
      ));

      setIsLoading(false);
    }, 1000);
  };

  const filteredThreads = threads.filter(thread => 
    searchQuery === '' || 
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'insight': return <Lightbulb className="h-3 w-3 text-amber-500" />;
      case 'suggestion': return <Target className="h-3 w-3 text-blue-500" />;
      default: return <Brain className="h-3 w-3 text-purple-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0">
        <div className="flex h-full">
          {/* Grok-style Sidebar */}
          {showSidebar && (
            <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <span className="font-semibold text-sm">ClarityLog AI</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={createNewThread}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Actions Section */}
              <div className="p-4">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Actions</div>
                <div className="space-y-1">
                  <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs">
                    <MessageCircle className="h-3 w-3 mr-2" />
                    Create New Chat
                  </Button>
                </div>
              </div>

              {/* Conversation History */}
              <div className="flex-1 overflow-hidden">
                <div className="px-4 pb-2">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Today</div>
                </div>
                <ScrollArea className="h-full px-2">
                  <div className="space-y-1 pb-4">
                    {filteredThreads.map((thread) => (
                      <Button
                        key={thread.id}
                        variant={currentThreadId === thread.id ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start h-auto p-3 text-left"
                        onClick={() => setCurrentThreadId(thread.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{thread.title}</div>
                          {thread.messages.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                              {thread.messages[thread.messages.length - 1].content.slice(0, 40)}...
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {format(thread.updatedAt, 'h:mm a')}
                          </div>
                        </div>
                        <MoreHorizontal className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{currentThread?.title || 'ClarityLog AI'}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Professional development coaching assistant
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowSidebar(!showSidebar)}>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showSidebar ? 'rotate-90' : '-rotate-90'}`} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {currentThread?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.isUser ? 'justify-end' : ''}`}
                  >
                    {!message.isUser && (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getMessageIcon(message.type)}
                      </div>
                    )}
                    
                    <div className={`max-w-lg ${message.isUser ? 'ml-auto' : ''}`}>
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                        message.isUser 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      }`}>
                        {message.content}
                      </div>
                      <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                        message.isUser ? 'text-right' : ''
                      }`}>
                        {format(message.timestamp, 'h:mm a')}
                      </div>
                    </div>

                    {message.isUser && (
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {user?.displayName?.[0] || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Brain className="h-3 w-3 text-white" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="max-w-3xl mx-auto">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Ask about your progress, supervision prep, or professional development..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      className="pr-12 h-12 text-sm"
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                      Grok 3
                    </div>
                  </div>
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!inputValue.trim() || isLoading}
                    className="h-12 px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setInputValue('How is my progress toward licensure?')}>
                    Progress Update
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setInputValue('Help me prepare for supervision')}>
                    Supervision Prep
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setInputValue('What skills should I focus on developing?')}>
                    Skill Development
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};