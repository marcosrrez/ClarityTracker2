import { db } from './db';
import { integrationUsageTable, type IntegrationUsage } from '@shared/schema';
import { eq, gte, lte, desc, sum, count } from 'drizzle-orm';

interface CostCalculation {
  service: string;
  usage: number;
  cost: number;
  unit: string;
  period: string;
}

interface UsageMetrics {
  totalCalls: number;
  totalCost: number;
  averageCostPerCall: number;
  topServices: CostCalculation[];
  dailyUsage: Array<{
    date: string;
    calls: number;
    cost: number;
  }>;
}

// Cost per unit for each service (in USD)
const SERVICE_COSTS = {
  'openai-gpt4o': 0.015, // per 1K tokens
  'openai-gpt4o-mini': 0.0015, // per 1K tokens
  'openai-whisper': 0.006, // per minute
  'openai-dall-e-3': 0.040, // per image
  'anthropic-claude-4': 0.015, // per 1K tokens
  'anthropic-claude-3.5-sonnet': 0.003, // per 1K tokens
  'google-gemini-pro': 0.0005, // per 1K tokens
  'azure-speech-transcription': 0.001, // per minute
  'azure-speech-synthesis': 0.016, // per 1M characters
  'resend-email': 0.001, // per email
  'twilio-sms': 0.0075, // per SMS
  'firebase-auth': 0.0055, // per user per month
  'firebase-firestore': 0.00006, // per document read/write
  'google-ai-gemini': 0.0005, // per 1K tokens
  'replit-hosting': 0.014, // per hour (compute unit)
  'postgresql-queries': 0.000001, // per query (minimal cost)
};

export async function trackIntegrationUsage(
  service: string,
  operation: string,
  units: number,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const costPerUnit = SERVICE_COSTS[service as keyof typeof SERVICE_COSTS] || 0;
    const totalCost = units * costPerUnit;

    await db.insert(integrationUsageTable).values({
      service,
      operation,
      units,
      costPerUnit,
      totalCost,
      metadata: metadata || {},
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to track integration usage:', error);
  }
}

export async function getUsageMetrics(
  startDate: Date,
  endDate: Date
): Promise<UsageMetrics> {
  try {
    // Get all usage records in the date range
    const usageRecords = await db
      .select()
      .from(integrationUsageTable)
      .where(
        gte(integrationUsageTable.timestamp, startDate) &&
        lte(integrationUsageTable.timestamp, endDate)
      )
      .orderBy(desc(integrationUsageTable.timestamp));

    // Calculate totals
    const totalCalls = usageRecords.length;
    const totalCost = usageRecords.reduce((sum, record) => sum + record.totalCost, 0);
    const averageCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;

    // Group by service
    const serviceGroups = usageRecords.reduce((acc, record) => {
      if (!acc[record.service]) {
        acc[record.service] = { calls: 0, cost: 0, units: 0 };
      }
      acc[record.service].calls += 1;
      acc[record.service].cost += record.totalCost;
      acc[record.service].units += record.units;
      return acc;
    }, {} as Record<string, { calls: number; cost: number; units: number }>);

    // Create top services array
    const topServices: CostCalculation[] = Object.entries(serviceGroups)
      .map(([service, data]) => ({
        service,
        usage: data.calls,
        cost: data.cost,
        unit: 'calls',
        period: 'selected period',
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    // Group by day for daily usage
    const dailyGroups = usageRecords.reduce((acc, record) => {
      const date = record.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { calls: 0, cost: 0 };
      }
      acc[date].calls += 1;
      acc[date].cost += record.totalCost;
      return acc;
    }, {} as Record<string, { calls: number; cost: number }>);

    const dailyUsage = Object.entries(dailyGroups)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalCalls,
      totalCost,
      averageCostPerCall,
      topServices,
      dailyUsage,
    };
  } catch (error) {
    console.error('Failed to get usage metrics:', error);
    return {
      totalCalls: 0,
      totalCost: 0,
      averageCostPerCall: 0,
      topServices: [],
      dailyUsage: [],
    };
  }
}

export async function getServiceBreakdown(): Promise<Array<{
  service: string;
  totalCalls: number;
  totalCost: number;
  lastUsed: Date;
  averageCostPerCall: number;
}>> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usageRecords = await db
      .select()
      .from(integrationUsageTable)
      .where(gte(integrationUsageTable.timestamp, thirtyDaysAgo));

    const serviceGroups = usageRecords.reduce((acc, record) => {
      if (!acc[record.service]) {
        acc[record.service] = {
          calls: 0,
          cost: 0,
          lastUsed: record.timestamp,
        };
      }
      acc[record.service].calls += 1;
      acc[record.service].cost += record.totalCost;
      if (record.timestamp > acc[record.service].lastUsed) {
        acc[record.service].lastUsed = record.timestamp;
      }
      return acc;
    }, {} as Record<string, { calls: number; cost: number; lastUsed: Date }>);

    return Object.entries(serviceGroups).map(([service, data]) => ({
      service,
      totalCalls: data.calls,
      totalCost: data.cost,
      lastUsed: data.lastUsed,
      averageCostPerCall: data.calls > 0 ? data.cost / data.calls : 0,
    }));
  } catch (error) {
    console.error('Failed to get service breakdown:', error);
    return [];
  }
}

export async function getCostProjection(): Promise<{
  currentMonthCost: number;
  projectedMonthlyCost: number;
  yearlyProjection: number;
}> {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const currentMonthRecords = await db
      .select()
      .from(integrationUsageTable)
      .where(gte(integrationUsageTable.timestamp, monthStart));

    const currentMonthCost = currentMonthRecords.reduce(
      (sum, record) => sum + record.totalCost,
      0
    );

    const dailyAverage = currentMonthCost / dayOfMonth;
    const projectedMonthlyCost = dailyAverage * daysInMonth;
    const yearlyProjection = projectedMonthlyCost * 12;

    return {
      currentMonthCost,
      projectedMonthlyCost,
      yearlyProjection,
    };
  } catch (error) {
    console.error('Failed to get cost projection:', error);
    return {
      currentMonthCost: 0,
      projectedMonthlyCost: 0,
      yearlyProjection: 0,
    };
  }
}