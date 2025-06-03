import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLogEntries, useInsightCards } from "@/hooks/use-firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
        title: 'Time to log your hours!',
        message: 'You haven\'t logged any sessions this week. Keep up with your progress toward licensure.',
        priority: 'medium',
        timestamp: now,
        read: false,
        actionText: 'Add Entry',
        actionUrl: '/add'
      });
    }

    // Milestone alerts
    if (preferences.milestoneAlerts) {
      const milestones = [25, 100, 500, 1000];
      milestones.forEach(milestone => {
        const remaining = milestone - totalHours;
        if (remaining > 0 && remaining <= 10) {
          newNotifications.push({
            id: `milestone-${milestone}`,
            type: 'milestone',
            title: `You're almost at ${milestone} hours!`,
            message: `Only ${remaining} hours left to reach this important milestone.`,
            priority: 'high',
            timestamp: now,
            read: false
          });
        }
      });
    }

    // Achievement celebrations
    if (preferences.achievementAlerts) {
      const milestones = [25, 50, 100, 250, 500, 750, 1000];
      milestones.forEach(milestone => {
        if (Math.floor(totalHours) === milestone) {
          newNotifications.push({
            id: `achievement-${milestone}`,
            type: 'achievement',
            title: `🎉 ${milestone} Hours Achieved!`,
            message: `Congratulations on reaching ${milestone} direct client contact hours!`,
            priority: 'high',
            timestamp: now,
            read: false
          });
        }
      });
    }

    // AI insights notifications
    if (preferences.aiInsights && insightCards.length > 0) {
      const recentInsights = insightCards.filter(card => {
        const cardDate = new Date(card.createdAt);
        const daysDiff = (now.getTime() - cardDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7; // Show insights from last 7 days
      });
      if (recentInsights.length > 0) {
        newNotifications.push({
          id: 'ai-insights',
          type: 'insight',
          title: 'New AI insights available',
          message: `${recentInsights.length} new insights based on your recent sessions.`,
          priority: 'low',
          timestamp: now,
          read: false,
          actionText: 'View Insights',
          actionUrl: '/insights'
        });
      }
    }

    // Supervision reminders
    if (preferences.supervisionReminders) {
      const supervisionEntries = logEntries.filter(entry => entry.supervisionHours > 0);
      const lastSupervision = supervisionEntries.sort((a, b) => 
        new Date(b.dateOfContact).getTime() - new Date(a.dateOfContact).getTime()
      )[0];
      
      if (lastSupervision) {
        const daysSinceSupervision = Math.floor(
          (now.getTime() - new Date(lastSupervision.dateOfContact).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceSupervision > 14) {
          newNotifications.push({
            id: 'supervision-reminder',
            type: 'supervision',
            title: 'Schedule supervision session',
            message: `It's been ${daysSinceSupervision} days since your last supervision. Regular supervision is crucial for your development.`,
            priority: 'medium',
            timestamp: now,
            read: false
          });
        }
      }
    }

    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter(n => !n.read).length);
  };

  useEffect(() => {
    if (!loading && logEntries.length >= 0) {
      generateNotifications();
    }
  }, [loading, logEntries.length, insightCards.length, preferences]);

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
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col rounded-3xl">
      <DialogHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} new</Badge>
            )}
          </DialogTitle>
          
          <div className="flex items-center space-x-2 relative">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPreferences(!showPreferences)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            {showPreferences && (
              <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 w-80 z-50">
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                
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
                    <Label htmlFor="ai-insights">AI Insights</Label>
                    <Switch
                      id="ai-insights"
                      checked={preferences.aiInsights}
                      onCheckedChange={(checked) => updatePreferences('aiInsights', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="goal-progress">Goal Progress Updates</Label>
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
              </div>
            )}
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
            <Card key={notification.id} className={`transition-all ${getPriorityColor(notification.priority)} ${!notification.read ? 'ring-2 ring-blue-200' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`mt-1 ${notification.priority === 'high' ? 'text-red-600' : notification.priority === 'medium' ? 'text-amber-600' : 'text-blue-600'}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className={`font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {notification.timestamp.toLocaleDateString()} at {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      
                      {notification.actionText && notification.actionUrl && (
                        <div className="mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              markAsRead(notification.id);
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
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DialogContent>
  );
};