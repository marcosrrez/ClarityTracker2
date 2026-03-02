import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLogEntries } from "@/hooks/use-firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

export const NotificationBadge = () => {
  const { userProfile } = useAuth();
  const { entries: logEntries = [], loading } = useLogEntries();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loading && userProfile) {
      // Calculate notifications based on user activity
      let notifications = 0;
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Check for weekly reminder
      const recentEntries = logEntries.filter(entry => new Date(entry.dateOfContact) > lastWeek);
      if (recentEntries.length === 0 && logEntries.length > 0) {
        notifications++;
      }

      // Check for milestone proximity
      const totalHours = logEntries.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
      const milestones = [25, 100, 500, 1000];
      milestones.forEach(milestone => {
        const remaining = milestone - totalHours;
        if (remaining > 0 && remaining <= 10) {
          notifications++;
        }
      });

      // Check for AI insights availability
      if (logEntries.length >= 3) {
        notifications++;
      }

      setUnreadCount(notifications);
    }
  }, [logEntries.length, loading, userProfile]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="ive-button text-muted-foreground hover:text-foreground relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <NotificationCenter />
    </Dialog>
  );
};