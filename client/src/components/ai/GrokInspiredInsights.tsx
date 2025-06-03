import { useState, useEffect } from "react";
import { useLogEntries } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { generatePersonalizedDashboardInsights } from "@/lib/ai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Brain, 
  Target, 
  TrendingUp, 
  Award, 
  Users, 
  BookOpen, 
  RefreshCw,
  Send,
  Mic,
  Paperclip,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Share,
  Copy,
  MoreHorizontal,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Star,
  MessageSquare
} from "lucide-react";

interface GrokInsight {
  id: string;
  type: 'coaching' | 'analysis' | 'suggestion' | 'milestone' | 'pattern';
  title: string;
  content: string;
  confidence: number;
  category: string;
  tags: string[];
  actionable: boolean;
  timestamp: Date;
  helpful?: boolean;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  insights?: GrokInsight[];
}

export const GrokInspiredInsights = () => {
  const { user, userProfile } = useAuth();
  const { entries: logEntries = [], loading } = useLogEntries();
  
  const [insights, setInsights] = useState<GrokInsight[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeView, setActiveView] = useState<'insights' | 'chat' | 'analytics'>('insights');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  
  // Initial insights generation
  useEffect(() => {
    if (!loading && logEntries.length > 0) {
      generateInitialInsights();
    }
  }, [loading, logEntries.length]);

  const generateInitialInsights = async () => {
    setIsGenerating(true);
    try {
      const result = await generatePersonalizedDashboardInsights(logEntries, userProfile);
      
      const grokInsights: GrokInsight[] = [
        {
          id: 'weekly-focus',
          type: 'coaching',
          title: 'Weekly Development Focus',
          content: result.weeklyFocus,
          confidence: 0.92,
          category: 'Professional Growth',
          tags: ['weekly', 'focus', 'development'],
          actionable: true,
          timestamp: new Date(),
        },
        {
          id: 'skill-tip',
          type: 'suggestion',
          title: 'Skill Enhancement Opportunity',
          content: result.skillDevelopmentTip,
          confidence: 0.88,
          category: 'Skills',
          tags: ['skills', 'development', 'practice'],
          actionable: true,
          timestamp: new Date(),
        },
        {
          id: 'supervision',
          type: 'analysis',
          title: 'Supervision Discussion Topics',
          content: result.supervisionTopic,
          confidence: 0.85,
          category: 'Supervision',
          tags: ['supervision', 'discussion', 'growth'],
          actionable: true,
          timestamp: new Date(),
        },
        {
          id: 'growth-insight',
          type: 'milestone',
          title: 'Professional Growth Pattern',
          content: result.professionalGrowthInsight,
          confidence: 0.90,
          category: 'Patterns',
          tags: ['growth', 'patterns', 'professional'],
          actionable: false,
          timestamp: new Date(),
        }
      ];

      if (result.competencyFocus) {
        grokInsights.push({
          id: 'competency',
          type: 'coaching',
          title: 'Core Competency Development',
          content: result.competencyFocus,
          confidence: 0.94,
          category: 'Competencies',
          tags: ['competency', 'core', 'development'],
          actionable: true,
          timestamp: new Date(),
        });
      }

      if (result.patternAlert) {
        grokInsights.push({
          id: 'pattern-alert',
          type: 'pattern',
          title: 'Important Pattern Detected',
          content: result.patternAlert,
          confidence: 0.87,
          category: 'Alerts',
          tags: ['pattern', 'alert', 'attention'],
          actionable: true,
          timestamp: new Date(),
        });
      }

      setInsights(grokInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: currentMessage,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsAnalyzing(true);

    try {
      // Simulate AI response based on user input
      const aiResponse: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'assistant',
        content: generateContextualResponse(currentMessage),
        timestamp: new Date(),
      };

      setTimeout(() => {
        setChatMessages(prev => [...prev, aiResponse]);
        setIsAnalyzing(false);
      }, 1500);
    } catch (error) {
      console.error('Error generating response:', error);
      setIsAnalyzing(false);
    }
  };

  const generateContextualResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('hour') || lowerInput.includes('progress')) {
      const totalHours = logEntries.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
      return `You've logged ${totalHours} direct client contact hours so far. Based on your recent entries, I notice you're making steady progress. Consider focusing on documenting the therapeutic modalities you're using to enhance your supervision discussions.`;
    }
    
    if (lowerInput.includes('supervision') || lowerInput.includes('supervisor')) {
      return `For your next supervision session, I recommend discussing your recent work with anxiety interventions. Your notes show good progress in this area, and exploring advanced techniques could enhance your competency development.`;
    }
    
    if (lowerInput.includes('skill') || lowerInput.includes('develop') || lowerInput.includes('improve')) {
      return `Based on your session patterns, I see opportunities to strengthen your assessment skills and documentation practices. Consider exploring motivational interviewing techniques - they align well with your current client population.`;
    }
    
    if (lowerInput.includes('goal') || lowerInput.includes('milestone')) {
      return `You're making excellent progress toward your licensure goals. Your current trajectory suggests you'll reach 100 hours within the next 2 months. Focus on maintaining consistent documentation and seeking diverse clinical experiences.`;
    }

    return `I understand you're asking about ${input}. Based on your professional development journey, I recommend focusing on consistent session documentation and seeking feedback from your supervisor to accelerate your growth toward licensure.`;
  };

  const getInsightIcon = (type: GrokInsight['type']) => {
    switch (type) {
      case 'coaching': return <Sparkles className="h-4 w-4" />;
      case 'analysis': return <Brain className="h-4 w-4" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4" />;
      case 'milestone': return <Award className="h-4 w-4" />;
      case 'pattern': return <TrendingUp className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-emerald-600 bg-emerald-50';
    if (confidence >= 0.8) return 'text-blue-600 bg-blue-50';
    return 'text-amber-600 bg-amber-50';
  };

  const categories = ['all', 'Professional Growth', 'Skills', 'Supervision', 'Patterns', 'Competencies', 'Alerts'];

  const filteredInsights = insights.filter(insight => 
    selectedCategories.includes('all') || selectedCategories.includes(insight.category)
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Grok-style Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Insights Coach
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Grok-powered intelligent guidance for your professional development
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex gap-1">
          {[
            { id: 'insights', label: 'Smart Insights', icon: Brain },
            { id: 'chat', label: 'AI Coach Chat', icon: MessageSquare },
            { id: 'analytics', label: 'Progress Analytics', icon: TrendingUp }
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeView === id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView(id as any)}
              className={`rounded-lg transition-all ${
                activeView === id 
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Smart Insights View */}
      {activeView === 'insights' && (
        <div className="space-y-6">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => {
                  if (category === 'all') {
                    setSelectedCategories(['all']);
                  } else {
                    setSelectedCategories(prev => 
                      prev.includes(category) 
                        ? prev.filter(c => c !== category)
                        : [...prev.filter(c => c !== 'all'), category]
                    );
                  }
                }}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Insights Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {isGenerating ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </Card>
              ))
            ) : (
              filteredInsights.map(insight => (
                <Card key={insight.id} className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                          {getInsightIcon(insight.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{insight.category}</Badge>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                              {Math.round(insight.confidence * 100)}% confidence
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      {insight.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {insight.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {insight.actionable && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Actionable
                          </Badge>
                        )}
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Share className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Regenerate Button */}
          <div className="flex justify-center">
            <Button onClick={generateInitialInsights} disabled={isGenerating} className="rounded-xl">
              <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating Insights...' : 'Refresh Insights'}
            </Button>
          </div>
        </div>
      )}

      {/* AI Coach Chat View */}
      {activeView === 'chat' && (
        <Card className="h-[600px] flex flex-col">
          <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">AI Coaching Assistant</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ask me anything about your professional development
                </p>
              </div>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Start a conversation
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 text-sm">
                    Ask about your progress, get coaching tips, or discuss supervision topics
                  </p>
                </div>
              )}
              
              {chatMessages.map(message => (
                <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : ''}`}>
                  {message.type === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white ml-auto' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.type === 'user' && (
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {user?.displayName?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              
              {isAnalyzing && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Ask about your progress, get coaching tips, or discuss supervision..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  className="min-h-[60px] pr-24 resize-none rounded-xl"
                />
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button 
                onClick={handleSendMessage} 
                disabled={!currentMessage.trim() || isAnalyzing}
                className="h-[60px] px-6 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Progress Analytics View */}
      {activeView === 'analytics' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-6 w-6 text-blue-500" />
                <h3 className="font-semibold">Total Hours</h3>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {logEntries.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Direct client contact</p>
              <Progress value={25} className="mt-3" />
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6 text-emerald-500" />
                <h3 className="font-semibold">Supervision</h3>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {logEntries.reduce((sum, entry) => sum + (entry.supervisionHours || 0), 0)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hours completed</p>
              <Progress value={60} className="mt-3" />
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Star className="h-6 w-6 text-amber-500" />
                <h3 className="font-semibold">AI Insights</h3>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {insights.length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Generated this week</p>
              <Progress value={80} className="mt-3" />
            </Card>
          </div>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Progress Trend</h3>
            <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Progress visualization coming soon</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};