import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Sparkles, Search, Trash2, AlertTriangle, Bot, Eye, Filter, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfWeek, endOfWeek, getWeeksInMonth, startOfMonth, endOfMonth } from "date-fns";
import { useLogEntries } from "@/hooks/use-firestore";
import { getAiAnalysis, deleteAiAnalysis } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { LogEntry, AiAnalysis } from "@shared/schema";

interface GalleryItem extends LogEntry {
  analysis?: AiAnalysis;
}

interface WeekDeck {
  label: string;
  items: GalleryItem[];
  weekNumber: number;
  startDate: Date;
  endDate: Date;
}

interface CardDeck {
  month: string;
  year: number;
  weeks: WeekDeck[];
}

export const GalleryView = () => {
  const { user } = useAuth();
  const { entries, loading: entriesLoading } = useLogEntries();
  const { toast } = useToast();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [themeFilter, setThemeFilter] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number[]>([0, 0, 0, 0]); // One for each week
  const [expandedCard, setExpandedCard] = useState<GalleryItem | null>(null);
  const [deleteDialogItem, setDeleteDialogItem] = useState<GalleryItem | null>(null);
  const [dragState, setDragState] = useState<{ weekIndex: number; startX: number; currentX: number } | null>(null);
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // Create intelligent card organization
  const createCardDecks = (items: GalleryItem[]): WeekDeck[] => {
    if (items.length === 0) return [];

    // Sort items by date (newest first)
    const sortedItems = items.sort((a, b) => new Date(b.dateOfContact).getTime() - new Date(a.dateOfContact).getTime());
    
    // Group items by week across all months
    const weekGroups: Map<string, GalleryItem[]> = new Map();
    
    sortedItems.forEach(item => {
      const itemDate = new Date(item.dateOfContact);
      const weekStart = startOfWeek(itemDate, { weekStartsOn: 1 });
      const weekKey = format(weekStart, "yyyy-'W'ww");
      
      if (!weekGroups.has(weekKey)) {
        weekGroups.set(weekKey, []);
      }
      weekGroups.get(weekKey)!.push(item);
    });

    // Convert to deck format and limit to 4 most recent weeks with content
    const weekDecks = Array.from(weekGroups.entries())
      .map(([weekKey, weekItems]) => {
        const firstItem = weekItems[0];
        const weekStart = startOfWeek(new Date(firstItem.dateOfContact), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        
        return {
          label: format(weekStart, "MMM d") + " - " + format(weekEnd, "MMM d"),
          items: weekItems,
          weekNumber: parseInt(format(weekStart, "w")),
          startDate: weekStart,
          endDate: weekEnd
        };
      })
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
      .slice(0, 4); // Show up to 4 most recent weeks

    // Ensure we have exactly 4 decks, padding with empty ones if needed
    while (weekDecks.length < 4) {
      const lastWeek = weekDecks[weekDecks.length - 1];
      const nextWeekStart = new Date(lastWeek ? lastWeek.startDate : new Date());
      nextWeekStart.setDate(nextWeekStart.getDate() - 7);
      const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 });
      
      weekDecks.push({
        label: format(nextWeekStart, "MMM d") + " - " + format(nextWeekEnd, "MMM d"),
        items: [],
        weekNumber: parseInt(format(nextWeekStart, "w")),
        startDate: nextWeekStart,
        endDate: nextWeekEnd
      });
    }

    return weekDecks;
  };

  // Intelligent search function
  const performIntelligentSearch = (items: GalleryItem[], query: string): GalleryItem[] => {
    if (!query.trim()) return items;

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
    
    return items.filter(item => {
      // Safely handle themes data structure
      const themesText = item.analysis?.themes 
        ? (Array.isArray(item.analysis.themes) 
            ? item.analysis.themes.join(' ')
            : typeof item.analysis.themes === 'object' 
              ? Object.values(item.analysis.themes).join(' ')
              : String(item.analysis.themes))
        : '';

      // Safely handle reflective prompts
      const promptsText = item.analysis?.reflectivePrompts
        ? (Array.isArray(item.analysis.reflectivePrompts)
            ? item.analysis.reflectivePrompts.join(' ')
            : typeof item.analysis.reflectivePrompts === 'object'
              ? Object.values(item.analysis.reflectivePrompts).join(' ')
              : String(item.analysis.reflectivePrompts))
        : '';

      // Safely handle key learnings
      const learningsText = item.analysis?.keyLearnings
        ? (Array.isArray(item.analysis.keyLearnings)
            ? item.analysis.keyLearnings.join(' ')
            : typeof item.analysis.keyLearnings === 'object'
              ? Object.values(item.analysis.keyLearnings).join(' ')
              : String(item.analysis.keyLearnings))
        : '';

      const searchableText = [
        item.notes,
        item.analysis?.summary || '',
        themesText,
        promptsText,
        learningsText,
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

  // Generate inviting summary for cards
  const generateInvitingSummary = (item: GalleryItem): string => {
    if (item.analysis?.summary) {
      const summary = item.analysis.summary;
      
      // Create more engaging, personal summaries
      if (summary.toLowerCase().includes('blind spot')) {
        return `In this session, you became aware of a potential blind spot...`;
      } else if (summary.toLowerCase().includes('breakthrough') || summary.toLowerCase().includes('insight')) {
        return `This session brought you a meaningful breakthrough...`;
      } else if (summary.toLowerCase().includes('challenge') || summary.toLowerCase().includes('difficult')) {
        return `You navigated some challenging territory in this session...`;
      } else if (summary.toLowerCase().includes('progress') || summary.toLowerCase().includes('growth')) {
        return `You made notable progress in this session...`;
      } else if (summary.toLowerCase().includes('reflection') || summary.toLowerCase().includes('explore')) {
        return `This session opened up space for deep reflection...`;
      } else {
        return `In this session, you explored important themes...`;
      }
    } else {
      // Fallback based on note content or session length
      if (item.clientContactHours >= 1) {
        return `A meaningful ${item.clientContactHours}-hour session where you...`;
      } else {
        return `A focused session that covered important ground...`;
      }
    }
  };

  // Enhanced swipe gesture handlers with touch support
  const handlePointerDown = (weekIndex: number, event: React.PointerEvent) => {
    event.preventDefault();
    setDragState({
      weekIndex,
      startX: event.clientX,
      currentX: event.clientX
    });
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (dragState) {
      setDragState(prev => prev ? { ...prev, currentX: event.clientX } : null);
    }
  };

  const handlePointerUp = () => {
    if (dragState) {
      const deltaX = dragState.currentX - dragState.startX;
      const threshold = 60; // Minimum swipe distance
      
      if (Math.abs(deltaX) > threshold) {
        const weekIndex = dragState.weekIndex;
        const currentCardIndex = selectedCardIndex[weekIndex];
        const currentWeekDeck = weekDecks[weekIndex];
        
        if (currentWeekDeck && currentWeekDeck.items.length > 0) {
          if (deltaX > 0 && currentCardIndex > 0) {
            // Swipe right - previous card
            const newIndices = [...selectedCardIndex];
            newIndices[weekIndex] = currentCardIndex - 1;
            setSelectedCardIndex(newIndices);
          } else if (deltaX < 0 && currentCardIndex < currentWeekDeck.items.length - 1) {
            // Swipe left - next card
            const newIndices = [...selectedCardIndex];
            newIndices[weekIndex] = currentCardIndex + 1;
            setSelectedCardIndex(newIndices);
          }
        }
      }
      setDragState(null);
    }
  };

  // Get unique themes for filter dropdown
  const getUniqueThemes = (items: GalleryItem[]): string[] => {
    const themes = new Set<string>();
    items.forEach(item => {
      if (item.analysis?.themes) {
        if (Array.isArray(item.analysis.themes)) {
          item.analysis.themes.forEach(theme => themes.add(theme));
        } else if (typeof item.analysis.themes === 'object') {
          Object.values(item.analysis.themes).forEach(theme => themes.add(String(theme)));
        }
      }
    });
    return Array.from(themes).sort();
  };

  // Process items with intelligent search and filtering
  const searchedItems = performIntelligentSearch(galleryItems, searchQuery);
  
  const filteredItems = searchedItems.filter(item => {
    // Category filter
    const matchesCategory = categoryFilter === "all" || 
      (categoryFilter === "with-analysis" && item.analysis) ||
      (categoryFilter === "themes" && item.analysis?.themes) ||
      (categoryFilter === "prompts" && item.analysis?.reflectivePrompts);

    // Time filter
    const itemDate = new Date(item.dateOfContact);
    const now = new Date();
    let matchesTime = true;

    if (timeFilter === "this-week") {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      matchesTime = itemDate >= weekStart && itemDate <= weekEnd;
    } else if (timeFilter === "this-month") {
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      matchesTime = itemDate >= monthStart && itemDate <= monthEnd;
    } else if (timeFilter === "last-30-days") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesTime = itemDate >= thirtyDaysAgo;
    }

    // Theme filter
    let matchesTheme = true;
    if (themeFilter !== "all" && item.analysis?.themes) {
      if (Array.isArray(item.analysis.themes)) {
        matchesTheme = item.analysis.themes.includes(themeFilter);
      } else if (typeof item.analysis.themes === 'object') {
        matchesTheme = Object.values(item.analysis.themes).includes(themeFilter);
      }
    }

    return matchesCategory && matchesTime && matchesTheme;
  });

  // Create week decks from filtered items
  const weekDecks = createCardDecks(filteredItems);
  const uniqueThemes = getUniqueThemes(galleryItems);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || categoryFilter !== "all" || timeFilter !== "all" || themeFilter !== "all";

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setTimeFilter("all");
    setThemeFilter("all");
    setIsFilterOpen(false);
  };

  // Reset indices when data changes
  useEffect(() => {
    setSelectedCardIndex([0, 0, 0, 0]);
  }, [searchQuery, categoryFilter, timeFilter, themeFilter]);

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
    <div className="space-y-8">
      {/* Search and Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions, themes, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
          </div>

          {/* Filter Dropdown */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`relative ${hasActiveFilters ? 'text-blue-600 dark:text-blue-400' : ''}`}
              >
                <Filter className="h-4 w-4" />
                {hasActiveFilters && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="start">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-foreground mb-2">Filter Options</h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Category</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="with-analysis">With Analysis</SelectItem>
                        <SelectItem value="themes">Has Themes</SelectItem>
                        <SelectItem value="prompts">Has Prompts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Time Period</label>
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="this-week">This Week</SelectItem>
                        <SelectItem value="this-month">This Month</SelectItem>
                        <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Theme</label>
                    <Select value={themeFilter} onValueChange={setThemeFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Themes</SelectItem>
                        {uniqueThemes.map((theme) => (
                          <SelectItem key={theme} value={theme}>
                            {theme}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearAllFilters}
                      className="w-full"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filter Indicator */}
        {hasActiveFilters && (
          <div className="text-xs text-muted-foreground">
            {filteredItems.length} of {galleryItems.length} sessions
          </div>
        )}
      </div>

      {/* Header */}
      {weekDecks.length > 0 && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Your Session Insights</h2>
          <p className="text-sm text-muted-foreground mt-1">Swipe cards left or right to navigate • {filteredItems.length} sessions available</p>
        </div>
      )}

      {/* Card Deck Interface - 4 Week Layout */}
      {weekDecks.length === 0 || weekDecks.every(week => week.items.length === 0) ? (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Session Insights Yet</h3>
          <p className="text-muted-foreground">
            Your session insights will appear here as beautiful card decks organized by week.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {weekDecks.map((week, weekIndex) => (
            <div key={weekIndex} className="space-y-4">
              {/* Week Header */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">{week.label}</h3>
                <p className="text-xs text-muted-foreground">
                  {format(week.startDate, "MMM d")} - {format(week.endDate, "MMM d")}
                </p>
                {week.items.length > 0 && (
                  <Badge variant="outline" className="mt-1">
                    {selectedCardIndex[weekIndex] + 1} of {week.items.length}
                  </Badge>
                )}
              </div>

              {/* Card Stack */}
              <div className="relative h-80">
                {week.items.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No sessions this week</p>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="relative w-full h-full cursor-pointer select-none"
                    onPointerDown={(e) => handlePointerDown(weekIndex, e)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    style={{ touchAction: 'none' }}
                  >
                    {/* Stack of Cards - Show up to 4 behind current */}
                    {week.items.slice(selectedCardIndex[weekIndex], selectedCardIndex[weekIndex] + 4).map((item: GalleryItem, stackIndex: number) => {
                      const isActive = stackIndex === 0;
                      const zIndex = 10 - stackIndex;
                      const opacity = stackIndex === 0 ? 1 : Math.max(0.4, 1 - stackIndex * 0.15);
                      const scale = stackIndex === 0 ? 1 : Math.max(0.92, 1 - stackIndex * 0.025);
                      const translateY = stackIndex * 4;
                      const translateX = stackIndex * 3;
                      const rotateZ = stackIndex === 0 ? 0 : (stackIndex - 2) * 0.5;

                      return (
                        <div
                          key={item.id}
                          className={`absolute inset-0 transition-all duration-300 ease-out ${
                            isActive ? 'cursor-pointer hover:shadow-xl' : 'cursor-default'
                          }`}
                          style={{
                            zIndex,
                            opacity,
                            transform: `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotateZ}deg)`,
                          }}
                          onClick={() => isActive && setExpandedCard(item)}
                        >
                          <Card className={`w-full h-full group ${
                            isActive 
                              ? 'shadow-xl border-2 border-blue-300 dark:border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900' 
                              : 'shadow-lg border-gray-200 dark:border-gray-700'
                          } bg-white dark:bg-gray-900`}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-sm font-medium truncate">
                                    {format(new Date(item.dateOfContact), "MMM d, yyyy")}
                                  </CardTitle>
                                  <CardDescription className="flex items-center gap-2 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    <span className="text-xs">{item.clientContactHours}h</span>
                                    {item.analysis && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Sparkles className="h-2 w-2 mr-1" />
                                        AI
                                      </Badge>
                                    )}
                                  </CardDescription>
                                </div>
                                {isActive && item.analysis && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteDialogItem(item);
                                    }}
                                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </CardHeader>

                            {isActive && (
                              <CardContent className="space-y-3">
                                {/* Inviting Summary */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-lg">
                                  <p className="text-sm text-blue-900 dark:text-blue-100 font-medium leading-relaxed">
                                    {generateInvitingSummary(item)}
                                  </p>
                                </div>

                                {/* Key Themes Preview */}
                                {item.analysis?.themes && (
                                  <div className="flex flex-wrap gap-1">
                                    {(() => {
                                      const themes = Array.isArray(item.analysis.themes) 
                                        ? item.analysis.themes 
                                        : typeof item.analysis.themes === 'object'
                                          ? Object.values(item.analysis.themes)
                                          : [item.analysis.themes];
                                      
                                      return themes.slice(0, 3).map((theme: any, index: number) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {String(theme)}
                                        </Badge>
                                      ));
                                    })()}
                                    {(() => {
                                      const themes = Array.isArray(item.analysis.themes) 
                                        ? item.analysis.themes 
                                        : typeof item.analysis.themes === 'object'
                                          ? Object.values(item.analysis.themes)
                                          : [item.analysis.themes];
                                      
                                      return themes.length > 3 && (
                                        <Badge variant="outline" className="text-xs">+{themes.length - 3}</Badge>
                                      );
                                    })()}
                                  </div>
                                )}

                                {/* Tap to expand hint */}
                                <div className="flex items-center justify-center pt-2 border-t border-gray-100 dark:border-gray-800">
                                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 transition-colors hover:text-blue-700 dark:hover:text-blue-300">
                                    <Eye className="h-3 w-3" />
                                    <span className="text-xs font-medium">Tap to explore details</span>
                                  </div>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Card Navigation Dots */}
              {week.items.length > 1 && (
                <div className="flex justify-center">
                  <div className="flex space-x-1">
                    {week.items.map((_: GalleryItem, cardIndex: number) => (
                      <button
                        key={cardIndex}
                        onClick={() => {
                          const newIndices = [...selectedCardIndex];
                          newIndices[weekIndex] = cardIndex;
                          setSelectedCardIndex(newIndices);
                        }}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          cardIndex === selectedCardIndex[weekIndex]
                            ? 'bg-blue-500' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Expanded Card Details Dialog */}
      <Dialog open={!!expandedCard} onOpenChange={() => setExpandedCard(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Session Details
            </DialogTitle>
            <DialogDescription>
              Detailed view of your session analysis including notes, AI insights, and themes.
            </DialogDescription>
          </DialogHeader>
          
          {expandedCard && (
            <div className="space-y-6">
              {/* Session Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {format(new Date(expandedCard.dateOfContact), "EEEE, MMMM d, yyyy")}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{expandedCard.clientContactHours} hours</span>
                      </div>
                      {expandedCard.analysis && (
                        <Badge variant="secondary">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Analyzed
                        </Badge>
                      )}
                    </div>
                  </div>
                  {expandedCard.analysis && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeleteDialogItem(expandedCard);
                        setExpandedCard(null);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Analysis
                    </Button>
                  )}
                </div>
              </div>

              {/* Session Notes */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-3">Session Notes</h4>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {expandedCard.notes}
                  </pre>
                </div>
              </div>

              {/* AI Analysis Details */}
              {expandedCard.analysis && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-500" />
                      AI Analysis
                    </h4>
                  </div>

                  {/* Summary */}
                  {expandedCard.analysis.summary && (
                    <div>
                      <h5 className="font-medium text-foreground mb-2">Summary</h5>
                      <p className="text-muted-foreground leading-relaxed">
                        {expandedCard.analysis.summary}
                      </p>
                    </div>
                  )}

                  {/* Key Themes */}
                  {expandedCard.analysis.themes && expandedCard.analysis.themes.length > 0 && (
                    <div>
                      <h5 className="font-medium text-foreground mb-3">Key Themes</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {expandedCard.analysis.themes.map((theme: string, index: number) => (
                          <div key={index} className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                            <p className="text-sm">{theme}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reflective Prompts */}
                  {expandedCard.analysis.reflectivePrompts && expandedCard.analysis.reflectivePrompts.length > 0 && (
                    <div>
                      <h5 className="font-medium text-foreground mb-3">Reflective Questions</h5>
                      <div className="space-y-3">
                        {expandedCard.analysis.reflectivePrompts.map((prompt: string, index: number) => (
                          <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                              Question {index + 1}:
                            </p>
                            <p className="text-sm text-muted-foreground">{prompt}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Learnings */}
                  {expandedCard.analysis.keyLearnings && expandedCard.analysis.keyLearnings.length > 0 && (
                    <div>
                      <h5 className="font-medium text-foreground mb-3">Key Learnings</h5>
                      <div className="space-y-3">
                        {expandedCard.analysis.keyLearnings.map((learning: string, index: number) => (
                          <div key={index} className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <p className="text-sm">{learning}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deletion Confirmation Dialog */}
      <Dialog open={!!deleteDialogItem} onOpenChange={() => setDeleteDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Delete Analysis
            </DialogTitle>
            <DialogDescription>
              Confirm deletion of AI analysis. Your session hours and notes will remain intact.
            </DialogDescription>
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