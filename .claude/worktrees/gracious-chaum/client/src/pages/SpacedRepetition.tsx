import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Brain, BookOpen, Plus, Eye, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface KnowledgeEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  sourceType: 'CE' | 'Book' | 'Article' | 'Course';
  sourceTitle?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Prompt {
  id: string;
  knowledgeEntryId: string;
  userId: string;
  question: string;
  answer: string;
  difficulty: number;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Review {
  id: string;
  promptId: string;
  userId: string;
  quality: number;
  timeSpent: number;
  reviewedAt: Date;
  wasCorrect: boolean;
}

const SpacedRepetition: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'review'>('add');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock user ID - in real app, get from auth context
  const userId = 'demo-user';

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceType, setSourceType] = useState<'CE' | 'Book' | 'Article' | 'Course'>('CE');
  const [sourceTitle, setSourceTitle] = useState('');

  // Fetch knowledge entries
  const { data: knowledgeEntries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['/api/knowledge-entries', userId],
    queryFn: () => fetch(`/api/knowledge-entries/${userId}`).then(res => res.json()),
  });

  // Fetch prompts due for review
  const { data: duePrompts = [], isLoading: loadingPrompts } = useQuery({
    queryKey: ['/api/prompts/due', userId],
    queryFn: () => fetch(`/api/prompts/due/${userId}`).then(res => res.json()),
  });

  // Create knowledge entry mutation
  const createEntryMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/knowledge-entries', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge-entries', userId] });
      toast({
        title: "Knowledge Entry Created",
        description: "Your entry has been saved and prompts are being generated.",
      });
      // Reset form
      setTitle('');
      setContent('');
      setSourceTitle('');
    },
    onError: (error) => {
      console.error('Error creating knowledge entry:', error);
      toast({
        title: "Error",
        description: "Failed to create knowledge entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate prompts mutation
  const generatePromptsMutation = useMutation({
    mutationFn: ({ content, knowledgeEntryId }: { content: string; knowledgeEntryId: string }) =>
      apiRequest('POST', '/api/prompts/generate', { content, knowledgeEntryId, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prompts/due', userId] });
    },
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: (reviewData: any) => apiRequest('POST', '/api/reviews', reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prompts/due', userId] });
      toast({
        title: "Review Recorded",
        description: "Your response has been saved and scheduled for future review.",
      });
    },
  });

  const handleAddKnowledge = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and content fields.",
        variant: "destructive"
      });
      return;
    }

    const entryData = {
      userId,
      title: title.trim(),
      content: content.trim(),
      sourceType,
      sourceTitle: sourceTitle.trim() || undefined,
      tags: [],
    };

    createEntryMutation.mutate(entryData);
  };

  const handlePromptAnswer = (quality: number) => {
    if (!duePrompts[currentPromptIndex] || !startTime) return;

    const timeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const reviewData = {
      promptId: duePrompts[currentPromptIndex].id,
      userId,
      quality,
      timeSpent,
      wasCorrect: quality >= 2,
    };

    submitReviewMutation.mutate(reviewData);

    setTimeout(() => {
      setShowAnswer(false);
      setCurrentPromptIndex(prev => (prev + 1) % duePrompts.length);
      setStartTime(null);
    }, 1500);
  };

  const currentPrompt = duePrompts[currentPromptIndex];

  const difficultyOptions = [
    { value: 0, label: 'Again', icon: AlertCircle, color: 'bg-red-500 hover:bg-red-600', description: 'Complete blackout' },
    { value: 1, label: 'Hard', icon: Clock, color: 'bg-orange-500 hover:bg-orange-600', description: 'Recalled with difficulty' },
    { value: 2, label: 'Good', icon: CheckCircle, color: 'bg-blue-500 hover:bg-blue-600', description: 'Recalled with some effort' },
    { value: 3, label: 'Easy', icon: CheckCircle, color: 'bg-green-500 hover:bg-green-600', description: 'Perfect recall' }
  ];

  useEffect(() => {
    if (activeTab === 'review' && currentPrompt && !startTime) {
      setStartTime(new Date());
    }
  }, [activeTab, currentPrompt, currentPromptIndex, startTime]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-black dark:text-white">
            Knowledge Retention
          </h1>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your continuing education into lasting knowledge with AI-powered spaced repetition
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3 justify-center">
          <Button
            variant={activeTab === 'add' ? 'default' : 'outline'}
            onClick={() => setActiveTab('add')}
            className="flex items-center gap-2 px-6 py-3 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Knowledge ({knowledgeEntries.length} entries)
          </Button>
          <Button
            variant={activeTab === 'review' ? 'default' : 'outline'}
            onClick={() => setActiveTab('review')}
            className="flex items-center gap-2 px-6 py-3 font-medium"
          >
            <Brain className="w-4 h-4" />
            Review ({duePrompts.length} due)
          </Button>
        </div>

        {/* Add Knowledge Tab */}
        {activeTab === 'add' && (
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-black dark:text-white">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Add Knowledge Entry
              </CardTitle>
              <CardDescription className="text-base font-medium text-gray-700 dark:text-gray-300">
                Input notes from CE courses, books, or articles to generate study prompts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-black dark:text-white block mb-2">Source Type</label>
                  <Select value={sourceType} onValueChange={(value: 'CE' | 'Book' | 'Article' | 'Course') => setSourceType(value)}>
                    <SelectTrigger className="border-gray-300 dark:border-gray-700 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CE">CE Course</SelectItem>
                      <SelectItem value="Book">Book</SelectItem>
                      <SelectItem value="Article">Article</SelectItem>
                      <SelectItem value="Course">Course</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-bold text-black dark:text-white block mb-2">Source Title</label>
                  <Input
                    value={sourceTitle}
                    onChange={(e) => setSourceTitle(e.target.value)}
                    placeholder="e.g., 'The Body Keeps the Score'"
                    className="border-gray-300 dark:border-gray-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-black dark:text-white block mb-2">Entry Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief title for this knowledge entry"
                  className="border-gray-300 dark:border-gray-700 font-medium"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-black dark:text-white block mb-2">Content</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your notes here..."
                  rows={6}
                  className="border-gray-300 dark:border-gray-700 font-medium"
                />
              </div>

              <Button 
                onClick={handleAddKnowledge}
                disabled={createEntryMutation.isPending}
                className="w-full py-3 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createEntryMutation.isPending ? 'Creating...' : 'Generate Study Prompts'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Review Tab */}
        {activeTab === 'review' && (
          <div>
            {loadingPrompts ? (
              <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950">
                <CardContent className="p-12 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading prompts...</p>
                </CardContent>
              </Card>
            ) : duePrompts.length === 0 ? (
              <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950">
                <CardContent className="p-12 text-center space-y-6">
                  <Brain className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto" />
                  <h3 className="text-2xl font-bold text-black dark:text-white">No prompts due for review</h3>
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Add some knowledge entries to generate study prompts, or check back later for scheduled reviews.
                  </p>
                  <Button onClick={() => setActiveTab('add')} className="py-3 px-6 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white">
                    Add Knowledge
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-sm font-bold px-3 py-1">
                      Prompt {currentPromptIndex + 1} of {duePrompts.length}
                    </Badge>
                    <Badge variant="outline" className="text-sm font-bold px-3 py-1">
                      Level: {currentPrompt?.difficulty || 0}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Question */}
                  <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-black dark:text-white mb-3">Question:</h3>
                    <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">{currentPrompt?.question}</p>
                  </div>

                  {/* Show Answer Button */}
                  {!showAnswer && (
                    <Button
                      onClick={() => setShowAnswer(true)}
                      className="w-full py-3 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Eye className="w-5 h-5 mr-3" />
                      Show Answer
                    </Button>
                  )}

                  {/* Answer Section */}
                  <AnimatePresence>
                    {showAnswer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div className="p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h3 className="text-lg font-bold text-black dark:text-white mb-3">Answer:</h3>
                          <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">{currentPrompt?.answer}</p>
                        </div>

                        {/* Difficulty Rating */}
                        <div className="space-y-4">
                          <h4 className="text-base font-bold text-black dark:text-white">How well did you recall this?</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {difficultyOptions.map((option) => {
                              const IconComponent = option.icon;
                              return (
                                <Button
                                  key={option.value}
                                  onClick={() => handlePromptAnswer(option.value)}
                                  disabled={submitReviewMutation.isPending}
                                  className={`${option.color} text-white text-sm py-4 px-3 h-auto flex flex-col items-center gap-2 font-bold`}
                                  variant="default"
                                >
                                  <IconComponent className="w-5 h-5" />
                                  <span className="font-bold">{option.label}</span>
                                  <span className="text-xs opacity-90 font-medium">{option.description}</span>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpacedRepetition;