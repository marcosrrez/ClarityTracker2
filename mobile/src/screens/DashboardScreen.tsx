import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  ProgressBar,
  Button,
  FAB,
  Surface,
  Text,
  Badge,
} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {theme} from '../theme/theme';
import {useAuth} from '../contexts/AuthContext';
import {NotificationService} from '../services/NotificationService';

const {width} = Dimensions.get('window');

interface DashboardStats {
  totalHours: number;
  goalHours: number;
  weeklyHours: number;
  currentStreak: number;
  milestonesAchieved: number;
}

const DashboardScreen: React.FC = () => {
  const {user} = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalHours: 0,
    goalHours: 4000,
    weeklyHours: 0,
    currentStreak: 0,
    milestonesAchieved: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [recentMilestone, setRecentMilestone] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    setupNotifications();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Connect to your existing backend API
      const response = await fetch(`${process.env.API_URL}/api/dashboard`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        
        // Check for new milestones
        checkMilestones(data.totalHours);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const setupNotifications = () => {
    NotificationService.requestPermission();
    NotificationService.scheduleWeeklyReminder();
  };

  const checkMilestones = (hours: number) => {
    const milestones = [25, 50, 100, 250, 500, 1000, 2000, 4000];
    const achieved = milestones.find(milestone => 
      hours >= milestone && hours < milestone + 10
    );
    
    if (achieved) {
      setRecentMilestone(`${achieved} Hours`);
      NotificationService.showMilestoneNotification(achieved);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const progressPercentage = Math.min((stats.totalHours / stats.goalHours) * 100, 100);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        
        {/* Hero Progress Card */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.accent]}
          style={styles.heroCard}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Your Journey to LPC</Text>
            <Text style={styles.heroHours}>{stats.totalHours}</Text>
            <Text style={styles.heroSubtitle}>of {stats.goalHours} hours</Text>
            
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={progressPercentage / 100}
                color="#FFFFFF"
                style={styles.progressBar}
              />
              <Text style={styles.progressText}>
                {progressPercentage.toFixed(1)}% Complete
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <Surface style={styles.statCard}>
            <Icon name="today" size={24} color={theme.colors.primary} />
            <Text style={styles.statNumber}>{stats.weeklyHours}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </Surface>
          
          <Surface style={styles.statCard}>
            <Icon name="local-fire-department" size={24} color={theme.colors.accent} />
            <Text style={styles.statNumber}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </Surface>
          
          <Surface style={styles.statCard}>
            <Icon name="star" size={24} color={theme.colors.warning} />
            <Text style={styles.statNumber}>{stats.milestonesAchieved}</Text>
            <Text style={styles.statLabel}>Milestones</Text>
          </Surface>
        </View>

        {/* Recent Milestone Alert */}
        {recentMilestone && (
          <Card style={styles.milestoneCard}>
            <Card.Content style={styles.milestoneContent}>
              <Icon name="celebration" size={32} color={theme.colors.warning} />
              <View style={styles.milestoneText}>
                <Title style={styles.milestoneTitle}>Milestone Achieved!</Title>
                <Paragraph>You've reached {recentMilestone}! 🎉</Paragraph>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Quick Actions</Title>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                icon="add"
                onPress={() => {/* Navigate to Add Entry */}}
                style={styles.actionButton}>
                Log Hours
              </Button>
              <Button
                mode="outlined"
                icon="psychology"
                onPress={() => {/* Navigate to AI Analysis */}}
                style={styles.actionButton}>
                AI Insights
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        <Card style={styles.activityCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Recent Activity</Title>
            <Text style={styles.placeholder}>
              Your recent session logs will appear here
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="add"
        onPress={() => {/* Navigate to Add Entry */}}
        color="#FFFFFF"
        customSize={56}
      />
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
  heroCard: {
    margin: 16,
    borderRadius: 16,
    padding: 24,
    elevation: 4,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroHours: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 4,
  },
  milestoneCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.warning + '20',
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  milestoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneText: {
    marginLeft: 16,
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.warning,
  },
  quickActionsCard: {
    margin: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  activityCard: {
    margin: 16,
    borderRadius: 12,
  },
  placeholder: {
    textAlign: 'center',
    color: theme.colors.placeholder,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default DashboardScreen;