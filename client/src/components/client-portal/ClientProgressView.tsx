import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, FileText, TrendingUp, MessageSquare } from "lucide-react";
import type { Client } from "@shared/schema";

interface ClientProgressViewProps {
  client: Client;
  onBack: () => void;
}

interface ClientProgressData {
  client: Client;
  insights: Array<{
    id: string;
    title: string;
    content: string;
    type: 'goal' | 'progress' | 'breakthrough' | 'homework';
    sharedAt: string;
    clientViewed: boolean;
  }>;
  progressEntries: Array<{
    id: string;
    date: string;
    notes: string;
    mood: number;
    goals: string[];
  }>;
}

export function ClientProgressView({ client, onBack }: ClientProgressViewProps) {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch client progress data including insights and entries
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['/api/clients', client.id, 'progress'],
    queryFn: async (): Promise<ClientProgressData> => {
      const response = await fetch(`/api/clients/${client.id}/progress`);
      if (!response.ok) throw new Error('Failed to fetch client progress');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg font-medium">Loading client progress...</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Please wait</div>
        </div>
      </div>
    );
  }

  const insights = progressData?.insights || [];
  const progressEntries = progressData?.progressEntries || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Client Portal
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{client.firstName} {client.lastName}</h1>
          <p className="text-gray-600 dark:text-gray-400">Client Progress & Insights</p>
        </div>
      </div>

      {/* Client Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</div>
              <div>{client.email}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</div>
              <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                {client.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Portal Access</div>
              <div>{client.portalAccess ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Shared Insights ({insights.length})</TabsTrigger>
          <TabsTrigger value="progress">Progress Entries ({progressEntries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recent Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.slice(0, 3).map((insight) => (
                      <div key={insight.id} className="border-l-4 border-blue-500 pl-4">
                        <div className="font-medium">{insight.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {insight.type} • {new Date(insight.sharedAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm">
                          {insight.clientViewed ? (
                            <Badge variant="default">Viewed</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No insights shared yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progress Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Insights Shared</div>
                    <div className="text-2xl font-bold">{insights.length}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Insights Viewed</div>
                    <div className="text-2xl font-bold">{insights.filter(i => i.clientViewed).length}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress Entries</div>
                    <div className="text-2xl font-bold">{progressEntries.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights.length > 0 ? (
            insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <CardDescription>
                        {insight.type} • Shared {new Date(insight.sharedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={insight.clientViewed ? "default" : "secondary"}>
                      {insight.clientViewed ? "Viewed" : "Pending"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300">{insight.content}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <div className="text-lg font-medium text-gray-600 dark:text-gray-400">No insights shared yet</div>
                <div className="text-sm text-gray-500">Insights you share will appear here for this client</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {progressEntries.length > 0 ? (
            progressEntries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Progress Entry
                  </CardTitle>
                  <CardDescription>
                    {new Date(entry.date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</div>
                      <p>{entry.notes}</p>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Mood Rating</div>
                      <div>{entry.mood}/10</div>
                    </div>
                    {entry.goals && entry.goals.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Goals</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {entry.goals.map((goal, index) => (
                            <Badge key={index} variant="outline">{goal}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <div className="text-lg font-medium text-gray-600 dark:text-gray-400">No progress entries yet</div>
                <div className="text-sm text-gray-500">Progress entries will appear here as the client engages</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}