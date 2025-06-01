import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Sparkles, Search, ChevronLeft, ChevronRight, Trash2, AlertTriangle, Bot } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from "date-fns";
import { useLogEntries } from "@/hooks/use-firestore";
import { getAiAnalysis, deleteAiAnalysis } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { LogEntry, AiAnalysis } from "@shared/schema";

interface GalleryItem extends LogEntry {
  analysis?: AiAnalysis;
}

interface CardGroup {
  label: string;
  items: GalleryItem[];
  startDate: Date;
  endDate: Date;
}

export const GalleryView = () => {
  const { user } = useAuth();
  const { entries, loading: entriesLoading } = useLogEntries();
  const { toast } = useToast();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [groupBy, setGroupBy] = useState<"week" | "month">("week");
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [deleteDialogItem, setDeleteDialogItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const loadAnalyses = async () => {
      if (!user || !entries.length) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const entriesWithNotes = entries.filter(entry => entry.notes.trim().length > 0);
        
        const itemsWithAnalysis = await Promise.all(
          entriesWithNotes.map(async (entry) => {
            try {
              const analysis = await getAiAnalysis(user.uid, entry.id);
              return { ...entry, analysis: analysis || undefined };
            } catch (error) {
              console.error(`Error loading analysis for entry ${entry.id}:`, error);
              return entry;
            }
          })
        );

        setGalleryItems(itemsWithAnalysis);
      } catch (error) {
        console.error("Error loading gallery items:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!entriesLoading) {
      loadAnalyses();
    }
  }, [user, entries, entriesLoading]);

  // Create card groups by week or month
  const createCardGroups = (items: GalleryItem[]): CardGroup[] => {
    const groups: Map<string, GalleryItem[]> = new Map();

    items.forEach(item => {
      const date = new Date(item.dateOfContact);
      let key: string;
      let startDate: Date;
      let endDate: Date;

      if (groupBy === "week") {
        startDate = startOfWeek(date, { weekStartsOn: 1 });
        endDate = endOfWeek(date, { weekStartsOn: 1 });
        key = format(startDate, "yyyy-'W'ww");
      } else {
        startDate = startOfMonth(date);
        endDate = endOfMonth(date);
        key = format(startDate, "yyyy-MM");
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries())
      .map(([key, items]) => {
        const firstItem = items[0];
        const date = new Date(firstItem.dateOfContact);
        
        let startDate: Date;
        let endDate: Date;
        let label: string;

        if (groupBy === "week") {
          startDate = startOfWeek(date, { weekStartsOn: 1 });
          endDate = endOfWeek(date, { weekStartsOn: 1 });
          label = `Week of ${format(startDate, "MMM d")}`;
        } else {
          startDate = startOfMonth(date);
          endDate = endOfMonth(date);
          label = format(startDate, "MMMM yyyy");
        }

        return {
          label,
          items: items.sort((a, b) => new Date(b.dateOfContact).getTime() - new Date(a.dateOfContact).getTime()),
          startDate,
          endDate
        };
      })
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  };

  // Intelligent search function
  const performIntelligentSearch = (items: GalleryItem[], query: string): GalleryItem[] => {
    if (!query.trim()) return items;

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
    
    return items.filter(item => {
      const searchableText = [
        item.notes,
        item.analysis?.summary || '',
        item.analysis?.themes?.join(' ') || '',
        item.analysis?.reflectivePrompts?.join(' ') || '',
        item.analysis?.keyLearnings?.join(' ') || '',
        item.analysis?.ccsrCategory || '',
        format(new Date(item.dateOfContact), 'MMMM yyyy dd')
      ].join(' ').toLowerCase();

      return searchTerms.some(term => searchableText.includes(term));
    });
  };

  // Handle deletion
  const handleDeleteAnalysis = async (item: GalleryItem) => {
    if (!user) return;

    try {
      if (item.analysis) {
        await deleteAiAnalysis(user.uid, item.id);
        
        // Update local state
        setGalleryItems(prev => 
          prev.map(galleryItem => 
            galleryItem.id === item.id 
              ? { ...galleryItem, analysis: undefined }
              : galleryItem
          )
        );
        
        toast({
          title: "Analysis Deleted",
          description: "The AI analysis has been removed. Your session hours remain tracked.",
        });
      }
    } catch (error) {
      console.error("Error deleting analysis:", error);
      toast({
        title: "Deletion Failed",
        description: "Unable to delete the analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogItem(null);
    }
  };

  // Process items with intelligent search and filtering
  const searchedItems = performIntelligentSearch(galleryItems, searchQuery);
  
  const filteredItems = searchedItems.filter(item => {
    const matchesCategory = categoryFilter === "all" || 
      (categoryFilter === "with-analysis" && item.analysis) ||
      (categoryFilter === "themes" && item.analysis?.themes?.length) ||
      (categoryFilter === "prompts" && item.analysis?.reflectivePrompts?.length);

    return matchesCategory;
  });

  // Create grouped cards
  const cardGroups = createCardGroups(filteredItems);
  const currentGroup = cardGroups[selectedGroupIndex];
  const currentCard = currentGroup?.items[selectedCardIndex];

  // Navigation functions
  const navigateCard = (direction: 'prev' | 'next') => {
    if (!currentGroup) return;

    if (direction === 'next') {
      if (selectedCardIndex < currentGroup.items.length - 1) {
        setSelectedCardIndex(prev => prev + 1);
      } else if (selectedGroupIndex < cardGroups.length - 1) {
        setSelectedGroupIndex(prev => prev + 1);
        setSelectedCardIndex(0);
      }
    } else {
      if (selectedCardIndex > 0) {
        setSelectedCardIndex(prev => prev - 1);
      } else if (selectedGroupIndex > 0) {
        setSelectedGroupIndex(prev => prev - 1);
        setSelectedCardIndex(cardGroups[selectedGroupIndex - 1].items.length - 1);
      }
    }
  };

  // Reset navigation when filters change
  useEffect(() => {
    setSelectedGroupIndex(0);
    setSelectedCardIndex(0);
  }, [searchQuery, categoryFilter, groupBy]);

  if (entriesLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (galleryItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Session Insights Yet</h3>
        <p className="text-muted-foreground">
          Your AI-analyzed session notes will appear here. Start by adding entries with notes 
          and run them through the AI Analysis tool.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search insights, themes, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="with-analysis">With Analysis</SelectItem>
            <SelectItem value="themes">Has Themes</SelectItem>
            <SelectItem value="prompts">Has Prompts</SelectItem>
          </SelectContent>
        </Select>

        <Select value={groupBy} onValueChange={(value: "week" | "month") => setGroupBy(value)}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">By Week</SelectItem>
            <SelectItem value="month">By Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Card Deck Interface */}
      {cardGroups.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No insights match your current search and filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Group Navigation */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {currentGroup?.label} • {currentCard && `${selectedCardIndex + 1} of ${currentGroup.items.length}`}
            </div>
            <div className="text-xs text-muted-foreground">
              Group {selectedGroupIndex + 1} of {cardGroups.length}
            </div>
          </div>

          {/* Current Card Display */}
          {currentCard && (
            <div className="relative">
              <Card className="max-w-2xl mx-auto shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {format(new Date(currentCard.dateOfContact), "EEEE, MMMM d, yyyy")}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {currentCard.clientContactHours} hours
                        {currentCard.analysis && (
                          <Badge variant="secondary" className="ml-2">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Analyzed
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    {currentCard.analysis && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialogItem(currentCard)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Session Notes */}
                  <div>
                    <h4 className="font-medium text-sm text-foreground mb-2">Session Notes</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentCard.notes}
                    </p>
                  </div>

                  {/* AI Analysis */}
                  {currentCard.analysis && (
                    <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Analysis
                      </h4>
                      
                      {currentCard.analysis.summary && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Summary</h5>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {currentCard.analysis.summary}
                          </p>
                        </div>
                      )}

                      {currentCard.analysis.themes && currentCard.analysis.themes.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Key Themes</h5>
                          <div className="flex flex-wrap gap-2">
                            {currentCard.analysis.themes.map((theme: string, index: number) => (
                              <Badge key={index} variant="outline">
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentCard.analysis.reflectivePrompts && currentCard.analysis.reflectivePrompts.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Reflective Questions</h5>
                          <div className="space-y-2">
                            {currentCard.analysis.reflectivePrompts.slice(0, 2).map((prompt: string, index: number) => (
                              <p key={index} className="text-xs text-gray-600 dark:text-gray-400 italic">
                                • {prompt}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Navigation Controls */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-16">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateCard('prev')}
                  disabled={selectedGroupIndex === 0 && selectedCardIndex === 0}
                  className="rounded-full w-12 h-12"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="absolute top-1/2 -translate-y-1/2 -right-16">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateCard('next')}
                  disabled={selectedGroupIndex === cardGroups.length - 1 && 
                           selectedCardIndex === currentGroup.items.length - 1}
                  className="rounded-full w-12 h-12"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Progress Indicators */}
          <div className="flex justify-center">
            <div className="flex space-x-1">
              {currentGroup?.items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCardIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === selectedCardIndex 
                      ? 'bg-blue-500' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Deletion Confirmation Dialog */}
      <Dialog open={!!deleteDialogItem} onOpenChange={() => setDeleteDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Delete Analysis
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will permanently delete the AI analysis for this session. Your logged hours and session notes will remain intact.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogItem(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteDialogItem && handleDeleteAnalysis(deleteDialogItem)}
              >
                Delete Analysis
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};