import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  Search,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Download,
  Mail
} from "lucide-react";

interface HistoricalInsight {
  id: string;
  type: 'pattern_alert' | 'growth_observation' | 'supervision_prep' | 'milestone' | 'competency_update';
  title: string;
  content: string;
  actionTaken?: string;
  helpful?: boolean;
  createdAt: Date;
  relatedSessionId?: string;
}

export default function InsightsHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterHelpful, setFilterHelpful] = useState<string>('all');

  const { data: insights, isLoading } = useQuery<HistoricalInsight[]>({
    queryKey: ['/api/ai/insights-history', 'demo-user'],
  });

  const filteredInsights = insights?.filter(insight => {
    const matchesSearch = insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         insight.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || insight.type === filterType;
    const matchesHelpful = filterHelpful === 'all' || 
                          (filterHelpful === 'helpful' && insight.helpful === true) ||
                          (filterHelpful === 'not_helpful' && insight.helpful === false) ||
                          (filterHelpful === 'no_feedback' && insight.helpful === undefined);
    
    return matchesSearch && matchesType && matchesHelpful;
  }) || [];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern_alert': return AlertCircle;
      case 'growth_observation': return TrendingUp;
      case 'supervision_prep': return Users;
      case 'milestone': return CheckCircle;
      case 'competency_update': return Brain;
      default: return Brain;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'pattern_alert': return 'border-l-red-500 bg-red-50';
      case 'growth_observation': return 'border-l-green-500 bg-green-50';
      case 'supervision_prep': return 'border-l-blue-500 bg-blue-50';
      case 'milestone': return 'border-l-yellow-500 bg-yellow-50';
      case 'competency_update': return 'border-l-purple-500 bg-purple-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const exportInsights = () => {
    const csvContent = [
      ['Date', 'Type', 'Title', 'Content', 'Helpful', 'Action Taken'].join(','),
      ...filteredInsights.map(insight => [
        insight.createdAt.toLocaleDateString(),
        insight.type,
        `"${insight.title}"`,
        `"${insight.content}"`,
        insight.helpful?.toString() || 'No feedback',
        `"${insight.actionTaken || 'None'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'insights-history.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const emailSummary = () => {
    // This would integrate with the email service
    console.log('Email summary of insights would be sent');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-black">Insights History</h1>
          <p className="text-gray-600">Review and search through your AI-generated insights</p>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search insights..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pattern_alert">Pattern Alerts</SelectItem>
                  <SelectItem value="growth_observation">Growth Observations</SelectItem>
                  <SelectItem value="supervision_prep">Supervision Prep</SelectItem>
                  <SelectItem value="milestone">Milestones</SelectItem>
                  <SelectItem value="competency_update">Competency Updates</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterHelpful} onValueChange={setFilterHelpful}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by feedback" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Feedback</SelectItem>
                  <SelectItem value="helpful">Helpful</SelectItem>
                  <SelectItem value="not_helpful">Not Helpful</SelectItem>
                  <SelectItem value="no_feedback">No Feedback</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button onClick={exportInsights} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={emailSummary} variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Summary
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredInsights.length} of {insights?.length || 0} insights
          </p>
          <div className="flex gap-2">
            <Badge variant="outline">
              {insights?.filter(i => i.type === 'growth_observation').length || 0} Growth
            </Badge>
            <Badge variant="outline">
              {insights?.filter(i => i.type === 'pattern_alert').length || 0} Alerts
            </Badge>
            <Badge variant="outline">
              {insights?.filter(i => i.type === 'milestone').length || 0} Milestones
            </Badge>
          </div>
        </div>

        {/* Insights List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : filteredInsights.length > 0 ? (
            filteredInsights.map((insight) => {
              const Icon = getInsightIcon(insight.type);
              
              return (
                <Card key={insight.id} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className={`border-l-4 rounded-lg p-4 ${getInsightColor(insight.type)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-gray-600" />
                          <div>
                            <h3 className="font-bold text-black">{insight.title}</h3>
                            <p className="text-xs text-gray-500">
                              {insight.createdAt.toLocaleDateString()} at {insight.createdAt.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {insight.type.replace('_', ' ')}
                          </Badge>
                          {insight.helpful === true && (
                            <Badge className="bg-green-100 text-green-800 text-xs">Helpful</Badge>
                          )}
                          {insight.helpful === false && (
                            <Badge className="bg-red-100 text-red-800 text-xs">Not Helpful</Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{insight.content}</p>
                      
                      {insight.actionTaken && (
                        <div className="bg-white/50 p-3 rounded border-l-2 border-l-blue-400">
                          <p className="text-sm font-medium text-black">Action Taken:</p>
                          <p className="text-sm text-gray-700">{insight.actionTaken}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-black mb-2">No insights found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterType !== 'all' || filterHelpful !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Continue logging sessions to generate AI insights'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}