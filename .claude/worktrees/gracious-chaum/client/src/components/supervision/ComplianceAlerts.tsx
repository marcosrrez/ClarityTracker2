import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  AlertTriangle, 
  Clock, 
  FileX, 
  TrendingDown,
  CheckCircle,
  RefreshCw,
  Bell,
  Calendar,
  User
} from "lucide-react";

interface ComplianceAlert {
  id: string;
  supervisorId: string;
  superviseeId: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  triggerData?: any;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  dueDate?: Date;
  createdAt: Date;
}

interface ComplianceAlertsProps {
  supervisorId: string;
}

export const ComplianceAlerts = ({ supervisorId }: ComplianceAlertsProps) => {
  const [selectedTab, setSelectedTab] = useState("all");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch alerts
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['/api/supervision/alerts', supervisorId],
    queryFn: () => apiRequest(`/api/supervision/alerts/${supervisorId}`),
  });

  // Generate automated alerts
  const generateAlertsMutation = useMutation({
    mutationFn: () => apiRequest(`/api/supervision/alerts/generate/${supervisorId}`, {
      method: 'POST',
    }),
    onSuccess: (newAlerts) => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/alerts'] });
      toast({
        title: "Alerts Generated",
        description: `Generated ${newAlerts.length} new compliance alerts`,
      });
    },
  });

  // Mark alert as read
  const markAsReadMutation = useMutation({
    mutationFn: (alertId: string) => apiRequest(`/api/supervision/alerts/${alertId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isRead: true }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/alerts'] });
    },
  });

  // Resolve alert
  const resolveAlertMutation = useMutation({
    mutationFn: (alertId: string) => apiRequest(`/api/supervision/alerts/${alertId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolvedBy: user?.uid }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/alerts'] });
      toast({
        title: "Alert Resolved",
        description: "The compliance alert has been marked as resolved",
      });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'missed_session': return <Calendar className="h-4 w-4" />;
      case 'hours_behind': return <TrendingDown className="h-4 w-4" />;
      case 'documentation_overdue': return <FileX className="h-4 w-4" />;
      case 'risk_escalation': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const filteredAlerts = alerts.filter((alert: ComplianceAlert) => {
    switch (selectedTab) {
      case 'unread': return !alert.isRead;
      case 'critical': return alert.severity === 'critical';
      case 'resolved': return alert.isResolved;
      default: return true;
    }
  });

  const unreadCount = alerts.filter((alert: ComplianceAlert) => !alert.isRead).length;
  const criticalCount = alerts.filter((alert: ComplianceAlert) => alert.severity === 'critical').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Compliance Alerts</h2>
          <p className="text-muted-foreground">
            Automated supervision compliance monitoring and alerts
          </p>
        </div>
        <Button 
          onClick={() => generateAlertsMutation.mutate()}
          disabled={generateAlertsMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${generateAlertsMutation.isPending ? 'animate-spin' : ''}`} />
          Generate Alerts
        </Button>
      </div>

      {/* Alert Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {alerts.filter((a: ComplianceAlert) => a.isResolved).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="critical">
            Critical {criticalCount > 0 && `(${criticalCount})`}
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading alerts...</div>
          ) : filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Alerts</h3>
                <p className="text-muted-foreground">
                  {selectedTab === 'unread' && 'All alerts have been read'}
                  {selectedTab === 'critical' && 'No critical alerts at this time'}
                  {selectedTab === 'resolved' && 'No resolved alerts'}
                  {selectedTab === 'all' && 'No compliance alerts found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert: ComplianceAlert) => (
              <Card key={alert.id} className={!alert.isRead ? 'border-l-4 border-l-blue-500' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getAlertIcon(alert.alertType)}
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        {!alert.isRead && (
                          <Badge variant="outline" className="text-blue-600">
                            New
                          </Badge>
                        )}
                        {alert.isResolved && (
                          <Badge variant="outline" className="text-green-600">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{alert.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {alert.triggerData && (
                    <div className="bg-muted p-3 rounded-lg text-sm">
                      <h4 className="font-medium mb-2">Alert Details:</h4>
                      <div className="space-y-1">
                        {Object.entries(alert.triggerData).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="font-medium">
                              {typeof value === 'number' ? value.toFixed(1) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {alert.dueDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Due: {new Date(alert.dueDate).toLocaleDateString()}
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(alert.createdAt).toLocaleDateString()}
                      {alert.resolvedAt && (
                        <span className="ml-4">
                          Resolved: {new Date(alert.resolvedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {!alert.isRead && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsReadMutation.mutate(alert.id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                      {!alert.isResolved && (
                        <Button
                          size="sm"
                          onClick={() => resolveAlertMutation.mutate(alert.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};