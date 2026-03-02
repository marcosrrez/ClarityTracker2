import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  PanGestureHandler,
  State,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Surface,
  Text,
  ActivityIndicator,
  Chip,
  FAB,
} from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {theme} from '../theme/theme';
import {useAuth} from '../contexts/AuthContext';

const {width: screenWidth} = Dimensions.get('window');

interface InsightCard {
  id: string;
  title: string;
  type: 'growth' | 'pattern' | 'strength' | 'recommendation';
  content: string;
  createdAt: Date;
  sessionCount: number;
}

interface AIAnalysis {
  summary: string;
  themes: string[];
  potentialBlindSpots: string[];
  reflectivePrompts: string[];
  keyLearnings: string[];
  personalizedRecommendations: string[];
}

const InsightsScreen: React.FC = () => {
  const {user} = useAuth();
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysis | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const translateX = useSharedValue(0);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const response = await fetch(`${process.env.API_URL}/api/insights`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const generateAIAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch(`${process.env.API_URL}/api/ai/analyze-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          userId: user?.uid,
          analysisType: 'cross-session',
        }),
      });

      if (response.ok) {
        const analysis = await response.json();
        setAnalysisResult(analysis);
        
        // Create new insight card from analysis
        const newInsight: InsightCard = {
          id: Date.now().toString(),
          title: 'Latest AI Analysis',
          type: 'growth',
          content: analysis.summary,
          createdAt: new Date(),
          sessionCount: analysis.sessionCount || 0,
        };
        
        setInsights(prev => [newInsight, ...prev]);
        Alert.alert('Analysis Complete', 'New insights generated from your session notes!');
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('AI Analysis error:', error);
      Alert.alert('Analysis Error', 'Unable to generate insights. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
    },
    onEnd: (event) => {
      const shouldSwipeLeft = event.translationX > screenWidth * 0.3;
      const shouldSwipeRight = event.translationX < -screenWidth * 0.3;
      
      if (shouldSwipeLeft && currentInsightIndex > 0) {
        runOnJS(setCurrentInsightIndex)(currentInsightIndex - 1);
        translateX.value = withSpring(0);
      } else if (shouldSwipeRight && currentInsightIndex < insights.length - 1) {
        runOnJS(setCurrentInsightIndex)(currentInsightIndex + 1);
        translateX.value = withSpring(0);
      } else {
        translateX.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateX: translateX.value}],
    };
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'growth': return 'trending-up';
      case 'pattern': return 'pattern';
      case 'strength': return 'star';
      case 'recommendation': return 'lightbulb';
      default: return 'insights';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'growth': return theme.colors.success;
      case 'pattern': return theme.colors.primary;
      case 'strength': return theme.colors.warning;
      case 'recommendation': return theme.colors.accent;
      default: return theme.colors.primary;
    }
  };

  const filteredInsights = insights.filter(insight => 
    selectedFilter === 'all' || insight.type === selectedFilter
  );

  const currentInsight = filteredInsights[currentInsightIndex];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <Surface style={styles.headerCard}>
          <Title style={styles.headerTitle}>AI Insights</Title>
          <Text style={styles.headerSubtitle}>
            Personalized analysis from your session notes
          </Text>
        </Surface>

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          {['all', 'growth', 'pattern', 'strength', 'recommendation'].map((filter) => (
            <Chip
              key={filter}
              selected={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter)}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.selectedFilterChip
              ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Chip>
          ))}
        </View>

        {/* Insight Cards Stack */}
        {filteredInsights.length > 0 ? (
          <View style={styles.insightContainer}>
            <PanGestureHandler onGestureEvent={gestureHandler}>
              <Animated.View style={[styles.insightCard, animatedStyle]}>
                <Card style={[
                  styles.card,
                  {borderLeftColor: getInsightColor(currentInsight?.type || 'growth')}
                ]}>
                  <Card.Content>
                    <View style={styles.insightHeader}>
                      <Icon 
                        name={getInsightIcon(currentInsight?.type || 'growth')} 
                        size={24} 
                        color={getInsightColor(currentInsight?.type || 'growth')} 
                      />
                      <View style={styles.insightHeaderText}>
                        <Title style={styles.insightTitle}>
                          {currentInsight?.title}
                        </Title>
                        <Text style={styles.insightMeta}>
                          {currentInsight?.sessionCount} sessions • {currentInsight?.createdAt.toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    
                    <Paragraph style={styles.insightContent}>
                      {currentInsight?.content}
                    </Paragraph>
                  </Card.Content>
                </Card>
              </Animated.View>
            </PanGestureHandler>
            
            {/* Card Navigation Indicators */}
            <View style={styles.indicatorContainer}>
              {filteredInsights.map((_, index) => (
                <View 
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentInsightIndex && styles.activeIndicator
                  ]} 
                />
              ))}
            </View>
            
            <Text style={styles.swipeHint}>
              Swipe left or right to explore insights
            </Text>
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="psychology" size={48} color={theme.colors.placeholder} />
              <Title style={styles.emptyTitle}>No Insights Yet</Title>
              <Paragraph style={styles.emptyText}>
                Add session notes to generate AI-powered insights about your growth and patterns.
              </Paragraph>
            </Card.Content>
          </Card>
        )}

        {/* AI Analysis Results */}
        {analysisResult && (
          <Card style={styles.analysisCard}>
            <Card.Content>
              <Title style={styles.analysisTitle}>Latest Analysis</Title>
              
              {analysisResult.themes.length > 0 && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Key Themes</Text>
                  <View style={styles.themeContainer}>
                    {analysisResult.themes.map((theme, index) => (
                      <Chip key={index} style={styles.themeChip}>
                        {theme}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}
              
              {analysisResult.reflectivePrompts.length > 0 && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Reflective Prompts</Text>
                  {analysisResult.reflectivePrompts.map((prompt, index) => (
                    <Text key={index} style={styles.promptText}>
                      • {prompt}
                    </Text>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Generate Analysis FAB */}
      <FAB
        style={styles.fab}
        icon={isAnalyzing ? "hourglass-empty" : "psychology"}
        onPress={generateAIAnalysis}
        disabled={isAnalyzing}
        color="#FFFFFF"
        customSize={56}
      />
      
      {isAnalyzing && (
        <View style={styles.analysisOverlay}>
          <Surface style={styles.analysisProgress}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.analysisProgressText}>
              Analyzing your session notes...
            </Text>
          </Surface>
        </View>
      )}
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
  headerCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
  },
  selectedFilterChip: {
    backgroundColor: theme.colors.primary,
  },
  insightContainer: {
    margin: 16,
    height: 300,
  },
  insightCard: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    elevation: 4,
    borderLeftWidth: 4,
    height: '100%',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  insightMeta: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 2,
  },
  insightContent: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.placeholder,
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: theme.colors.primary,
  },
  swipeHint: {
    textAlign: 'center',
    color: theme.colors.placeholder,
    fontSize: 12,
    marginTop: 8,
  },
  emptyCard: {
    margin: 16,
    borderRadius: 16,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
    color: theme.colors.placeholder,
  },
  analysisCard: {
    margin: 16,
    borderRadius: 16,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.primary,
  },
  analysisSection: {
    marginBottom: 16,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.text,
  },
  themeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  themeChip: {
    margin: 2,
  },
  promptText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
    marginBottom: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  analysisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisProgress: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  analysisProgressText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default InsightsScreen;