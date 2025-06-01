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
  const [selectedCardIndex, setSelectedCardIndex] = useState<number[]>([]);
  const [expandedCard, setExpandedCard] = useState<GalleryItem | null>(null);
  const [deleteDialogItem, setDeleteDialogItem] = useState<GalleryItem | null>(null);
  const [dragState, setDragState] = useState<{ weekIndex: number; startX: number; currentX: number } | null>(null);
  const [showScrollGuide, setShowScrollGuide] = useState<{[key: string]: boolean}>({});
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

  // Create streaming-style card rows with better grouping
  const createCardRows = (items: GalleryItem[]): WeekDeck[] => {
    if (items.length === 0) return [];

    // Sort items by date (newest first)
    const sortedItems = items.sort((a, b) => new Date(b.dateOfContact).getTime() - new Date(a.dateOfContact).getTime());
    
    // Group items by time periods with minimum group sizes
    const timeGroups: Map<string, GalleryItem[]> = new Map();
    
    sortedItems.forEach(item => {
      const itemDate = new Date(item.dateOfContact);
      const now = new Date();
      
      // This week gets priority
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      if (itemDate >= weekStart && itemDate <= weekEnd) {
        if (!timeGroups.has("1-this-week")) {
          timeGroups.set("1-this-week", []);
        }
        timeGroups.get("1-this-week")!.push(item);
        return;
      }

      // Group by month for better consolidation
      const monthKey = format(itemDate, "yyyy-MM");
      const monthName = format(itemDate, "MMMM yyyy");
      
      // Calculate how recent this month is
      const monthsAgo = (now.getFullYear() - itemDate.getFullYear()) * 12 + (now.getMonth() - itemDate.getMonth());
      
      let sortKey: string;
      if (monthsAgo === 0) {
        sortKey = "2-this-month";
      } else if (monthsAgo === 1) {
        sortKey = "3-last-month";
      } else {
        sortKey = `${monthsAgo + 10}-${monthKey}`;
      }
      
      if (!timeGroups.has(sortKey)) {
        timeGroups.set(sortKey, []);
      }
      timeGroups.get(sortKey)!.push(item);
    });

    // Post-process to merge small groups
    const finalGroups: Map<string, GalleryItem[]> = new Map();
    const minGroupSize = 2;
    
    const timeGroupEntries = Array.from(timeGroups.entries()).sort(([a], [b]) => a.localeCompare(b));
    
    for (const [sortKey, groupItems] of timeGroupEntries) {
      if (sortKey === "1-this-week") {
        // Always keep "This Week" separate
        finalGroups.set(sortKey, groupItems);
      } else if (groupItems.length >= minGroupSize) {
        finalGroups.set(sortKey, groupItems);
      } else {
        // Merge small groups with the next closest time period
        const nextKey = timeGroupEntries.find(([key, items]) => 
          key > sortKey && items.length >= minGroupSize
        );
        
        if (nextKey) {
          if (!finalGroups.has(nextKey[0])) {
            finalGroups.set(nextKey[0], [...nextKey[1]]);
          }
          finalGroups.get(nextKey[0])!.push(...groupItems);
        } else {
          // If no suitable group found, create a "Previous Sessions" group
          if (!finalGroups.has("99-previous-sessions")) {
            finalGroups.set("99-previous-sessions", []);
          }
          finalGroups.get("99-previous-sessions")!.push(...groupItems);
        }
      }
    }

    // Convert to display format and sort by sort key to maintain proper order
    const finalGroupEntries = Array.from(finalGroups.entries()).sort(([a], [b]) => a.localeCompare(b));
    
    const cardRows = finalGroupEntries.map(([sortKey, rowItems]) => {
      const firstItem = rowItems[0];
      const weekStart = startOfWeek(new Date(firstItem.dateOfContact), { weekStartsOn: 1 });
      
      let label: string;
      if (sortKey === "1-this-week") {
        label = "This Week";
      } else if (sortKey === "2-this-month") {
        label = "This Month";
      } else if (sortKey === "3-last-month") {
        label = "Last Month";
      } else if (sortKey === "99-previous-sessions") {
        label = "Previous Sessions";
      } else {
        // Extract month name from sort key
        const monthMatch = sortKey.match(/\d{4}-\d{2}/);
        if (monthMatch) {
          label = format(new Date(monthMatch[0] + "-01"), "MMMM yyyy");
        } else {
          label = "Previous Sessions";
        }
      }
      
      return {
        label,
        items: rowItems.sort((a, b) => new Date(b.dateOfContact).getTime() - new Date(a.dateOfContact).getTime()),
        weekNumber: parseInt(format(weekStart, "w")),
        startDate: weekStart,
        endDate: endOfWeek(weekStart, { weekStartsOn: 1 })
      };
    });

    return cardRows;
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
      
      // Note: Swipe functionality replaced with horizontal scrolling
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
    // Only show entries with substantial content (10+ words) or existing analysis
    const noteWords = item.notes.trim().split(/\s+/).filter(word => word.length > 0);
    const hasSubstantialContent = noteWords.length >= 10;
    const hasAnalysis = !!item.analysis;
    
    if (!hasAnalysis && !hasSubstantialContent) {
      return false; // Skip brief entries without analysis
    }

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

  // Create streaming-style card rows from filtered items
  const cardRows = createCardRows(filteredItems);
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
    setSelectedCardIndex([]);
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
      {cardRows.length > 0 && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Your Session Insights</h2>
          <p className="text-sm text-muted-foreground mt-1">Scroll horizontally through each time period • {filteredItems.length} sessions available</p>
        </div>
      )}

      {/* Disney+ Style Card Rows */}
      {cardRows.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Session Insights Yet</h3>
          <p className="text-muted-foreground">
            Your session insights will appear here organized by time period, just like your favorite streaming service.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {cardRows.map((row: WeekDeck, rowIndex: number) => (
            <div key={rowIndex} className="space-y-4">
              {/* Row Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">{row.label}</h3>
                <Badge variant="outline" className="text-xs">
                  {row.items.length} session{row.items.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {/* Horizontal Scrolling Cards */}
              <div className="relative">
                <div 
                  className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
                  style={{ 
                    scrollSnapType: 'x mandatory',
                    scrollBehavior: 'auto' // Slower, more controlled scrolling
                  }}
                  onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    const rowKey = `row-${rowIndex}`;
                    
                    // Show scroll guide when scrolling
                    setShowScrollGuide(prev => ({ ...prev, [rowKey]: true }));
                    
                    // Hide it after scrolling stops
                    clearTimeout((window as any)[`scrollTimeout-${rowKey}`]);
                    (window as any)[`scrollTimeout-${rowKey}`] = setTimeout(() => {
                      setShowScrollGuide(prev => ({ ...prev, [rowKey]: false }));
                    }, 1500);
                  }}
                >
                  {row.items.map((item: GalleryItem, cardIndex: number) => (
                    <div
                      key={item.id}
                      className="flex-shrink-0 w-72" // Smaller cards to show ~3 horizontally
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      <Card 
                        className="group cursor-pointer hover:shadow-lg transition-all duration-500 hover:scale-[1.02] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 h-full"
                        onClick={() => setExpandedCard(item)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-medium">
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
                            {item.analysis && (
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

                        <CardContent className="space-y-3">
                          {/* Inviting Summary */}
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-lg">
                            <p className="text-xs text-blue-900 dark:text-blue-100 font-medium leading-relaxed line-clamp-2">
                              {generateInvitingSummary(item)}
                            </p>
                          </div>

                          {/* Key Themes */}
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

                          {/* Session Notes Preview */}
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {item.notes.substring(0, 100)}
                            {item.notes.length > 100 && "..."}
                          </div>

                          {/* Click to expand hint */}
                          <div className="flex items-center justify-center pt-2 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-300">
                              <Eye className="h-3 w-3" />
                              <span className="text-xs font-medium">View details</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
                
                {/* Conditional Scroll Guide - only shows during scrolling */}
                {showScrollGuide[`row-${rowIndex}`] && row.items.length > 3 && (
                  <div className="absolute bottom-2 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded-full transition-opacity duration-300">
                    ← Scroll for more →
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Card Details Dialog - Beautiful Card Design */}
      <Dialog open={!!expandedCard} onOpenChange={() => setExpandedCard(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0">
          {expandedCard && (
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden">
              {/* Beautiful Card Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {format(new Date(expandedCard.dateOfContact), "EEEE, MMM d")}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-blue-100">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{expandedCard.clientContactHours} hours</span>
                      </div>
                      <span className="text-sm">
                        {format(new Date(expandedCard.dateOfContact), "yyyy")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {expandedCard.analysis && (
                      <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4" />
                          <span className="text-sm font-medium">AI Analyzed</span>
                        </div>
                      </div>
                    )}
                    {expandedCard.analysis && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleteDialogItem(expandedCard);
                          setExpandedCard(null);
                        }}
                        className="text-white/80 hover:text-white hover:bg-white/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Content Body */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Insight Highlight */}
                {expandedCard.analysis && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Session Insight
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                      {generateInvitingSummary(expandedCard)}
                    </p>
                  </div>
                )}

                {/* Comprehensive Analysis Grid */}
                {expandedCard.analysis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Key Themes */}
                    {expandedCard.analysis.themes && (
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Key Themes
                        </h4>
                        <div className="space-y-2">
                          {(() => {
                            const themes = Array.isArray(expandedCard.analysis.themes) 
                              ? expandedCard.analysis.themes 
                              : typeof expandedCard.analysis.themes === 'object'
                                ? Object.values(expandedCard.analysis.themes)
                                : [expandedCard.analysis.themes];
                            
                            return themes.slice(0, 4).map((theme: any, index: number) => (
                              <div key={index} className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-xs">
                                {String(theme)}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Growth Areas */}
                    {expandedCard.analysis.competencyGaps && (
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          Growth Areas
                        </h4>
                        <div className="space-y-2">
                          {(() => {
                            const gaps = Array.isArray(expandedCard.analysis.competencyGaps) 
                              ? expandedCard.analysis.competencyGaps 
                              : typeof expandedCard.analysis.competencyGaps === 'object'
                                ? Object.values(expandedCard.analysis.competencyGaps)
                                : [expandedCard.analysis.competencyGaps];
                            
                            return gaps.slice(0, 3).map((gap: any, index: number) => (
                              <div key={index} className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-xs">
                                {String(gap)}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Strengths */}
                    {expandedCard.analysis.strengths && (
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Strengths
                        </h4>
                        <div className="space-y-2">
                          {(() => {
                            const strengths = Array.isArray(expandedCard.analysis.strengths) 
                              ? expandedCard.analysis.strengths 
                              : typeof expandedCard.analysis.strengths === 'object'
                                ? Object.values(expandedCard.analysis.strengths)
                                : [expandedCard.analysis.strengths];
                            
                            return strengths.slice(0, 3).map((strength: any, index: number) => (
                              <div key={index} className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-xs">
                                {String(strength)}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Key Learnings */}
                    {expandedCard.analysis.keyLearnings && (
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Key Learnings
                        </h4>
                        <div className="space-y-2">
                          {(() => {
                            const learnings = Array.isArray(expandedCard.analysis.keyLearnings) 
                              ? expandedCard.analysis.keyLearnings 
                              : typeof expandedCard.analysis.keyLearnings === 'object'
                                ? Object.values(expandedCard.analysis.keyLearnings)
                                : [expandedCard.analysis.keyLearnings];
                            
                            return learnings.slice(0, 3).map((learning: any, index: number) => (
                              <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-xs">
                                {String(learning)}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Session Notes */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    Your Session Notes
                  </h4>
                  <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    {expandedCard.notes || "No detailed notes recorded for this session."}
                  </div>
                </div>

                {/* Reflective Prompts */}
                {expandedCard.analysis?.reflectivePrompts && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-5 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      Reflection Questions
                    </h4>
                    <div className="space-y-3">
                      {(() => {
                        const prompts = Array.isArray(expandedCard.analysis.reflectivePrompts) 
                          ? expandedCard.analysis.reflectivePrompts 
                          : typeof expandedCard.analysis.reflectivePrompts === 'object'
                            ? Object.values(expandedCard.analysis.reflectivePrompts)
                            : [expandedCard.analysis.reflectivePrompts];
                        
                        return prompts.slice(0, 2).map((prompt: any, index: number) => (
                          <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border-l-4 border-amber-400 shadow-sm">
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
                              Question {index + 1}:
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{String(prompt)}</p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {expandedCard.analysis ? 'Complete AI analysis available' : 'Ready for AI analysis'}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setExpandedCard(null)}
                    className="text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
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