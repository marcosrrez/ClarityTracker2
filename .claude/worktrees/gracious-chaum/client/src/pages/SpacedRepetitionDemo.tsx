import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Brain, BookOpen, GraduationCap, CheckCircle, AlertCircle, Clock, Eye, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface PromptData {
  id: string;
  question: string;
  answer: string;
  difficulty?: number;
  reviewed: boolean;
}

const SpacedRepetitionDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'review'>('add');
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const { toast } = useToast();

  // Sample knowledge entries for demonstration
  const [knowledgeEntries] = useState([
    {
      id: '1',
      title: 'Trauma-Informed Care Principles',
      content: 'Trauma-informed care is based on six key principles: safety, trustworthiness and transparency, peer support, collaboration and mutuality, empowerment and choice, and cultural, historical, and gender issues.',
      sourceType: 'CE',
      sourceTitle: 'Introduction to Trauma-Informed Care',
      tags: ['trauma', 'care principles']
    },
    {
      id: '2', 
      title: 'CBT Core Concepts',
      content: 'Cognitive Behavioral Therapy focuses on the relationship between thoughts, feelings, and behaviors. The cognitive triangle shows how these three elements influence each other in a cyclical pattern.',
      sourceType: 'Book',
      sourceTitle: 'Cognitive Therapy: Basics and Beyond',
      tags: ['CBT', 'therapy', 'cognitive triangle']
    }
  ]);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceType, setSourceType] = useState<'CE' | 'Book'>('CE');
  const [sourceTitle, setSourceTitle] = useState('');

  const generatePromptsFromContent = (content: string, title: string) => {
    // Simple demonstration - create basic prompts from the content
    const sentences = content.split('.').filter(s => s.trim().length > 20);
    const newPrompts: PromptData[] = [];

    sentences.forEach((sentence, index) => {
      if (index < 3) { // Limit to 3 prompts for demo
        const words = sentence.trim().split(' ');
        if (words.length > 5) {
          // Create a fill-in-the-blank style question
          const hiddenWordIndex = Math.floor(words.length / 2);
          const hiddenWord = words[hiddenWordIndex];
          const questionWords = [...words];
          questionWords[hiddenWordIndex] = '______';
          
          newPrompts.push({
            id: `prompt-${Date.now()}-${index}`,
            question: `Complete this statement from "${title}": ${questionWords.join(' ')}`,
            answer: hiddenWord,
            reviewed: false
          });
        }
      }
    });

    return newPrompts;
  };

  const handleAddKnowledge = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and content fields.",
        variant: "destructive"
      });
      return;
    }

    const newPrompts = generatePromptsFromContent(content, title);
    setPrompts(prev => [...prev, ...newPrompts]);
    
    toast({
      title: "Knowledge Added!",
      description: `Generated ${newPrompts.length} study prompts from your content.`
    });

    // Reset form
    setTitle('');
    setContent('');
    setSourceTitle('');
  };

  const handlePromptAnswer = (difficulty: number) => {
    if (prompts[currentPromptIndex]) {
      const updatedPrompts = [...prompts];
      updatedPrompts[currentPromptIndex] = {
        ...updatedPrompts[currentPromptIndex],
        difficulty,
        reviewed: true
      };
      setPrompts(updatedPrompts);
      
      toast({
        title: "Response Recorded",
        description: "Your review has been saved for spaced repetition scheduling."
      });

      setTimeout(() => {
        setShowAnswer(false);
        setCurrentPromptIndex(prev => (prev + 1) % prompts.length);
      }, 1500);
    }
  };

  const unreviewedPrompts = prompts.filter(p => !p.reviewed);
  const currentPrompt = unreviewedPrompts[currentPromptIndex % unreviewedPrompts.length];

  const difficultyOptions = [
    { value: 0, label: 'Again', icon: AlertCircle, color: 'bg-red-500 hover:bg-red-600', description: 'Completely forgot' },
    { value: 1, label: 'Hard', icon: Clock, color: 'bg-orange-500 hover:bg-orange-600', description: 'Recalled with difficulty' },
    { value: 2, label: 'Good', icon: CheckCircle, color: 'bg-blue-500 hover:bg-blue-600', description: 'Recalled correctly' },
    { value: 3, label: 'Easy', icon: CheckCircle, color: 'bg-green-500 hover:bg-green-600', description: 'Recalled easily' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-black">
              <Brain className="w-7 h-7 text-blue-600" />
              Spaced Repetition Learning (Demo)
            </CardTitle>
            <CardDescription className="text-lg">
              Experience scientifically-proven spaced repetition for CE course and book knowledge retention
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'add' ? 'default' : 'outline'}
            onClick={() => setActiveTab('add')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Knowledge ({knowledgeEntries.length} entries)
          </Button>
          <Button
            variant={activeTab === 'review' ? 'default' : 'outline'}
            onClick={() => setActiveTab('review')}
            className="flex items-center gap-2"
          >
            <Brain className="w-4 h-4" />
            Review ({unreviewedPrompts.length} due)
          </Button>
        </div>

        {/* Add Knowledge Tab */}
        {activeTab === 'add' && (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black font-bold">
                <BookOpen className="w-5 h-5" />
                Add Knowledge Entry
              </CardTitle>
              <CardDescription>
                Input notes from CE courses or books to generate study prompts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-black">Source Type</label>
                  <Select value={sourceType} onValueChange={(value: 'CE' | 'Book') => setSourceType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CE">CE Course</SelectItem>
                      <SelectItem value="Book">Book</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-black">Source Title</label>
                  <Input
                    value={sourceTitle}
                    onChange={(e) => setSourceTitle(e.target.value)}
                    placeholder="e.g., 'The Body Keeps the Score'"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-black">Entry Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief title for this knowledge entry"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-black">Content</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your notes here..."
                  rows={6}
                />
              </div>

              <Button 
                onClick={handleAddKnowledge}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Generate Study Prompts
              </Button>

              {/* Sample Entries */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-black mb-3">Try These Sample Entries</h3>
                <div className="grid gap-3">
                  {knowledgeEntries.map(entry => (
                    <Card key={entry.id} className="p-4 cursor-pointer hover:bg-gray-50" 
                          onClick={() => {
                            setTitle(entry.title);
                            setContent(entry.content);
                            setSourceTitle(entry.sourceTitle);
                            setSourceType(entry.sourceType as 'CE' | 'Book');
                          }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-black">{entry.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{entry.content.substring(0, 100)}...</p>
                        </div>
                        <Badge variant={entry.sourceType === 'CE' ? 'default' : 'secondary'}>
                          {entry.sourceType}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Tab */}
        {activeTab === 'review' && (
          <div>
            {unreviewedPrompts.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center space-y-4">
                  <Brain className="w-16 h-16 text-gray-400 mx-auto" />
                  <h3 className="text-xl font-medium text-black">No prompts to review</h3>
                  <p className="text-gray-600">
                    Add some knowledge entries to generate study prompts for review.
                  </p>
                  <Button onClick={() => setActiveTab('add')} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Add Knowledge
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      Prompt {currentPromptIndex + 1} of {unreviewedPrompts.length}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Question */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-black mb-2">Question:</h3>
                    <p className="text-gray-700">{currentPrompt?.question}</p>
                  </div>

                  {/* Show Answer Button */}
                  {!showAnswer && (
                    <Button
                      onClick={() => setShowAnswer(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
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
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h3 className="text-lg font-medium text-black mb-2">Answer:</h3>
                          <p className="text-gray-700">{currentPrompt?.answer}</p>
                        </div>

                        {/* Difficulty Rating */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-black">How difficult was this to recall?</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {difficultyOptions.map((option) => {
                              const IconComponent = option.icon;
                              return (
                                <Button
                                  key={option.value}
                                  onClick={() => handlePromptAnswer(option.value)}
                                  className={`${option.color} text-white text-sm py-3 px-2 h-auto flex flex-col items-center gap-1`}
                                  variant="default"
                                >
                                  <IconComponent className="w-4 h-4" />
                                  <span className="font-medium">{option.label}</span>
                                  <span className="text-xs opacity-90">{option.description}</span>
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

export default SpacedRepetitionDemo;