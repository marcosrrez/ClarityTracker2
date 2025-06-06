import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Clock, MessageSquare, Bug, Lightbulb, Search, Filter, Download, TrendingUp, Users, Calendar, BarChart3, Activity, Eye, MousePointer, Timer, DollarSign, Zap, Server, TrendingDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface FeedbackItem {
  id: string;
  type: 'bug' | 'feature' | 'general';
  subject: string;
  description: string;
  email?: string;
  userId?: string;
  status: 'new' | 'in_progress' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [costAnalytics, setCostAnalytics] = useState<any>(null);
  const [productAnalytics, setProductAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  // Check if user has admin access (you can modify this logic)
  const adminEmails = [
    "leadershipcoachmarcos@gmail.com",
    "marcos@claritylog.com",
    "admin@claritylog.com"
  ];
  const isAdmin = user?.email && adminEmails.includes(user.email);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const [feedbackResponse, analyticsResponse, costResponse, productResponse] = await Promise.all([
        fetch('/api/admin/feedback'),
        fetch('/api/admin/analytics'),
        fetch('/api/admin/cost-analytics'),
        fetch('/api/admin/product-analytics')
      ]);
      
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setFeedback(feedbackData);
      }
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }

      if (costResponse.ok) {
        const costData = await costResponse.json();
        setCostAnalytics(costData);
      }

      if (productResponse.ok) {
        const productData = await productResponse.json();
        setProductAnalytics(productData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/feedback/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        setFeedback(prev => prev.map(item => 
          item.id === id ? { ...item, status: newStatus as any, updatedAt: new Date() } : item
        ));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              Admin access is required to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4" />;
      case 'feature': return <Lightbulb className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'feature': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Analytics calculations
  const totalFeedback = feedback.length;
  const newFeedback = feedback.filter(f => f.status === 'new').length;
  const resolvedFeedback = feedback.filter(f => f.status === 'resolved').length;
  const resolutionRate = totalFeedback > 0 ? Math.round((resolvedFeedback / totalFeedback) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage feedback and monitor user engagement</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feedback">Feedback Management</TabsTrigger>
          <TabsTrigger value="analytics">User Analytics</TabsTrigger>
          <TabsTrigger value="costs">Cost Monitoring</TabsTrigger>
          <TabsTrigger value="insights">Product Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Feedback</p>
                    <p className="text-3xl font-bold text-foreground">{totalFeedback}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">New Items</p>
                    <p className="text-3xl font-bold text-foreground">{newFeedback}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                    <p className="text-3xl font-bold text-foreground">{resolvedFeedback}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
                    <p className="text-3xl font-bold text-foreground">{resolutionRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Latest feedback submissions from users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedback.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(item.type)}
                      <div>
                        <p className="font-medium">{item.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(item.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search feedback..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="bug">Bug Reports</SelectItem>
                    <SelectItem value="feature">Feature Requests</SelectItem>
                    <SelectItem value="general">General Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Feedback List */}
          <div className="space-y-4">
            {filteredFeedback.map((item) => (
              <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getTypeIcon(item.type)}
                        <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">{item.subject}</h3>
                      <p className="text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{format(new Date(item.createdAt), 'MMM d, yyyy - h:mm a')}</span>
                        {item.email && <span>From: {item.email}</span>}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Select 
                        value={item.status} 
                        onValueChange={(value) => updateFeedbackStatus(item.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFeedback.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No feedback found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" || typeFilter !== "all" 
                    ? "Try adjusting your filters to see more results."
                    : "No feedback submissions yet."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* User Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-3xl font-bold text-foreground">
                      {analytics?.summary?.totalUsers || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                    <p className="text-3xl font-bold text-foreground">
                      {analytics?.summary?.totalSessions || 0}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Page Views</p>
                    <p className="text-3xl font-bold text-foreground">
                      {analytics?.summary?.totalPageViews || 0}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                    <p className="text-3xl font-bold text-foreground">
                      {analytics?.summary?.totalEvents || 0}
                    </p>
                  </div>
                  <MousePointer className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Usage Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Most Used Pages</CardTitle>
                <CardDescription>Which features counselors use most</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topPages?.map((page: any, index: number) => (
                    <div key={page.page} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium capitalize">
                          {page.page?.replace('-', ' ') || 'Dashboard'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${analytics?.topPages?.[0]?.visits ? (page.visits / analytics.topPages[0].visits) * 100 : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{page.visits}</span>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-4">No page data available yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity Types</CardTitle>
                <CardDescription>How counselors interact with ClarityLog</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.userActivity?.map((activity: any, index: number) => (
                    <div key={activity.event} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium capitalize">
                          {activity.event.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-secondary h-2 rounded-full" 
                            style={{ 
                              width: `${analytics?.userActivity?.[0]?.count ? (activity.count / analytics.userActivity[0].count) * 100 : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{activity.count}</span>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-4">No activity data available yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily User Activity (Last 30 Days)</CardTitle>
              <CardDescription>Track user engagement trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.dailyActivity?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                    {analytics.dailyActivity.slice(0, 7).map((day: any) => (
                      <div key={day.date} className="p-3 border rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(day.date), 'MMM d')}
                        </p>
                        <p className="text-lg font-bold text-foreground">{day.events}</p>
                        <p className="text-xs text-muted-foreground">{day.users} users</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No daily activity data available yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          {/* Cost Monitoring Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Monthly Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${costAnalytics?.totalCost?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${costAnalytics?.projectedMonthlyCost?.toFixed(2) || '0.00'} projected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost Per User</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${costAnalytics?.averageCostPerUser?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average monthly cost
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Yearly Projection</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${costAnalytics?.yearlyProjection?.toFixed(0) || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on current usage
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Service Cost</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${costAnalytics?.serviceBreakdown?.[0]?.cost?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {costAnalytics?.serviceBreakdown?.[0]?.service || 'No data'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Service Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Cost Breakdown</CardTitle>
              <CardDescription>
                Detailed cost analysis by service and usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {costAnalytics?.serviceBreakdown?.length > 0 ? (
                <div className="space-y-4">
                  {costAnalytics.serviceBreakdown.map((service: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-purple-500' :
                          index === 2 ? 'bg-green-500' :
                          index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                        }`} />
                        <div>
                          <p className="font-medium">{service.service}</p>
                          <p className="text-sm text-muted-foreground">
                            {service.calls.toLocaleString()} {service.unit}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${service.cost.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {((service.cost / costAnalytics.totalCost) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No cost data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Usage Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Cost Trends</CardTitle>
              <CardDescription>
                Monitor cost patterns and identify usage spikes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {costAnalytics?.dailyUsage?.length > 0 ? (
                <div className="space-y-3">
                  {costAnalytics.dailyUsage.slice(-7).map((day: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">{day.calls} API calls</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${day.cost.toFixed(2)}</p>
                        <div className="flex items-center text-sm">
                          {index > 0 && costAnalytics.dailyUsage[index - 1] && (
                            day.cost > costAnalytics.dailyUsage[index - 1].cost ? (
                              <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                            )
                          )}
                          <span className={
                            index > 0 && costAnalytics.dailyUsage[index - 1] &&
                            day.cost > costAnalytics.dailyUsage[index - 1].cost ? 
                            'text-red-500' : 'text-green-500'
                          }>
                            {index > 0 && costAnalytics.dailyUsage[index - 1] ? 
                              `${((day.cost - costAnalytics.dailyUsage[index - 1].cost) / costAnalytics.dailyUsage[index - 1].cost * 100).toFixed(1)}%` : 
                              '–'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No usage trends available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Optimization Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Optimization Insights</CardTitle>
              <CardDescription>
                Recommendations to optimize integration costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costAnalytics?.serviceBreakdown && costAnalytics.serviceBreakdown.length > 0 ? (
                  <>
                    {costAnalytics.serviceBreakdown[0]?.cost > costAnalytics.totalCost * 0.4 && (
                      <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">
                            High {costAnalytics.serviceBreakdown[0].service} Usage
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            This service accounts for {((costAnalytics.serviceBreakdown[0].cost / costAnalytics.totalCost) * 100).toFixed(1)}% of total costs. 
                            Consider implementing caching or rate limiting.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">
                          Optimization Opportunity
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Current monthly projection: ${costAnalytics.projectedMonthlyCost?.toFixed(2)}. 
                          With optimization, could potentially reduce costs by 15-25%.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          Cost Efficiency
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Average cost per user (${costAnalytics.averageCostPerUser?.toFixed(2)}) is within acceptable range for AI-powered therapy platforms.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No optimization insights available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Product Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users Today</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {productAnalytics?.engagement?.activeUsers?.daily || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {productAnalytics?.engagement?.newUsers?.today || 0} new today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Active Users</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {productAnalytics?.engagement?.activeUsers?.weekly || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {productAnalytics?.engagement?.newUsers?.thisWeek || 0} new this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Active Users</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {productAnalytics?.engagement?.activeUsers?.monthly || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {productAnalytics?.engagement?.newUsers?.thisMonth || 0} new this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {productAnalytics?.engagement?.totalUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  All registered users
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Feature Usage Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage Analytics</CardTitle>
              <CardDescription>
                Which features are most popular and how users engage with them
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productAnalytics?.features?.length > 0 ? (
                <div className="space-y-4">
                  {productAnalytics.features.slice(0, 8).map((feature: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-purple-500' :
                          index === 2 ? 'bg-green-500' :
                          index === 3 ? 'bg-orange-500' :
                          index === 4 ? 'bg-red-500' : 'bg-gray-500'
                        }`} />
                        <div>
                          <p className="font-medium capitalize">{feature.featureName.replace('_', ' ')}</p>
                          <p className="text-sm text-muted-foreground">
                            {feature.totalUsers} users • {feature.totalUsage} total uses
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {feature.monthlyActiveUsers} MAU
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {feature.averageSessionDuration}min avg
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No feature usage data available yet</p>
                  <p className="text-xs mt-2">Usage data will appear as users interact with ClarityLog features</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Onboarding Flow</CardTitle>
                <CardDescription>
                  Completion rates for each onboarding step
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productAnalytics?.insights?.userJourney?.length > 0 ? (
                  <div className="space-y-3">
                    {productAnalytics.insights.userJourney.map((step: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex-1">
                          <p className="font-medium">{step.step}</p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${step.completionRate}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium">{step.completionRate}%</p>
                          <p className="text-sm text-red-500">
                            -{step.dropoffRate}% drop
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No user journey data available yet</p>
                    <p className="text-xs mt-2">Data will populate as users complete onboarding steps</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Adoption Rates</CardTitle>
                <CardDescription>
                  How quickly users adopt new features after signup
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productAnalytics?.insights?.featureAdoption?.length > 0 ? (
                  <div className="space-y-3">
                    {productAnalytics.insights.featureAdoption.map((feature: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{feature.feature}</p>
                          <p className="text-sm text-muted-foreground">
                            Avg. {feature.timeToFirstUse} days to first use
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{feature.adoptionRate}%</p>
                          <p className="text-sm text-muted-foreground">adoption</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No adoption data available yet</p>
                    <p className="text-xs mt-2">Data will appear as users adopt features over time</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Growth and Engagement Insights */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth Trends</CardTitle>
              <CardDescription>
                Daily new users and activity patterns over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productAnalytics?.insights?.userGrowth?.length > 0 ? (
                <div className="space-y-2">
                  {productAnalytics.insights.userGrowth.slice(-7).map((day: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {day.activeUsers} active users
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">+{day.newUsers}</p>
                        <p className="text-sm text-muted-foreground">
                          {day.retentionRate.toFixed(1)}% retention
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No growth data available yet</p>
                  <p className="text-xs mt-2">Growth trends will appear as your user base expands</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Enhancement Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Product Enhancement Recommendations</CardTitle>
              <CardDescription>
                Data-driven insights to improve user experience and feature adoption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Focus on High-Usage Features</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Enhance your most popular features based on user engagement data to maximize impact
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900 dark:text-green-100">Improve Onboarding</h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Monitor completion rates to identify and address onboarding friction points
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-900 dark:text-purple-100">Boost Feature Discovery</h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                        Use adoption timing data to guide users to valuable features they haven't discovered yet
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}