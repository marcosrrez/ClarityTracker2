import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, MessageSquare, TrendingUp, Calendar, Eye } from "lucide-react";
import type { Client } from "@shared/schema";

interface ClientProgressCardProps {
  client: Client;
}

interface ClientSummary {
  totalInsights: number;
  viewedInsights: number;
  progressEntries: number;
  lastActivity: string | null;
  recentInsights: Array<{
    id: string;
    title: string;
    type: string;
    sharedAt: string;
    clientViewed: boolean;
  }>;
}

export function ClientProgressCard({ client }: ClientProgressCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch client summary data
  const { data: summary, isLoading } = useQuery({
    queryKey: ['/api/clients', client.id, 'summary'],
    queryFn: async (): Promise<ClientSummary> => {
      const response = await fetch(`/api/clients/${client.id}/progress`);
      if (!response.ok) throw new Error('Failed to fetch client summary');
      const data = await response.json();
      
      return {
        totalInsights: data.insights?.length || 0,
        viewedInsights: data.insights?.filter((i: any) => i.clientViewed).length || 0,
        progressEntries: data.progressEntries?.length || 0,
        lastActivity: data.insights?.[0]?.sharedAt || null,
        recentInsights: data.insights?.slice(0, 3) || []
      };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-500">Loading progress...</div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = summary?.totalInsights ? 
    Math.round((summary.viewedInsights / summary.totalInsights) * 100) : 0;

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors p-4 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base md:text-lg truncate">{client.firstName} {client.lastName}</CardTitle>
                  <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-xs md:text-sm truncate">{client.email}</span>
                    <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="text-xs w-fit">
                      {client.status}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1 md:gap-3 text-xs md:text-sm flex-shrink-0">
                <div className="text-center">
                  <div className="font-semibold text-blue-600 dark:text-blue-400">
                    {summary?.totalInsights || 0}
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">Insights</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    {progressPercentage}%
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">Viewed</div>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 p-3 md:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="font-semibold text-sm sm:text-base">{summary?.totalInsights || 0}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Insights</div>
              </div>
              <div className="text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1 text-green-600 dark:text-green-400">
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="font-semibold text-sm sm:text-base">{summary?.viewedInsights || 0}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Viewed</div>
              </div>
              <div className="text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1 text-purple-600 dark:text-purple-400">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="font-semibold text-sm sm:text-base">{summary?.progressEntries || 0}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Progress</div>
              </div>
            </div>

            {/* Recent Insights */}
            {summary?.recentInsights && summary.recentInsights.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">Recent Insights</h4>
                <div className="space-y-2">
                  {summary.recentInsights.map((insight) => (
                    <div key={insight.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{insight.title}</div>
                        <div className="text-xs text-gray-500 flex flex-wrap items-center gap-1 sm:gap-2">
                          <span className="capitalize">{insight.type}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="whitespace-nowrap">{new Date(insight.sharedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge variant={insight.clientViewed ? "default" : "secondary"} className="text-xs w-fit self-start sm:self-center">
                        {insight.clientViewed ? "Viewed" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Activity */}
            {summary?.lastActivity && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>Last activity: {new Date(summary.lastActivity).toLocaleDateString()}</span>
              </div>
            )}

            {/* No Data State */}
            {(!summary?.totalInsights || summary.totalInsights === 0) && (
              <div className="text-center py-6 text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">No insights shared yet</div>
                <div className="text-xs">Share therapeutic insights to track progress</div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}