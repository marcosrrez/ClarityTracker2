import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  Calendar,
  Clock,
  MessageCircle,
  Brain,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Plus,
  Filter,
  Star,
  Heart
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface JourneyEntry {
  id: string;
  type: 'session' | 'reflection' | 'insight' | 'milestone';
  date: Date;
  title: string;
  content: string;
  tags: string[];
  competencyArea?: string;
  mood?: 'challenging' | 'neutral' | 'positive' | 'breakthrough';
  aiInsight?: {
    title: string;
    content: string;
    actionableSteps: string[];
  };
}

const competencyColors = {
  'Clinical Skills': 'bg-blue-100 text-blue-800',
  'Ethics': 'bg-green-100 text-green-800',
  'Cultural Competence': 'bg-purple-100 text-purple-800',
  'Assessment': 'bg-orange-100 text-orange-800',
  'Treatment Planning': 'bg-pink-100 text-pink-800',
  'Professional Development': 'bg-indigo-100 text-indigo-800',
};

const moodIcons = {
  challenging: { icon: Target, color: 'text-red-600' },
  neutral: { icon: Clock, color: 'text-gray-600' },
  positive: { icon: TrendingUp, color: 'text-green-600' },
  breakthrough: { icon: Star, color: 'text-yellow-600' },
};

