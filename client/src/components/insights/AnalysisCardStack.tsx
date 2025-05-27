import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Brain,
  Lightbulb,
  Target,
  Eye,
  Sparkles,
  Clock
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";

interface AnalysisCard {
  id: string;
  title: string;
  content: string;
  type: 'insight' | 'reflection' | 'pattern' | 'growth';
  date: string;
  themes: string[];
  category?: string;
}

interface AnalysisCardStackProps {
  cards: AnalysisCard[];
  onCardClick?: (card: AnalysisCard) => void;
}

export const AnalysisCardStack = ({ cards, onCardClick }: AnalysisCardStackProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [groupBy, setGroupBy] = useState<'month' | 'week'>('month');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  // Group cards by time periods
  const groupedCards = useMemo(() => {
    const groups: { [key: string]: AnalysisCard[] } = {};
    
    cards.forEach(card => {
      const cardDate = parseISO(card.date);
      let periodKey: string;
      
      if (groupBy === 'month') {
        periodKey = format(cardDate, 'yyyy-MM');
      } else {
        const weekStart = startOfWeek(cardDate);
        periodKey = format(weekStart, 'yyyy-MM-dd');
      }
      
      if (!groups[periodKey]) {
        groups[periodKey] = [];
      }
      groups[periodKey].push(card);
    });
    
    return groups;
  }, [cards, groupBy]);

  // Get periods for dropdown
  const periods = useMemo(() => {
    return Object.keys(groupedCards)
      .sort((a, b) => b.localeCompare(a)) // Most recent first
      .map(period => {
        const date = parseISO(period);
        const label = groupBy === 'month' 
          ? format(date, 'MMMM yyyy')
          : `Week of ${format(date, 'MMM d, yyyy')}`;
        return { value: period, label };
      });
  }, [groupedCards, groupBy]);

  // Current cards to display
  const currentCards = selectedPeriod ? groupedCards[selectedPeriod] || [] : cards;

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'insight': return <Brain className="h-4 w-4" />;
      case 'reflection': return <Lightbulb className="h-4 w-4" />;
      case 'pattern': return <Target className="h-4 w-4" />;
      case 'growth': return <Sparkles className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getCardColor = (type: string) => {
    switch (type) {
      case 'insight': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'reflection': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'pattern': return 'bg-green-50 border-green-200 text-green-800';
      case 'growth': return 'bg-amber-50 border-amber-200 text-amber-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (cards.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Analysis Cards Yet</h3>
          <p className="text-gray-500 text-center max-w-md">
            Start adding session notes to generate AI-powered insights and reflections that will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Group by:</span>
          <Tabs value={groupBy} onValueChange={(value) => setGroupBy(value as 'month' | 'week')}>
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {periods.length > 0 && (
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All periods</SelectItem>
              {periods.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Card Stack Display */}
      {currentCards.length > 0 ? (
        <div className="space-y-4">
          {/* Current Card */}
          <div className="relative">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                getCardColor(currentCards[currentIndex]?.type || 'insight')
              }`}
              onClick={() => onCardClick?.(currentCards[currentIndex])}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getCardIcon(currentCards[currentIndex]?.type || 'insight')}
                    <CardTitle className="text-lg">
                      {currentCards[currentIndex]?.title}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {format(parseISO(currentCards[currentIndex]?.date), 'MMM d')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4 line-clamp-3">
                  {currentCards[currentIndex]?.content}
                </p>
                {currentCards[currentIndex]?.themes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentCards[currentIndex].themes.slice(0, 3).map((theme, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                    {currentCards[currentIndex].themes.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{currentCards[currentIndex].themes.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Controls */}
            {currentCards.length > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <span className="text-sm text-gray-500 flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{currentIndex + 1} of {currentCards.length}</span>
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIndex(Math.min(currentCards.length - 1, currentIndex + 1))}
                  disabled={currentIndex === currentCards.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>

          {/* Card Stack Indicator */}
          {currentCards.length > 1 && (
            <div className="flex justify-center space-x-1">
              {currentCards.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-500 text-center">
              No analysis cards found for {groupBy === 'month' ? 'this month' : 'this week'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};