import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import {
  Card,
  Title,
  List,
  Button,
  Surface,
  Text,
  TextInput,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {theme} from '../theme/theme';
import {useAuth} from '../contexts/AuthContext';
import NotificationService from '../services/NotificationService';

interface UserSettings {
  goalHours: number;
  weeklyGoal: number;
  notifications: {
    milestones: boolean;
    reminders: boolean;
    motivation: boolean;
  };
  preferences: {
    darkMode: boolean;
    analyticsEnabled: boolean;
  };
}

const SettingsScreen: React.FC = () => {
  const {user, logout} = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    goalHours: 4000,
    weeklyGoal: 20,
    notifications: {
      milestones: true,
      reminders: true,
      motivation: true,
    },
    preferences: {
      darkMode: false,
      analyticsEnabled: true,
    },
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const response = await fetch(`${process.env.API_URL}/api/users/settings`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${process.env.API_URL}/api/users/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        Alert.alert('Success', 'Settings saved successfully!');
        
        // Update notification preferences
        if (!settings.notifications.reminders) {
          NotificationService.cancelNotificationsByType('reminder');
        } else {
          NotificationService.scheduleWeeklyReminder();
        }
        
        if (!settings.notifications.motivation) {
          NotificationService.cancelNotificationsByType('motivation');
        } else {
          NotificationService.scheduleDailyMotivation();
        }
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const toggleNotification = (type: keyof typeof settings.notifications) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type],
      },
    }));
  };

  const togglePreference = (type: keyof typeof settings.preferences) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [type]: !prev.preferences[type],
      },
    }));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Profile Section */}
        <Surface style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Icon name="account-circle" size={64} color={theme.colors.primary} />
            </View>
            <View style={styles.profileText}>
              <Title style={styles.profileName}>
                {user?.displayName || 'Licensed Associate Counselor'}
              </Title>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
        </Surface>

        {/* Goals Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Licensure Goals</Title>
            
            <View style={styles.goalInput}>
              <Text style={styles.inputLabel}>Total Hour Goal</Text>
              <TextInput
                mode="outlined"
                value={settings.goalHours.toString()}
                onChangeText={(text) => {
                  const hours = parseInt(text) || 0;
                  setSettings(prev => ({...prev, goalHours: hours}));
                }}
                keyboardType="numeric"
                right={<TextInput.Affix text="hours" />}
              />
            </View>
            
            <View style={styles.goalInput}>
              <Text style={styles.inputLabel}>Weekly Goal</Text>
              <TextInput
                mode="outlined"
                value={settings.weeklyGoal.toString()}
                onChangeText={(text) => {
                  const hours = parseInt(text) || 0;
                  setSettings(prev => ({...prev, weeklyGoal: hours}));
                }}
                keyboardType="numeric"
                right={<TextInput.Affix text="hours/week" />}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Notifications Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Notifications</Title>
            
            <List.Item
              title="Milestone Achievements"
              description="Get notified when you reach hour milestones"
              left={props => <Icon {...props} name="star" size={24} color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={settings.notifications.milestones}
                  onValueChange={() => toggleNotification('milestones')}
                  color={theme.colors.primary}
                />
              )}
            />
            
            <List.Item
              title="Logging Reminders"
              description="Weekly reminders to log your hours"
              left={props => <Icon {...props} name="schedule" size={24} color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={settings.notifications.reminders}
                  onValueChange={() => toggleNotification('reminders')}
                  color={theme.colors.primary}
                />
              )}
            />
            
            <List.Item
              title="Daily Motivation"
              description="Encouraging messages to keep you motivated"
              left={props => <Icon {...props} name="favorite" size={24} color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={settings.notifications.motivation}
                  onValueChange={() => toggleNotification('motivation')}
                  color={theme.colors.primary}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Preferences Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Preferences</Title>
            
            <List.Item
              title="Dark Mode"
              description="Switch to dark theme"
              left={props => <Icon {...props} name="dark-mode" size={24} color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={settings.preferences.darkMode}
                  onValueChange={() => togglePreference('darkMode')}
                  color={theme.colors.primary}
                />
              )}
            />
            
            <List.Item
              title="Analytics"
              description="Help improve the app with usage data"
              left={props => <Icon {...props} name="analytics" size={24} color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={settings.preferences.analyticsEnabled}
                  onValueChange={() => togglePreference('analyticsEnabled')}
                  color={theme.colors.primary}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Support Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Support</Title>
            
            <List.Item
              title="Help & FAQ"
              description="Get answers to common questions"
              left={props => <Icon {...props} name="help" size={24} color={theme.colors.primary} />}
              right={props => <Icon {...props} name="chevron-right" size={24} />}
              onPress={() => {/* Navigate to help */}}
            />
            
            <List.Item
              title="Send Feedback"
              description="Share your thoughts and suggestions"
              left={props => <Icon {...props} name="feedback" size={24} color={theme.colors.primary} />}
              right={props => <Icon {...props} name="chevron-right" size={24} />}
              onPress={() => {/* Navigate to feedback */}}
            />
            
            <List.Item
              title="Rate the App"
              description="Help other counselors discover ClarityLog"
              left={props => <Icon {...props} name="star-rate" size={24} color={theme.colors.primary} />}
              right={props => <Icon {...props} name="chevron-right" size={24} />}
              onPress={() => {/* Open app store */}}
            />
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={saveSettings}
            loading={isLoading}
            disabled={isLoading}
            style={styles.saveButton}>
            Save Settings
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            textColor={theme.colors.error}>
            Sign Out
          </Button>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.primary,
  },
  goalInput: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: theme.colors.text,
  },
  actionButtons: {
    margin: 16,
    gap: 12,
  },
  saveButton: {
    padding: 8,
    borderRadius: 12,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 12,
    borderColor: theme.colors.error,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default SettingsScreen;