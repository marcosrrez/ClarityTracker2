import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLogEntries, useInsightCards } from "@/hooks/use-firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Bell, 
  Settings,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  Users,
  Trophy,
  X,
  Sparkles
} from "lucide-react";

interface Notification {
  id: string;
  type: 'reminder' | 'achievement' | 'insight' | 'goal' | 'supervision' | 'milestone';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  actionText?: string;
  actionUrl?: string;
}

interface NotificationPreferences {
  weeklyReminders: boolean;
  achievementAlerts: boolean;
  supervisionReminders: boolean;
  milestoneAlerts: boolean;
  aiInsights: boolean;
  goalProgress: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
}

export const NotificationCenter = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const { entries: logEntries = [], loading } = useLogEntries();
  const { cards: insightCards = [] } = useInsightCards();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    weeklyReminders: true,
    achievementAlerts: true,
    supervisionReminders: true,
    milestoneAlerts: true,
    aiInsights: true,
    goalProgress: true,
    frequency: 'weekly'
  });
  const [showPreferences, setShowPreferences] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Generate intelligent notifications based on user activity
  const generateNotifications = () => {
    const newNotifications: Notification[] = [];
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Check for recent activity
    const recentEntries = logEntries.filter(entry => new Date(entry.dateOfContact) > lastWeek);
    const totalHours = logEntries.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);

    // Weekly activity reminder
    if (preferences.weeklyReminders && recentEntries.length === 0 && logEntries.length > 0) {
      newNotifications.push({
        id: 'weekly-reminder',
        type: 'reminder',
        title: 'Time to Log Your Sessions',
        message: "You haven't logged any sessions this week. Keep your professional development on track!",
        priority: 'medium',
        timestamp: now,
        read: false,
        actionable: true,
        actionText: 'Log Session',
        actionUrl: '/add-entry'
      });
    }

    // Achievement notifications
    if (preferences.achievementAlerts) {
      if (totalHours >= 25 && totalHours < 30) {
        newNotifications.push({
          id: 'achievement-25',
          type: 'achievement',
          title: '🎉 Quarter Century Achievement!',
          message: 'Congratulations! You\'ve reached 25 client contact hours - a significant milestone in your professional journey.',
          priority: 'high',
          timestamp: now,
          read: false,
          actionable: false
        });
      }

      if (logEntries.length === 10) {
        newNotifications.push({
          id: 'achievement-10-sessions',
          type: 'achievement',
          title: '🌟 Consistent Professional!',
          message: 'You\'ve logged 10 sessions! Your dedication to documentation shows true professional commitment.',
          priority: 'high',
          timestamp: now,
          read: false,
          actionable: false
        });
      }
    }

    // Supervision reminders
    if (preferences.supervisionReminders) {
      const needsSupervision = logEntries.some(entry => 
        entry.supervisionHours === 0 && 
        new Date(entry.dateOfContact) < new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      );

      if (needsSupervision) {
        newNotifications.push({
          id: 'supervision-reminder',
          type: 'supervision',
          title: 'Supervision Due',
          message: 'You have sessions from over 2 weeks ago that may need supervision documentation.',
          priority: 'medium',
          timestamp: now,
          read: false,
          actionable: true,
          actionText: 'Review Sessions',
          actionUrl: '/dashboard'
        });
      }
    }

    // AI insights notifications
    if (preferences.aiInsights && logEntries.length >= 3) {
      newNotifications.push({
        id: 'ai-insights-available',
        type: 'insight',
        title: 'New AI Insights Available',
        message: 'Generate personalized insights from your recent sessions to discover growth patterns.',
        priority: 'low',
        timestamp: now,
        read: false,
        actionable: true,
        actionText: 'View Insights',
        actionUrl: '/insights'
      });
    }

    // Goal progress notifications
    if (preferences.goalProgress && userProfile?.professionalGoals) {
      newNotifications.push({
        id: 'goal-progress',
        type: 'goal',
        title: 'Professional Goals Check-in',
        message: 'How are you progressing toward your professional development goals? Time for a reflection.',
        priority: 'low',
        timestamp: now,
        read: false,
        actionable: true,
        actionText: 'Reflect',
        actionUrl: '/insights'
      });
    }

    // Milestone notifications
    if (preferences.milestoneAlerts) {
      const hoursToNext = {
        25: 25 - totalHours,
        100: 100 - totalHours,
        500: 500 - totalHours,
        1000: 1000 - totalHours
      };

      Object.entries(hoursToNext).forEach(([milestone, remaining]) => {
        if (remaining > 0 && remaining <= 10) {
          newNotifications.push({
            id: `milestone-${milestone}`,
            type: 'milestone',
            title: `Approaching ${milestone} Hour Milestone!`,
            message: `You're only ${remaining.toFixed(1)} hours away from reaching ${milestone} client contact hours!`,
            priority: 'medium',
            timestamp: now,
            read: false,
            actionable: true,
            actionText: 'Log Session',
            actionUrl: '/add-entry'
          });
        }
      });
    }

    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter(n => !n.read).length);
  };

  useEffect(() => {
    if (!loading && logEntries.length >= 0) {
      generateNotifications();
    }
  }, [logEntries.length, insightCards.length, preferences, loading]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const updatePreferences = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    // Save to user profile
    updateUserProfile({ 
      notificationPreferences: { ...preferences, [key]: value } 
    });
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'reminder': return <Clock className="h-4 w-4" />;
      case 'achievement': return <Trophy className="h-4 w-4" />;
      case 'insight': return <Sparkles className="h-4 w-4" />;
      case 'goal': return <Target className="h-4 w-4" />;
      case 'supervision': return <Users className="h-4 w-4" />;
      case 'milestone': return <TrendingUp className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 dark:bg-red-950/20';
      case 'medium': return 'border-amber-200 bg-amber-50 dark:bg-amber-950/20';
      case 'low': return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} new</Badge>
              )}
            </DialogTitle>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
              )}
              
              <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Notification Preferences</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="weekly-reminders">Weekly Activity Reminders</Label>
                      <Switch
                        id="weekly-reminders"
                        checked={preferences.weeklyReminders}
                        onCheckedChange={(checked) => updatePreferences('weeklyReminders', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="achievement-alerts">Achievement Celebrations</Label>
                      <Switch
                        id="achievement-alerts"
                        checked={preferences.achievementAlerts}
                        onCheckedChange={(checked) => updatePreferences('achievementAlerts', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="supervision-reminders">Supervision Reminders</Label>
                      <Switch
                        id="supervision-reminders"
                        checked={preferences.supervisionReminders}
                        onCheckedChange={(checked) => updatePreferences('supervisionReminders', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="milestone-alerts">Milestone Alerts</Label>
                      <Switch
                        id="milestone-alerts"
                        checked={preferences.milestoneAlerts}
                        onCheckedChange={(checked) => updatePreferences('milestoneAlerts', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ai-insights">AI Insight Notifications</Label>
                      <Switch
                        id="ai-insights"
                        checked={preferences.aiInsights}
                        onCheckedChange={(checked) => updatePreferences('aiInsights', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="goal-progress">Goal Progress Check-ins</Label>
                      <Switch
                        id="goal-progress"
                        checked={preferences.goalProgress}
                        onCheckedChange={(checked) => updatePreferences('goalProgress', checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label htmlFor="frequency">Notification Frequency</Label>
                      <select
                        id="frequency"
                        className="w-full mt-1 p-2 border rounded-md"
                        value={preferences.frequency}
                        onChange={(e) => updatePreferences('frequency', e.target.value)}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">
                You have no new notifications. Keep up the great work with your professional development!
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`transition-all duration-200 ${
                  notification.read ? 'opacity-60' : ''
                } ${getPriorityColor(notification.priority)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 p-2 bg-white dark:bg-gray-800 rounded-full">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{notification.timestamp.toLocaleTimeString()}</span>
                          <Badge variant="outline" className="text-xs">
                            {notification.type}
                          </Badge>
                          <Badge 
                            variant={notification.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {notification.priority} priority
                          </Badge>
                        </div>
                        
                        {notification.actionable && (
                          <div className="mt-3">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                markAsRead(notification.id);
                                // Navigate to action URL
                                if (notification.actionUrl) {
                                  window.location.href = notification.actionUrl;
                                }
                              }}
                            >
                              {notification.actionText || 'Take Action'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNotification(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};