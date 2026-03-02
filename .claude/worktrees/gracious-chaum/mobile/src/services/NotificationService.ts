import PushNotification, {Importance} from 'react-native-push-notification';
import {Platform, Alert} from 'react-native';

class NotificationService {
  constructor() {
    this.configure();
  }

  configure = () => {
    PushNotification.configure({
      onRegister: (token) => {
        console.log('Push notification token:', token);
        // Send token to your backend for user-specific notifications
        this.sendTokenToBackend(token.token);
      },

      onNotification: (notification) => {
        console.log('Notification received:', notification);
        
        if (notification.userInteraction) {
          // User tapped on notification
          this.handleNotificationTap(notification);
        }
      },

      onAction: (notification) => {
        console.log('Notification action received:', notification.action);
      },

      onRegistrationError: (err) => {
        console.error('Push notification registration error:', err.message);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channels for Android
    if (Platform.OS === 'android') {
      this.createChannels();
    }
  };

  createChannels = () => {
    PushNotification.createChannel(
      {
        channelId: 'milestone-channel',
        channelName: 'Milestone Achievements',
        channelDescription: 'Notifications for hour milestones and achievements',
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created) => console.log(`Milestone channel created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: 'reminder-channel',
        channelName: 'Logging Reminders',
        channelDescription: 'Reminders to log supervision hours',
        importance: Importance.DEFAULT,
        vibrate: true,
      },
      (created) => console.log(`Reminder channel created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: 'goal-channel',
        channelName: 'Goal Progress',
        channelDescription: 'Updates on your licensure progress',
        importance: Importance.DEFAULT,
        vibrate: false,
      },
      (created) => console.log(`Goal channel created: ${created}`)
    );
  };

  sendTokenToBackend = async (token: string) => {
    try {
      const response = await fetch(`${process.env.API_URL}/api/users/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${global.userToken}`,
        },
        body: JSON.stringify({
          pushToken: token,
          platform: Platform.OS,
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to send push token to backend');
      }
    } catch (error) {
      console.error('Error sending push token:', error);
    }
  };

  handleNotificationTap = (notification: any) => {
    const {type, data} = notification;
    
    switch (type) {
      case 'milestone':
        // Navigate to dashboard to show achievement
        break;
      case 'reminder':
        // Navigate to add entry screen
        break;
      case 'goal_progress':
        // Navigate to dashboard
        break;
      default:
        break;
    }
  };

  requestPermission = () => {
    PushNotification.requestPermissions()
      .then((permissions) => {
        console.log('Push notification permissions:', permissions);
      })
      .catch((error) => {
        console.error('Permission request error:', error);
        Alert.alert(
          'Notification Permission',
          'Please enable notifications to receive milestone achievements and logging reminders.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Settings', onPress: () => PushNotification.openSettings()},
          ]
        );
      });
  };

  // Milestone celebration notifications
  showMilestoneNotification = (hours: number) => {
    const messages = {
      25: "Amazing start! You've logged your first 25 hours! 🌟",
      50: "Fantastic progress! 50 hours completed! 🎯",
      100: "Incredible milestone! 100 hours achieved! 🚀",
      250: "Outstanding dedication! 250 hours logged! 💪",
      500: "Halfway there! 500 hours completed! 🎉",
      1000: "Major milestone! 1000 hours achieved! 🏆",
      2000: "Exceptional progress! 2000 hours logged! 🌟",
      4000: "Congratulations! LPC goal achieved! 🎓",
    };

    const message = messages[hours as keyof typeof messages] || `Great work! ${hours} hours completed!`;

    PushNotification.localNotification({
      channelId: 'milestone-channel',
      title: 'Milestone Achieved! 🎉',
      message,
      soundName: 'default',
      vibrate: true,
      playSound: true,
      largeIcon: 'ic_milestone',
      smallIcon: 'ic_notification',
      data: {
        type: 'milestone',
        hours,
      },
    });
  };

  // Weekly reminder to log hours
  scheduleWeeklyReminder = () => {
    PushNotification.localNotificationSchedule({
      channelId: 'reminder-channel',
      title: 'Time to Log Your Hours 📝',
      message: "Don't forget to record your supervision hours from this week!",
      date: this.getNextWeeklyReminderDate(),
      repeatType: 'week',
      soundName: 'default',
      vibrate: true,
      data: {
        type: 'reminder',
      },
    });
  };

  // Daily motivation notifications
  scheduleDailyMotivation = () => {
    const motivationalMessages = [
      "Every session is a step closer to your LPC! 💪",
      "Your dedication to growth inspires others! ✨",
      "Progress is progress, no matter how small! 🌱",
      "You're building skills that will help countless clients! 🤝",
      "Your journey to licensure is making a difference! 🌟",
    ];

    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    PushNotification.localNotificationSchedule({
      channelId: 'goal-channel',
      title: 'Daily Motivation 🌟',
      message: randomMessage,
      date: this.getNextDailyMotivationDate(),
      repeatType: 'day',
      soundName: 'default',
      vibrate: false,
      data: {
        type: 'motivation',
      },
    });
  };

  // Goal progress notifications
  showGoalProgressNotification = (percentage: number) => {
    if (percentage % 10 === 0 && percentage > 0) {
      PushNotification.localNotification({
        channelId: 'goal-channel',
        title: 'Goal Progress Update 📊',
        message: `You're ${percentage}% of the way to your LPC! Keep going!`,
        soundName: 'default',
        vibrate: true,
        data: {
          type: 'goal_progress',
          percentage,
        },
      });
    }
  };

  // Session streak notifications
  showStreakNotification = (days: number) => {
    if (days === 7 || days === 14 || days === 30) {
      PushNotification.localNotification({
        channelId: 'milestone-channel',
        title: 'Logging Streak! 🔥',
        message: `Amazing! You've logged hours for ${days} days in a row!`,
        soundName: 'default',
        vibrate: true,
        data: {
          type: 'streak',
          days,
        },
      });
    }
  };

  // Helper methods
  getNextWeeklyReminderDate = (): Date => {
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(18, 0, 0, 0); // 6 PM on Sunday
    return nextSunday;
  };

  getNextDailyMotivationDate = (): Date => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9 AM daily
    return tomorrow;
  };

  // Cancel all notifications
  cancelAllNotifications = () => {
    PushNotification.cancelAllLocalNotifications();
  };

  // Cancel specific notification type
  cancelNotificationsByType = (type: string) => {
    PushNotification.getScheduledLocalNotifications((notifications) => {
      notifications
        .filter(notification => notification.data?.type === type)
        .forEach(notification => {
          if (notification.id) {
            PushNotification.cancelLocalNotifications({id: notification.id});
          }
        });
    });
  };
}

export default new NotificationService();