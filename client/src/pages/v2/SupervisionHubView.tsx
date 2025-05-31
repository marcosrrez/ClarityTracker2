import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Clock,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Calendar,
  PenTool,
  Award,
  TrendingUp
} from "lucide-react";

interface SupervisionRecord {
  id: string;
  supervisorName: string;
  supervisorEmail: string;
  supervisionType: 'individual' | 'group' | 'triadic';
  requiredHours: number;
  completedHours: number;
  contractSigned: boolean;
  lastSessionDate: Date;
  nextSessionDate?: Date;
  status: 'active' | 'inactive' | 'completed';
}

interface SupervisionSession {
  id: string;
  date: Date;
  duration: number;
  type: 'individual' | 'group' | 'triadic';
  topics: string[];
  supervisorFeedback?: string;
  actionItems: string[];
  nextGoals: string[];
}

export default function SupervisionHubView() {
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [newSessionData, setNewSessionData] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: 1,
    type: 'individual' as const,
    topics: '',
    notes: ''
  });

  const { toast } = useToast();

  // Mock data - would come from API
  const supervisionRecords: SupervisionRecord[] = [
    {
      id: '1',
      supervisorName: 'Dr. Sarah Johnson',
      supervisorEmail: 'sarah.johnson@clinic.com',
      supervisionType: 'individual',
      requiredHours: 100,
      completedHours: 67,
      contractSigned: true,
      lastSessionDate: new Date('2024-01-10'),
      nextSessionDate: new Date('2024-01-17'),
      status: 'active'
    },
    {
      id: '2',
      supervisorName: 'Dr. Michael Chen',
      supervisorEmail: 'michael.chen@center.org',
      supervisionType: 'group',
      requiredHours: 50,
      completedHours: 23,
      contractSigned: true,
      lastSessionDate: new Date('2024-01-08'),
      status: 'active'
    }
  ];

  const recentSessions: SupervisionSession[] = [
    {
      id: '1',
      date: new Date('2024-01-10'),
      duration: 1.5,
      type: 'individual',
      topics: ['Case conceptualization', 'Ethical considerations', 'Treatment planning'],
      supervisorFeedback: 'Excellent progress in case conceptualization. Continue developing assessment skills.',
      actionItems: ['Complete additional assessment training', 'Practice case presentations'],
      nextGoals: ['Focus on trauma-informed interventions', 'Develop group therapy skills']
    }
  ];

  const handleLogSession = async () => {
    try {
      toast({
        title: "Session logged successfully",
        description: "Your supervision session has been recorded.",
      });
      
      // Reset form
      setNewSessionData({
        date: new Date().toISOString().split('T')[0],
        duration: 1,
        type: 'individual',
        topics: '',
        notes: ''
      });
    } catch (error) {
      toast({
        title: "Error logging session",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-80">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-black">Supervision Hub</h1>
          <p className="text-gray-600">Track supervision hours and manage supervisor relationships</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">2</p>
              <p className="text-sm text-gray-600">Active Supervisors</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">90</p>
              <p className="text-sm text-gray-600">Total Supervision Hours</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">3</p>
              <p className="text-sm text-gray-600">Sessions This Month</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">60%</p>
              <p className="text-sm text-gray-600">Requirements Met</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supervision Records */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2 text-black font-bold">
                <Users className="h-5 w-5 text-blue-600" />
                Supervision Relationships
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {supervisionRecords.map((record) => (
                <div
                  key={record.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-black">{record.supervisorName}</h3>
                      <p className="text-sm text-gray-600">{record.supervisorEmail}</p>
                      <Badge 
                        variant="outline" 
                        className="mt-1 text-xs capitalize"
                      >
                        {record.supervisionType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {record.contractSigned && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <Badge 
                        variant={record.status === 'active' ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {record.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-black">
                        {record.completedHours} / {record.requiredHours} hours
                      </span>
                    </div>
                    <Progress 
                      value={(record.completedHours / record.requiredHours) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="mt-3 text-xs text-gray-600">
                    <p>Last session: {record.lastSessionDate.toLocaleDateString()}</p>
                    {record.nextSessionDate && (
                      <p>Next session: {record.nextSessionDate.toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              ))}

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Users className="h-4 w-4 mr-2" />
                    Add Supervisor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Supervisor</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="Supervisor Name" />
                    <Input placeholder="Email Address" />
                    <Input placeholder="Required Hours" type="number" />
                    <Button className="w-full">Add Supervisor</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Log New Session */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2 text-black font-bold">
                <Calendar className="h-5 w-5 text-green-600" />
                Log Supervision Session
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={newSessionData.date}
                    onChange={(e) => setNewSessionData(prev => ({
                      ...prev,
                      date: e.target.value
                    }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Duration (hours)
                  </label>
                  <Input
                    type="number"
                    step="0.25"
                    value={newSessionData.duration}
                    onChange={(e) => setNewSessionData(prev => ({
                      ...prev,
                      duration: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Topics Discussed
                </label>
                <Textarea
                  placeholder="Enter the main topics covered in supervision..."
                  value={newSessionData.topics}
                  onChange={(e) => setNewSessionData(prev => ({
                    ...prev,
                    topics: e.target.value
                  }))}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Session Notes
                </label>
                <Textarea
                  placeholder="Additional notes, feedback received, action items..."
                  value={newSessionData.notes}
                  onChange={(e) => setNewSessionData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleLogSession}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Log Session
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
            <CardTitle className="flex items-center gap-2 text-black font-bold">
              <FileText className="h-5 w-5 text-purple-600" />
              Recent Supervision Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-black">
                        {session.date.toLocaleDateString()} - {session.duration}h
                      </h3>
                      <Badge variant="outline" className="mt-1 text-xs capitalize">
                        {session.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-black text-sm mb-1">Topics Discussed</h4>
                      <div className="flex flex-wrap gap-1">
                        {session.topics.map((topic, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {session.supervisorFeedback && (
                      <div>
                        <h4 className="font-medium text-black text-sm mb-1">Supervisor Feedback</h4>
                        <p className="text-sm text-gray-700 bg-green-50 p-3 rounded">
                          {session.supervisorFeedback}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-black text-sm mb-1">Action Items</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {session.actionItems.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 mt-0.5 text-green-600" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-black text-sm mb-1">Next Goals</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {session.nextGoals.map((goal, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Award className="h-3 w-3 mt-0.5 text-blue-600" />
                              {goal}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Document Management */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="flex items-center gap-2 text-black font-bold">
              <FileText className="h-5 w-5 text-orange-600" />
              Documents & Contracts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-black mb-3">Required Documents</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <span className="text-sm font-medium text-black">Supervision Contract</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                    <span className="text-sm font-medium text-black">Liability Insurance</span>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <span className="text-sm font-medium text-black">Background Check</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-3">Upload Documents</h3>
                <div className="border-dashed border-2 border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop files here, or click to browse
                  </p>
                  <Button variant="outline" size="sm">
                    Choose Files
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}