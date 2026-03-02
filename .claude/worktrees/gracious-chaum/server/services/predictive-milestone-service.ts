import type { LogEntry, UserProfile } from '../../shared/schema';

export class PredictiveMilestoneService {
  
  /**
   * Calculate predictive milestones based on current progress and insight patterns
   */
  static async calculateMilestones(
    userId: string,
    userProfile: UserProfile,
    logEntries: LogEntry[],
    insightCards?: any[]
  ): Promise<any[]> {
    const milestones = [];
    
    // Analyze current pace from log entries
    const recentEntries = logEntries.slice(-30); // Last 30 entries
    const totalHours = recentEntries.reduce((sum, entry) => sum + entry.clientContactHours, 0);
    const averageHoursPerEntry = totalHours / Math.max(1, recentEntries.length);
    
    // Use insight cards to predict competency development milestones
    if (insightCards && insightCards.length > 0) {
      const competencyInsights = insightCards.filter(card => 
        card.analysis?.competencyAreas?.length > 0
      );
      
      if (competencyInsights.length >= 3) {
        milestones.push({
          type: 'competency',
          title: 'Professional Growth Trajectory',
          description: 'Based on your reflective practice, you\'re developing strong competencies',
          estimatedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          confidence: 0.8
        });
      }
    }
    
    // Predict hour completion milestones
    if (averageHoursPerEntry > 0) {
      const remainingHours = Math.max(0, 4000 - totalHours); // Assuming 4000 hour requirement
      const estimatedWeeksToComplete = remainingHours / (averageHoursPerEntry * 2); // Assuming 2 entries per week
      
      milestones.push({
        type: 'hours',
        title: 'Hour Completion Prediction',
        description: `At current pace, estimated completion in ${Math.round(estimatedWeeksToComplete)} weeks`,
        estimatedDate: new Date(Date.now() + estimatedWeeksToComplete * 7 * 24 * 60 * 60 * 1000),
        confidence: 0.7
      });
    }
    
    return milestones;
  }
}