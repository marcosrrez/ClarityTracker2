import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PromptCardProps {
  prompt: {
    id: string;
    question: string;
    answer: string;
    imageUrl?: string;
    nextReviewDate: Date;
  };
  onAnswer: (promptId: string, difficulty: number) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onAnswer }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);

  const difficultyOptions = [
    { value: 0, label: 'Again', icon: AlertCircle, color: 'bg-red-500 hover:bg-red-600', description: 'Completely forgot' },
    { value: 1, label: 'Hard', icon: Clock, color: 'bg-orange-500 hover:bg-orange-600', description: 'Recalled with difficulty' },
    { value: 2, label: 'Good', icon: CheckCircle, color: 'bg-blue-500 hover:bg-blue-600', description: 'Recalled correctly' },
    { value: 3, label: 'Easy', icon: CheckCircle, color: 'bg-green-500 hover:bg-green-600', description: 'Recalled easily' }
  ];

  const handleAnswerClick = (difficulty: number) => {
    setSelectedDifficulty(difficulty);
    onAnswer(prompt.id, difficulty);
  };

  const isOverdue = new Date() > new Date(prompt.nextReviewDate);

  return (
    <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Badge variant={isOverdue ? "destructive" : "secondary"} className="text-xs">
            {isOverdue ? 'Overdue' : 'Due for Review'}
          </Badge>
          {prompt.imageUrl && (
            <img 
              src={prompt.imageUrl} 
              alt="Prompt attachment" 
              className="w-12 h-12 rounded object-cover"
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Question */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-black mb-2">Question:</h3>
          <p className="text-gray-700">{prompt.question}</p>
        </div>

        {/* Show Answer Button */}
        {!showAnswer && (
          <Button
            onClick={() => setShowAnswer(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            variant="default"
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
                <p className="text-gray-700">{prompt.answer}</p>
              </div>

              {/* Difficulty Rating */}
              {selectedDifficulty === null && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-black">How difficult was this to recall?</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {difficultyOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <Button
                          key={option.value}
                          onClick={() => handleAnswerClick(option.value)}
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
              )}

              {/* Feedback after rating */}
              {selectedDifficulty !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center p-4 bg-green-50 rounded-lg border border-green-200"
                >
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-800 font-medium">
                    Response recorded! Your next review has been scheduled based on the SM-2 algorithm.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default PromptCard;