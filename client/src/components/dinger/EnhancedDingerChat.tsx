import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Brain, 
  Users, 
  Stethoscope, 
  BookOpen, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp,
  Clock,
  Target,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

interface EnhancedResponse {
  response: string;
  reasoningSteps?: string[];
  alternativePerspectives?: string[];
  resourceRecommendations: ResourceSuggestion[];
  followUpSuggestions: string[];
  confidenceLevel: number;
  nextSessionTopics?: string[];
  supervisionPrep?: string[];
}

interface ResourceSuggestion {
  type: 'article' | 'technique' | 'course' | 'consultation' | 'book' | 'video';
  title: string;
  description: string;
  url?: string;
  relevanceScore: number;
  priority: 'immediate' | 'development' | 'reference';
  competencyArea: string;
}

interface Conversation {
  id: string;
  query: string;
  response: EnhancedResponse;
  mode: string;
  timestamp: Date;
  rating?: number;
}

export default function EnhancedDingerChat() {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('supervisor');
  const [isLoading, setIsLoading] = useState(false);
  const [showReasoningSteps, setShowReasoningSteps] = useState<{[key: string]: boolean}>({});
  const [showAlternatives, setShowAlternatives] = useState<{[key: string]: boolean}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const modes = [
    { value: 'supervisor', label: 'Supervisor Mode', icon: Users, description: 'Structured guidance and evaluation' },
    { value: 'peer', label: 'Peer Consultant', icon: Users, description: 'Collaborative problem-solving' },
    { value: 'clinician', label: 'Master Clinician', icon: Stethoscope, description: 'Advanced therapeutic techniques' },
    { value: 'researcher', label: 'Research Expert', icon: BookOpen, description: 'Evidence-based recommendations' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || !user || isLoading) return;

    setIsLoading(true);
    const userMessage = currentMessage;
    setCurrentMessage('');

    try {
      const response = await fetch('/api/dinger/enhanced-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage,
          userId: user?.uid || 'anonymous',
          mode: selectedMode
        })
      });

      const result = await response.json();

      const newConversation: Conversation = {
        id: `conv_${Date.now()}`,
        query: userMessage,
        response: result,
        mode: selectedMode,
        timestamp: new Date()
      };

      setConversations(prev => [...prev, newConversation]);
    } catch (error) {
      console.error('Enhanced chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const rateResponse = async (conversationId: string, rating: number) => {
    try {
      await fetch('/api/dinger/rate-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId, rating })
      });

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, rating }
            : conv
        )
      );
    } catch (error) {
      console.error('Rating error:', error);
    }
  };

  const toggleReasoningSteps = (conversationId: string) => {
    setShowReasoningSteps(prev => ({
      ...prev,
      [conversationId]: !prev[conversationId]
    }));
  };

  const toggleAlternatives = (conversationId: string) => {
    setShowAlternatives(prev => ({
      ...prev,
      [conversationId]: !prev[conversationId]
    }));
  };

  const getModeIcon = (mode: string) => {
    const modeConfig = modes.find(m => m.value === mode);
    return modeConfig?.icon || Brain;
  };

  const getModeColor = (mode: string) => {
    const colors = {
      supervisor: 'bg-blue-500',
      peer: 'bg-green-500',
      clinician: 'bg-purple-500',
      researcher: 'bg-orange-500'
    };
    return colors[mode as keyof typeof colors] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      immediate: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      development: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      reference: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Enhanced Dinger</h1>
          <p className="text-gray-600 dark:text-gray-400">Advanced AI coaching with adaptive reasoning</p>
        </div>
        
        <Select value={selectedMode} onValueChange={setSelectedMode}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modes.map((mode) => {
              const Icon = mode.icon;
              return (
                <SelectItem key={mode.value} value={mode.value}>
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{mode.label}</div>
                      <div className="text-xs text-gray-500">{mode.description}</div>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {conversations.length === 0 && (
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Welcome to Enhanced Dinger
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Ask me anything about counseling, therapy techniques, supervision, or professional development. 
                  I'll provide adaptive responses based on your experience level and learning style.
                </p>
              </div>
            )}

            {conversations.map((conversation) => {
              const ModeIcon = getModeIcon(conversation.mode);
              return (
                <div key={conversation.id} className="space-y-4">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white p-4 rounded-lg max-w-2xl">
                      <p>{conversation.query}</p>
                      <div className="text-xs text-blue-100 mt-2">
                        {new Date(conversation.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Dinger Response */}
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg max-w-4xl w-full">
                      {/* Mode Badge */}
                      <div className="flex items-center space-x-2 mb-4">
                        <div className={`p-2 rounded-full ${getModeColor(conversation.mode)}`}>
                          <ModeIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-sm">
                          {modes.find(m => m.value === conversation.mode)?.label}
                        </span>
                        <Badge variant="secondary" className="ml-auto">
                          {conversation.response.confidenceLevel}% confidence
                        </Badge>
                      </div>

                      {/* Main Response */}
                      <div className="prose dark:prose-invert max-w-none mb-4">
                        <p className="whitespace-pre-wrap">{conversation.response.response}</p>
                      </div>

                      {/* Reasoning Steps */}
                      {conversation.response.reasoningSteps && conversation.response.reasoningSteps.length > 0 && (
                        <div className="mb-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleReasoningSteps(conversation.id)}
                            className="flex items-center space-x-2"
                          >
                            <Brain className="h-4 w-4" />
                            <span>Reasoning Steps</span>
                            {showReasoningSteps[conversation.id] ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </Button>
                          
                          {showReasoningSteps[conversation.id] && (
                            <div className="mt-2 space-y-2">
                              {conversation.response.reasoningSteps.map((step, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                  <Badge variant="outline" className="mt-0.5">
                                    {index + 1}
                                  </Badge>
                                  <p className="text-sm">{step}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Alternative Perspectives */}
                      {conversation.response.alternativePerspectives && conversation.response.alternativePerspectives.length > 0 && (
                        <div className="mb-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAlternatives(conversation.id)}
                            className="flex items-center space-x-2"
                          >
                            <Lightbulb className="h-4 w-4" />
                            <span>Alternative Perspectives</span>
                            {showAlternatives[conversation.id] ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </Button>
                          
                          {showAlternatives[conversation.id] && (
                            <div className="mt-2 space-y-2">
                              {conversation.response.alternativePerspectives.map((perspective, index) => (
                                <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                                  <p className="text-sm">{perspective}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Resource Recommendations */}
                      {conversation.response.resourceRecommendations.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-sm mb-2 flex items-center space-x-2">
                            <BookOpen className="h-4 w-4" />
                            <span>Recommended Resources</span>
                          </h4>
                          <div className="space-y-2">
                            {conversation.response.resourceRecommendations.map((resource, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-sm">{resource.title}</h5>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      {resource.description}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {resource.type}
                                      </Badge>
                                      <Badge className={`text-xs ${getPriorityColor(resource.priority)}`}>
                                        {resource.priority}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 ml-2">
                                    {resource.relevanceScore}% relevant
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Follow-up Suggestions */}
                      {conversation.response.followUpSuggestions.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-sm mb-2 flex items-center space-x-2">
                            <Target className="h-4 w-4" />
                            <span>Follow-up Questions</span>
                          </h4>
                          <div className="space-y-1">
                            {conversation.response.followUpSuggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="ghost"
                                size="sm"
                                className="h-auto p-2 text-left justify-start"
                                onClick={() => setCurrentMessage(suggestion)}
                              >
                                <span className="text-xs">{suggestion}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rating */}
                      <div className="flex items-center space-x-2 pt-4 border-t">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Rate this response:</span>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            variant="ghost"
                            size="sm"
                            onClick={() => rateResponse(conversation.id, rating)}
                            className="p-1"
                          >
                            <Star 
                              className={`h-4 w-4 ${
                                conversation.rating && conversation.rating >= rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm">Dinger is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Dinger anything about counseling, therapy, or professional development..."
              className="flex-1 min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!currentMessage.trim() || isLoading}
              size="lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}