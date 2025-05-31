import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Brain, BookOpen, Plus, Clock, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import KnowledgeInputForm from '@/components/knowledge/KnowledgeInputForm';
import PromptCard from '@/components/knowledge/PromptCard';
import { useToast } from '@/hooks/use-toast';

// Mock user ID - in a real app this would come from authentication
const MOCK_USER_ID = "user-123";

interface DuePrompt {
  id: string;
  question: string;
  answer: string;
  imageUrl?: string;
  nextReviewDate: Date;
}

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  sourceType: 'CE' | 'Book';
  sourceTitle: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SpacedRepetition: React.FC = () => {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch due prompts
  const { data: duePrompts = [], isLoading: promptsLoading } = useQuery({
    queryKey: ['/api/prompts/due', MOCK_USER_ID],
    queryFn: async () => {
      const response = await fetch(`/api/prompts/due/${MOCK_USER_ID}`);
      if (!response.ok) throw new Error('Failed to fetch due prompts');
      return response.json();
    }
  });

  // Fetch knowledge entries
  const { data: knowledgeEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['/api/knowledge-entries', MOCK_USER_ID],
    queryFn: async () => {
      const response = await fetch(`/api/knowledge-entries/${MOCK_USER_ID}`);
      if (!response.ok) throw new Error('Failed to fetch knowledge entries');
      return response.json();
    }
  });

  // Submit review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ promptId, difficulty }: { promptId: string; difficulty: number }) => {
      const response = await fetch(`/api/prompts/${promptId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: MOCK_USER_ID, difficulty })
      });
      if (!response.ok) throw new Error('Failed to submit review');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prompts/due', MOCK_USER_ID] });
      // Move to next prompt after a delay
      setTimeout(() => {
        setCurrentPromptIndex(prev => prev + 1);
      }, 1500);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record your review. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handlePromptAnswer = (promptId: string, difficulty: number) => {
    reviewMutation.mutate({ promptId, difficulty });
  };

  const handleAddSuccess = () => {
    setShowAddForm(false);
    queryClient.invalidateQueries({ queryKey: ['/api/knowledge-entries', MOCK_USER_ID] });
    toast({
      title: "Success",
      description: "Knowledge entry added and prompts generated!"
    });
  };

  const currentPrompt = duePrompts[currentPromptIndex];
  const hasMorePrompts = currentPromptIndex < duePrompts.length - 1;
  const completedPrompts = currentPromptIndex;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-black">
              <Brain className="w-7 h-7 text-blue-600" />
              Spaced Repetition Learning
            </CardTitle>
            <CardDescription className="text-lg">
              Master your CE course and book knowledge through scientifically-proven spaced repetition
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="review" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="review" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Review ({duePrompts.length})
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Knowledge
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Library ({knowledgeEntries.length})
            </TabsTrigger>
          </TabsList>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-6">
            {promptsLoading ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </div>
                </CardContent>
              </Card>
            ) : duePrompts.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center space-y-4">
                  <Brain className="w-16 h-16 text-gray-400 mx-auto" />
                  <h3 className="text-xl font-medium text-black">No reviews due</h3>
                  <p className="text-gray-600">
                    Great job! You're all caught up with your spaced repetition reviews.
                  </p>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Add More Knowledge
                  </Button>
                </CardContent>
              </Card>
            ) : currentPromptIndex >= duePrompts.length ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center space-y-4">
                  <TrendingUp className="w-16 h-16 text-green-500 mx-auto" />
                  <h3 className="text-xl font-medium text-black">Review Session Complete!</h3>
                  <p className="text-gray-600">
                    You've completed {completedPrompts} reviews. Your next reviews will be scheduled based on your performance.
                  </p>
                  <Button 
                    onClick={() => setCurrentPromptIndex(0)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Start New Session
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Progress */}
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Progress: {completedPrompts} / {duePrompts.length}</span>
                      <Badge variant="outline">{hasMorePrompts ? 'In Progress' : 'Almost Done'}</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(completedPrompts / duePrompts.length) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Current Prompt */}
                <PromptCard
                  prompt={currentPrompt}
                  onAnswer={handlePromptAnswer}
                />
              </div>
            )}
          </TabsContent>

          {/* Add Knowledge Tab */}
          <TabsContent value="add">
            <KnowledgeInputForm 
              userId={MOCK_USER_ID}
              onSuccess={handleAddSuccess}
            />
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-4">
            {entriesLoading ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </div>
                </CardContent>
              </Card>
            ) : knowledgeEntries.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center space-y-4">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto" />
                  <h3 className="text-xl font-medium text-black">No knowledge entries yet</h3>
                  <p className="text-gray-600">
                    Start by adding notes from your CE courses or books to create study prompts.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {knowledgeEntries.map((entry: KnowledgeEntry) => (
                  <Card key={entry.id} className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-medium text-black">{entry.title}</CardTitle>
                        <Badge variant={entry.sourceType === 'CE' ? 'default' : 'secondary'}>
                          {entry.sourceType}
                        </Badge>
                      </div>
                      <CardDescription>{entry.sourceTitle}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                        {entry.content}
                      </p>
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SpacedRepetition;