export default function MyJourneyView() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [isReflecting, setIsReflecting] = useState(false);
  
  const { toast } = useToast();

  // Fetch journey data
  const { data: journeyData, isLoading } = useQuery<JourneyEntry[]>({
    queryKey: ['/api/journey', selectedTimeframe],
  });

  const handleAddReflection = async () => {
    if (!reflectionText.trim()) {
      toast({
        title: "Please enter your reflection",
        description: "Reflection content is required.",
        variant: "destructive",
      });
      return;
    }

    setIsReflecting(true);
    try {
      await apiRequest('/api/reflections', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'demo-user',
          content: reflectionText,
          date: new Date(),
        }),
      });

      // Generate AI insight for the reflection
      await apiRequest('/api/ai/generate-insight', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'demo-user',
          reflection: {
            content: reflectionText,
          }
        }),
      });

      toast({
        title: "Reflection added",
        description: "Your reflection has been saved and insights generated.",
      });

      setReflectionText('');
    } catch (error) {
      toast({
        title: "Error saving reflection",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReflecting(false);
    }
  };

  const groupEntriesByWeek = (entries: JourneyEntry[]) => {
    const grouped: { [key: string]: JourneyEntry[] } = {};
    
    entries?.forEach(entry => {
      const weekStart = new Date(entry.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!grouped[weekKey]) {
        grouped[weekKey] = [];
      }
      grouped[weekKey].push(entry);
    });

    return grouped;
  };

  const mockJourneyData: JourneyEntry[] = [
    {
      id: '1',
      type: 'session',
      date: new Date('2024-01-15'),
      title: 'Individual Session - Anxiety Treatment',
      content: 'Worked with client on cognitive restructuring techniques. Client showed significant progress in identifying negative thought patterns.',
      tags: ['CBT', 'Anxiety', 'Cognitive Restructuring'],
      competencyArea: 'Clinical Skills',
      mood: 'positive',
      aiInsight: {
        title: 'Growing Confidence in CBT',
        content: 'Your use of cognitive restructuring shows developing expertise in CBT techniques. The client\'s progress indicates effective intervention.',
        actionableSteps: ['Continue building CBT skill set', 'Document specific techniques that work best']
      }
    },
    {
      id: '2',
      type: 'reflection',
      date: new Date('2024-01-14'),
      title: 'Weekly Reflection',
      content: 'This week I noticed how much more comfortable I\'m becoming with silence in sessions. I\'m learning to sit with clients\' emotions rather than rushing to fix everything.',
      tags: ['Therapeutic Presence', 'Growth'],
      competencyArea: 'Professional Development',
      mood: 'breakthrough'
    },
    {
      id: '3',
      type: 'milestone',
      date: new Date('2024-01-12'),
      title: '100 Hours Milestone!',
      content: 'Reached 100 client contact hours - a major step toward licensure.',
      tags: ['Milestone', 'Progress'],
      mood: 'breakthrough'
    }
  ];

  const displayData = journeyData || mockJourneyData;
  const groupedEntries = groupEntriesByWeek(displayData);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 lg:pl-80">
        <div className="max-w-4xl mx-auto p-6">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-80">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">My Journey</h1>
            <p className="text-gray-600">Your professional growth timeline</p>
          </div>
          
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reflection
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>New Reflection</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="What insights, challenges, or growth have you experienced recently?"
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    rows={6}
                  />
                  <Button 
                    onClick={handleAddReflection}
                    disabled={isReflecting}
                    className="w-full"
                  >
                    {isReflecting ? 'Saving...' : 'Save Reflection'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Timeframe Filter */}
        <div className="flex gap-2">
          {['week', 'month', 'quarter'].map((timeframe) => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? "default" : "outline"}
              onClick={() => setSelectedTimeframe(timeframe)}
              className="capitalize"
            >
              {timeframe}
            </Button>
          ))}
        </div>

        {/* Weekly Summary Cards */}
        <div className="space-y-6">
          {Object.entries(groupedEntries)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([weekStart, entries]) => {
              const weekDate = new Date(weekStart);
              const weekEnd = new Date(weekDate);
              weekEnd.setDate(weekEnd.getDate() + 6);
              
              return (
                <Card key={weekStart} className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <span className="text-black font-bold">
                          {weekDate.toLocaleDateString()} - {weekEnd.toLocaleDateString()}
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {entries.length} entries
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {entries.map((entry) => {
                        const MoodIcon = moodIcons[entry.mood || 'neutral'].icon;
                        const isExpanded = expandedEntry === entry.id;
                        
                        return (
                          <div
                            key={entry.id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <MoodIcon 
                                    className={`h-4 w-4 ${moodIcons[entry.mood || 'neutral'].color}`} 
                                  />
                                  <span className="font-semibold text-black">
                                    {entry.title}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {entry.type}
                                  </Badge>
                                </div>
                                
                                <p className="text-gray-700 text-sm mb-3">
                                  {isExpanded ? entry.content : entry.content.substring(0, 150) + '...'}
                                </p>
                                
                                {/* Tags */}
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {entry.tags.map((tag) => (
                                    <Badge 
                                      key={tag} 
                                      variant="secondary" 
                                      className="text-xs"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {entry.competencyArea && (
                                    <Badge 
                                      className={`text-xs ${competencyColors[entry.competencyArea as keyof typeof competencyColors] || 'bg-gray-100 text-gray-800'}`}
                                    >
                                      {entry.competencyArea}
                                    </Badge>
                                  )}
                                </div>

                                {/* AI Insight */}
                                {entry.aiInsight && isExpanded && (
                                  <div className="bg-blue-50 border-l-4 border-l-blue-600 p-3 rounded">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Brain className="h-4 w-4 text-blue-600" />
                                      <span className="font-medium text-black">
                                        {entry.aiInsight.title}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2">
                                      {entry.aiInsight.content}
                                    </p>
                                    <div className="space-y-1">
                                      {entry.aiInsight.actionableSteps.map((step, index) => (
                                        <div key={index} className="flex items-start gap-2 text-xs text-gray-600">
                                          <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-600" />
                                          <span>{step}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                              >
                                {isExpanded ? 
                                  <ChevronUp className="h-4 w-4" /> : 
                                  <ChevronDown className="h-4 w-4" />
                                }
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {/* Motivation Card */}
        <Card className="border-l-4 border-l-green-600 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-bold text-black">You're building great momentum!</h3>
                <p className="text-green-700 text-sm">
                  You've logged 23 hours this month and written 5 reflections. 
                  Your consistent growth is evident in your journey.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}