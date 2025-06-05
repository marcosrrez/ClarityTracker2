import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Heart, MessageSquare, TrendingUp, Calendar as CalendarIcon, Plus, CheckCircle, Circle, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TherapistInsight {
  id: string;
  title: string;
  content: string;
  type: 'goal' | 'progress' | 'breakthrough' | 'homework';
  sharedAt: Date;
  viewed: boolean;
  therapistName: string;
}

interface ClientNote {
  id: string;
  content: string;
  mood: number; // 1-10 scale
  date: Date;
  tags: string[];
}

interface ProgressGoal {
  id: string;
  title: string;
  description: string;
  progress: number; // 0-100
  targetDate: Date;
  completed: boolean;
}

export default function ClientDashboard({ clientId }: { clientId: string }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [newNoteForm, setNewNoteForm] = useState({ content: '', mood: 5, tags: '' });
  const [showAddNote, setShowAddNote] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<TherapistInsight | null>(null);

  const queryClient = useQueryClient();

  // Sample data representing what the client sees
  const therapistInsights: TherapistInsight[] = [
    {
      id: '1',
      title: 'Weekly Progress Update',
      content: 'Great progress with anxiety management techniques! You\'ve shown remarkable improvement in using breathing exercises during stressful situations. Continue practicing daily - you\'re doing excellent work.',
      type: 'progress',
      sharedAt: new Date('2024-06-04'),
      viewed: true,
      therapistName: 'Dr. Amanda Smith'
    },
    {
      id: '2',
      title: 'Homework Assignment',
      content: 'For this week, practice mindfulness meditation for 10 minutes daily using the app we discussed. Also, continue tracking your mood in your journal and note any triggers you identify.',
      type: 'homework',
      sharedAt: new Date('2024-06-03'),
      viewed: false,
      therapistName: 'Dr. Amanda Smith'
    },
    {
      id: '3',
      title: 'Breakthrough Moment',
      content: 'Today\'s session was incredible! Your insight about how perfectionism connects to your anxiety was a major breakthrough. This awareness will be a powerful tool in your healing journey.',
      type: 'breakthrough',
      sharedAt: new Date('2024-06-03'),
      viewed: true,
      therapistName: 'Dr. Amanda Smith'
    },
    {
      id: '4',
      title: 'New Goal Setting',
      content: 'Based on our conversation, we\'re setting a new goal: practice assertive communication in one low-stakes situation each week. Remember, this is about progress, not perfection.',
      type: 'goal',
      sharedAt: new Date('2024-06-01'),
      viewed: true,
      therapistName: 'Dr. Amanda Smith'
    }
  ];

  const clientNotes: ClientNote[] = [
    {
      id: '1',
      content: 'Had a really good day today. Used the breathing technique when I felt anxious before my presentation and it actually worked! Feeling more confident.',
      mood: 8,
      date: new Date('2024-06-04'),
      tags: ['anxiety', 'breathing', 'confidence']
    },
    {
      id: '2',
      content: 'Struggling a bit today. Work stress is high and I noticed myself falling back into old patterns. But I caught myself and tried the mindfulness exercise.',
      mood: 4,
      date: new Date('2024-06-03'),
      tags: ['stress', 'mindfulness', 'work']
    },
    {
      id: '3',
      content: 'Really grateful for therapy today. The insight about perfectionism was eye-opening. I can see how it affects so many areas of my life.',
      mood: 7,
      date: new Date('2024-06-03'),
      tags: ['therapy', 'perfectionism', 'insight']
    }
  ];

  const progressGoals: ProgressGoal[] = [
    {
      id: '1',
      title: 'Daily Mindfulness Practice',
      description: 'Practice mindfulness meditation for 10 minutes each day',
      progress: 75,
      targetDate: new Date('2024-06-30'),
      completed: false
    },
    {
      id: '2',
      title: 'Anxiety Management Toolkit',
      description: 'Master 3 different anxiety management techniques',
      progress: 90,
      targetDate: new Date('2024-06-15'),
      completed: false
    },
    {
      id: '3',
      title: 'Assertive Communication',
      description: 'Practice assertive communication in social situations',
      progress: 45,
      targetDate: new Date('2024-07-15'),
      completed: false
    }
  ];

  const handleAddNote = () => {
    const newNote: ClientNote = {
      id: Date.now().toString(),
      content: newNoteForm.content,
      mood: newNoteForm.mood,
      date: new Date(),
      tags: newNoteForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    console.log('Adding note:', newNote);
    setNewNoteForm({ content: '', mood: 5, tags: '' });
    setShowAddNote(false);
  };

  const markInsightAsViewed = (insightId: string) => {
    console.log('Marking insight as viewed:', insightId);
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'goal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'progress': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'breakthrough': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'homework': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return 'text-green-600 dark:text-green-400';
    if (mood >= 6) return 'text-yellow-600 dark:text-yellow-400';
    if (mood >= 4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getMoodEmoji = (mood: number) => {
    if (mood >= 9) return '😊';
    if (mood >= 7) return '🙂';
    if (mood >= 5) return '😐';
    if (mood >= 3) return '😔';
    return '😢';
  };

  const unreadCount = therapistInsights.filter(insight => !insight.viewed).length;
  const averageMood = clientNotes.length > 0 
    ? clientNotes.reduce((sum, note) => sum + note.mood, 0) / clientNotes.length 
    : 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Therapy Journey</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Track your progress, view insights from your therapist, and reflect on your growth
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Avg Mood: {averageMood.toFixed(1)}/10
          </Badge>
          {unreadCount > 0 && (
            <Badge variant="destructive">
              {unreadCount} New Insight{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Therapist Insights
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 px-1 py-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            My Notes
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Goals & Progress
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {therapistInsights.map((insight) => (
              <Card 
                key={insight.id} 
                className={`transition-all cursor-pointer hover:shadow-lg ${
                  !insight.viewed ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                }`}
                onClick={() => {
                  setSelectedInsight(insight);
                  if (!insight.viewed) {
                    markInsightAsViewed(insight.id);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {insight.title}
                        <Badge className={getInsightTypeColor(insight.type)}>
                          {insight.type}
                        </Badge>
                        {!insight.viewed && (
                          <Badge variant="destructive" className="text-xs">
                            New
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        From {insight.therapistName} • {insight.sharedAt.toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                    {insight.content}
                  </p>
                  <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto font-normal">
                    Click to read more →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Personal Notes</h2>
            <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Personal Note</DialogTitle>
                  <DialogDescription>
                    Reflect on your day, track your mood, and note any insights or feelings.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="note-content">How are you feeling today?</Label>
                    <Textarea
                      id="note-content"
                      value={newNoteForm.content}
                      onChange={(e) => setNewNoteForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Share your thoughts, feelings, or any insights..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mood">Mood (1-10)</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <input
                        type="range"
                        id="mood"
                        min="1"
                        max="10"
                        value={newNoteForm.mood}
                        onChange={(e) => setNewNoteForm(prev => ({ ...prev, mood: parseInt(e.target.value) }))}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getMoodEmoji(newNoteForm.mood)}</span>
                        <span className={`font-medium ${getMoodColor(newNoteForm.mood)}`}>
                          {newNoteForm.mood}/10
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={newNoteForm.tags}
                      onChange={(e) => setNewNoteForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="anxiety, work, therapy, breakthrough..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddNote(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddNote}>Save Note</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {clientNotes.map((note) => (
              <Card key={note.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardDescription>
                      {note.date.toLocaleDateString()} • {note.date.toLocaleTimeString()}
                    </CardDescription>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getMoodEmoji(note.mood)}</span>
                      <span className={`font-medium ${getMoodColor(note.mood)}`}>
                        {note.mood}/10
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">{note.content}</p>
                  <div className="flex gap-2 flex-wrap">
                    {note.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid gap-6">
            {progressGoals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {goal.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                        {goal.title}
                      </CardTitle>
                      <CardDescription>{goal.description}</CardDescription>
                    </div>
                    <Badge variant={goal.completed ? 'default' : 'secondary'}>
                      {goal.progress}% Complete
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Progress value={goal.progress} className="w-full" />
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                      <span>Target Date: {goal.targetDate.toLocaleDateString()}</span>
                      <span>{goal.progress}% Complete</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Track your therapy sessions and progress</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Your scheduled therapy appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <div className="font-medium">Next Session</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        June 10, 2024 at 2:00 PM
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        With Dr. Amanda Smith
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <div className="font-medium">Future Session</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        June 17, 2024 at 2:00 PM
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        With Dr. Amanda Smith
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <Dialog open={!!selectedInsight} onOpenChange={() => setSelectedInsight(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedInsight.title}
                <Badge className={getInsightTypeColor(selectedInsight.type)}>
                  {selectedInsight.type}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                From {selectedInsight.therapistName} • {selectedInsight.sharedAt.toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {selectedInsight.content}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedInsight(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}