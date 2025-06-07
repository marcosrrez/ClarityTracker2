import React, { useState } from 'react';
import { ClientNavigation } from './ClientNavigation';
import { ReflectionJournal } from './ReflectionJournal';
import { GrowthResources } from './GrowthResources';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Calendar, MessageSquare, TrendingUp, Bell, FileText, Target, Award, Plus, UserPlus, Sparkles, Brain, Clock, Share2 } from 'lucide-react';

interface ClientInfo {
  name: string;
  therapistName?: string;
  memberSince: string;
  sessionCount: number;
  weekStreak: number;
}

interface ClientProgress {
  overallProgress: number;
  currentGoals: string[];
  completedSessions: number;
  nextAppointment: Date;
  recentAchievements: string[];
}

interface ClientPortalProps {
  clientId: string;
}

export function ClientPortal({ clientId }: ClientPortalProps) {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'journal' | 'growth'>('dashboard');
  const [inviteTherapistOpen, setInviteTherapistOpen] = useState(false);

  // Mock client data - would come from API
  const clientInfo: ClientInfo = {
    name: "Sarah Johnson",
    therapistName: undefined, // No therapist connected yet
    memberSince: "March 2024",
    sessionCount: 8,
    weekStreak: 2
  };

  const progress: ClientProgress = {
    overallProgress: 73,
    currentGoals: [
      "Reduce anxiety in social situations",
      "Improve sleep quality", 
      "Practice daily mindfulness"
    ],
    completedSessions: 12,
    nextAppointment: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    recentAchievements: [
      "Completed breathing exercise for 7 consecutive days",
      "Successfully used coping strategies during stressful meeting",
      "Reached out to friend when feeling overwhelmed"
    ]
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const unreadInsights = 2; // Mock unread supervisor insights

  const renderDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card - Exact LAC Style */}
        <div className="mb-8">
          <Card className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                      {getGreeting()}, {clientInfo.name.split(' ')[0]}!
                    </h1>
                    <p className="text-purple-200 font-medium mt-1">
                      You're building momentum! Each reflection gets you closer to self-discovery and growth.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-purple-300/50 flex items-center justify-center bg-white/20 backdrop-blur-sm shadow-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {clientInfo.sessionCount}
                        </div>
                        <div className="text-xs text-purple-200 font-medium">
                          reflections
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-purple-400"
                          strokeDasharray={`${(progress.overallProgress / 100) * 226} 226`}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-purple-400/20 text-purple-100 border-purple-300/30 font-medium backdrop-blur-sm">
                    Strong week
                  </Badge>
                </div>
                <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reflection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-white flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-400/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-300" />
                </div>
                <span>Your Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-200">
                      Building self-awareness through reflection and growth
                    </span>
                    <span className="text-2xl font-bold text-purple-300">
                      {progress.overallProgress}%
                    </span>
                  </div>
                  <div className="text-sm text-purple-300 mb-3">
                    Complete
                  </div>
                  <Progress value={progress.overallProgress} className="h-3 bg-white/20" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-white flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-400/30 rounded-xl flex items-center justify-center">
                  <Award className="h-5 w-5 text-green-300" />
                </div>
                <span>Recent Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {progress.recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
                    <Award className="h-4 w-4 text-green-300 flex-shrink-0" />
                    <span className="text-sm text-purple-200 font-medium leading-relaxed">{achievement}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invite Therapist CTA */}
        {!clientInfo.therapistName && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-emerald-400/30 rounded-2xl flex items-center justify-center">
                <Share2 className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Ready for Professional Support?</h3>
                <p className="text-sm text-purple-200 font-medium">Connect with a licensed therapist</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
              <h4 className="font-semibold text-white mb-2">Benefits of working with a therapist:</h4>
              <ul className="text-sm text-purple-200 space-y-1">
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  <span>Personalized insights and feedback on your reflections</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  <span>Professional guidance tailored to your goals</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  <span>Evidence-based strategies for your specific challenges</span>
                </li>
              </ul>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-2xl font-medium py-3"
              onClick={() => setInviteTherapistOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite a Therapist
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <ClientNavigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        therapistConnected={!!clientInfo.therapistName}
        therapistName={clientInfo.therapistName}
        unreadInsights={unreadInsights}
      />
      
      {currentTab === 'dashboard' && renderDashboard()}
      {currentTab === 'journal' && (
        <ReflectionJournal 
          clientId={clientId} 
          supervisorConnected={!!clientInfo.therapistName}
        />
      )}
      {currentTab === 'growth' && (
        <GrowthResources 
          clientId={clientId} 
          therapistConnected={!!clientInfo.therapistName}
        />
      )}
    </div>
  );
}