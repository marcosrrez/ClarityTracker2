/**
 * Unified Dashboard Data Calculations
 * Ensures consistent metrics across all dashboard components
 */

export interface DashboardMetrics {
  // Session Counts
  totalSessions: number;
  validSessions: number; // Sessions with client contact hours > 0
  
  // Hours
  totalClientHours: number;
  directClientHours: number;
  indirectClientHours: number;
  totalSupervisionHours: number;
  
  // Weekly Analysis
  thisWeekSessions: number;
  thisWeekClientHours: number;
  thisWeekSupervisionHours: number;
  lastWeekSessions: number;
  lastWeekClientHours: number;
  lastWeekSupervisionHours: number;
  
  // Trends
  sessionTrend: "up" | "down" | "neutral";
  clientHoursTrend: "up" | "down" | "neutral";
  supervisionTrend: "up" | "down" | "neutral";
}

export const calculateDashboardMetrics = (entries: any[]): DashboardMetrics => {
  if (!entries || entries.length === 0) {
    return {
      totalSessions: 0,
      validSessions: 0,
      totalClientHours: 0,
      directClientHours: 0,
      indirectClientHours: 0,
      totalSupervisionHours: 0,
      thisWeekSessions: 0,
      thisWeekClientHours: 0,
      thisWeekSupervisionHours: 0,
      lastWeekSessions: 0,
      lastWeekClientHours: 0,
      lastWeekSupervisionHours: 0,
      sessionTrend: "neutral",
      clientHoursTrend: "neutral",
      supervisionTrend: "neutral",
    };
  }

  // Filter valid sessions (those with actual client contact)
  const validEntries = entries.filter(entry => entry.clientContactHours > 0);
  
  // Calculate total hours
  const totalClientHours = entries.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
  const directClientHours = entries
    .filter(entry => !entry.indirectHours)
    .reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
  const indirectClientHours = entries
    .filter(entry => entry.indirectHours)
    .reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
  const totalSupervisionHours = entries.reduce((sum, entry) => sum + (entry.supervisionHours || 0), 0);

  // Calculate weekly comparisons
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  
  const thisWeekEntries = entries.filter(entry => new Date(entry.dateOfContact) >= weekAgo);
  const lastWeekEntries = entries.filter(entry => {
    const date = new Date(entry.dateOfContact);
    return date >= twoWeeksAgo && date < weekAgo;
  });
  
  const thisWeekValidEntries = thisWeekEntries.filter(entry => entry.clientContactHours > 0);
  const lastWeekValidEntries = lastWeekEntries.filter(entry => entry.clientContactHours > 0);
  
  const thisWeekClientHours = thisWeekEntries.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
  const lastWeekClientHours = lastWeekEntries.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
  const thisWeekSupervisionHours = thisWeekEntries.reduce((sum, entry) => sum + (entry.supervisionHours || 0), 0);
  const lastWeekSupervisionHours = lastWeekEntries.reduce((sum, entry) => sum + (entry.supervisionHours || 0), 0);

  // Calculate trends
  const sessionTrend = thisWeekValidEntries.length > lastWeekValidEntries.length ? "up" : 
                      thisWeekValidEntries.length < lastWeekValidEntries.length ? "down" : "neutral";
  const clientHoursTrend = thisWeekClientHours > lastWeekClientHours ? "up" : 
                          thisWeekClientHours < lastWeekClientHours ? "down" : "neutral";
  const supervisionTrend = thisWeekSupervisionHours > lastWeekSupervisionHours ? "up" : 
                          thisWeekSupervisionHours < lastWeekSupervisionHours ? "down" : "neutral";

  return {
    totalSessions: entries.length,
    validSessions: validEntries.length,
    totalClientHours,
    directClientHours,
    indirectClientHours,
    totalSupervisionHours,
    thisWeekSessions: thisWeekValidEntries.length,
    thisWeekClientHours,
    thisWeekSupervisionHours,
    lastWeekSessions: lastWeekValidEntries.length,
    lastWeekClientHours,
    lastWeekSupervisionHours,
    sessionTrend,
    clientHoursTrend,
    supervisionTrend,
  };
};

/**
 * Standardized display formatters
 */
export const formatSessionCount = (count: number): string => {
  return count.toString();
};

export const formatHours = (hours: number): string => {
  return hours.toFixed(1);
};

export const formatTrend = (current: number, previous: number): string => {
  const diff = current - previous;
  if (diff === 0) return "";
  return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`;
};