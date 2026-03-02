import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Clock,
  Bell,
  Calendar,
  TrendingUp,
  Heart,
  Brain,
  Target,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Settings,
  CheckCircle,
  MessageCircle
} from "lucide-react";

interface WeeklyRhythm {
  growthArea: string;
  reflectionNudge: string;
  encouragement: string;
  weeklyStats: {
    sessionsLogged: number;
    hoursCompleted: number;
    reflectionsWritten: number;
    insightsGenerated: number;
  };
}

interface RhythmCard {
  id: string;
  type: 'growth' | 'reflection' | 'encouragement' | 'milestone';
  title: string;
  content: string;
  actionLabel?: string;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
}

interface NotificationSetting {
  type: string;
  label: string;
  enabled: boolean;
  frequency: string;
}

export default function RhythmEngineView() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    { type: 'session_reminder', label: 'Session Logging Reminders', enabled: true, frequency: 'daily' },
    { type: 'reflection_nudge', label: 'Weekly Reflection Nudges', enabled: true, frequency: 'weekly' },
    { type: 'insight_summary', label: 'AI Insight Summaries', enabled: true, frequency: 'weekly' },
    { type: 'milestone_celebration', label: 'Milestone Celebrations', enabled: true, frequency: 'immediate' },
    { type: 'supervision_prep', label: 'Supervision Prep Reminders', enabled: false, frequency: 'weekly' },
  ]);

  // Mock weekly rhythm data - would come from AI service
  const weeklyRhythm: WeeklyRhythm = {
    growthArea: "You've focused on multicultural awareness this week",
    reflectionNudge: "What challenged you most in your sessions this week?",
    encouragement: "You're showing up consistently. Your growth is visible — keep going.",
    weeklyStats: {
      sessionsLogged: 5,
      hoursCompleted: 8.5,
      reflectionsWritten: 2,
      insightsGenerated: 3
    }
  };

  const rhythmCards: RhythmCard[] = [
    {
      id: '1',
      type: 'growth',
      title: 'Growing Cultural Competence',
      content: weeklyRhythm.growthArea + ". Want to reflect deeper on your multicultural counseling approach?",
      actionLabel: 'Start Reflection',
      actionUrl: '/v2/journey?reflect=true&topic=cultural',
      priority: 'high',
      createdAt: new Date()
    },
    {
      id: '2',
      type: 'reflection',
      title: 'Weekly Check-In',
      content: weeklyRhythm.reflectionNudge + " Take a moment to process your experiences.",
      actionLabel: 'Reflect Now',
      actionUrl: '/v2/journey?reflect=true',
      priority: 'medium',
      createdAt: new Date()
    },
    {
      id: '3',
      type: 'encouragement',
      title: 'You\'re Making Progress',
      content: weeklyRhythm.encouragement + " This week you completed 8.5 hours and wrote thoughtful reflections.",
      priority: 'low',
      createdAt: new Date()
    },
    {
      id: '4',
      type: 'milestone',
      title: 'Consistency Streak!',
      content: "You've logged sessions for 5 days straight this week. Building habits like this is how professional growth happens.",
      actionLabel: 'View Journey',
      actionUrl: '/v2/journey',
      priority: 'high',
      createdAt: new Date()
    }
  ];

  const getCardGradient = (type: string) => {
    switch (type) {
      case 'growth': return 'from-blue-50 to-indigo-50';
      case 'reflection': return 'from-purple-50 to-violet-50';
      case 'encouragement': return 'from-green-50 to-emerald-50';
      case 'milestone': return 'from-yellow-50 to-amber-50';
      default: return 'from-gray-50 to-slate-50';
    }
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'growth': return TrendingUp;
      case 'reflection': return MessageCircle;
      case 'encouragement': return Heart;
      case 'milestone': return Target;
      default: return Lightbulb;
    }
  };

  const getCardIconColor = (type: string) => {
    switch (type) {
      case 'growth': return 'text-blue-600';
      case 'reflection': return 'text-purple-600';
      case 'encouragement': return 'text-green-600';
      case 'milestone': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % rhythmCards.length);
  };

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + rhythmCards.length) % rhythmCards.length);
  };

  const toggleNotification = (type: string) => {
    setNotificationSettings(prev =>
      prev.map(setting =>
        setting.type === type ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const currentCard = rhythmCards[currentCardIndex];
  const CardIcon = getCardIcon(currentCard.type);

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-80">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-black">Rhythm Engine</h1>
          <p className="text-gray-600">Your personalized growth rhythm and insights</p>
        </div>

        {/* Weekly Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">{weeklyRhythm.weeklyStats.sessionsLogged}</p>
              <p className="text-sm text-gray-600">Sessions This Week</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">{weeklyRhythm.weeklyStats.hoursCompleted}</p>
              <p className="text-sm text-gray-600">Hours Completed</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <MessageCircle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">{weeklyRhythm.weeklyStats.reflectionsWritten}</p>
              <p className="text-sm text-gray-600">Reflections</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <Brain className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">{weeklyRhythm.weeklyStats.insightsGenerated}</p>
              <p className="text-sm text-gray-600">AI Insights</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Rhythm Cards Carousel */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className={`bg-gradient-to-r ${getCardGradient(currentCard.type)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/80 rounded-lg">
                  <CardIcon className={`h-5 w-5 ${getCardIconColor(currentCard.type)}`} />
                </div>
                <CardTitle className="text-black font-bold">{currentCard.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {currentCard.type}
                </Badge>
                <Badge 
                  variant={currentCard.priority === 'high' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {currentCard.priority}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-gray-700 text-lg leading-relaxed">
                {currentCard.content}
              </p>
              
              {currentCard.actionLabel && currentCard.actionUrl && (
                <div className="flex gap-3">
                  <Button 
                    onClick={() => window.location.href = currentCard.actionUrl!}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {currentCard.actionLabel}
                  </Button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevCard}
                  disabled={rhythmCards.length <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  {rhythmCards.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentCardIndex ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextCard}
                  disabled={rhythmCards.length <= 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rhythm Preferences */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
            <CardTitle className="flex items-center gap-2 text-black font-bold">
              <Settings className="h-5 w-5 text-gray-600" />
              Rhythm Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-gray-600 text-sm mb-4">
                Customize how and when you receive growth insights and reminders
              </p>
              
              {notificationSettings.map((setting) => (
                <div key={setting.type} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-black text-sm">{setting.label}</h4>
                    <p className="text-xs text-gray-600 capitalize">
                      Frequency: {setting.frequency}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={setting.enabled}
                      onCheckedChange={() => toggleNotification(setting.type)}
                    />
                    {setting.enabled && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Review Prompt */}
        <Card className="border-l-4 border-l-blue-600 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-black mb-2">Weekly Reflection Prompt</h3>
                <p className="text-gray-700 mb-4">
                  "What was your biggest growth moment this week, and how will you build on it next week?"
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => window.location.href = '/v2/journey?reflect=true&prompt=weekly'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start Weekly Reflection
                  </Button>
                  <Button variant="outline">
                    Skip This Week
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}