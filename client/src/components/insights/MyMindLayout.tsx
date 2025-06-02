import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Sparkles, Search, Plus, Bold, Italic, Type, Paperclip, Edit3, Check, Filter, Tags, Upload } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { createInsightCard } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { ResourceWidget } from "./ResourceWidget";
import { AIAgentWidget } from "./AIAgentWidget";
import type { InsertInsightCard } from "@shared/schema";

interface GalleryItem {
  id: string;
  dateOfContact: Date;
  clientContactHours: number;
  notes: string;
  analysis?: any;
}

interface MyMindLayoutProps {
  galleryItems: GalleryItem[];
  onItemClick: (item: GalleryItem) => void;
  onRefresh?: () => void;
}

// Clean markdown and formatting for better readability
const cleanText = (text: string): string => {
  if (!text) return "";
  
  return text
    // Remove markdown bold formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove markdown italic formatting
    .replace(/\*(.*?)\*/g, '$1')
    // Clean up conversation markers
    .replace(/\*\*You:\*\*/g, 'You:')
    .replace(/\*\*Assistant:\*\*/g, 'Assistant:')
    // Remove extra asterisks
    .replace(/\*/g, '')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
};

export function MyMindLayout({ galleryItems, onItemClick, onRefresh }: MyMindLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSmartSpace, setSelectedSmartSpace] = useState<string>("all");
  const [showSmartSpaces, setShowSmartSpaces] = useState(false);
  const [showResourceWidget, setShowResourceWidget] = useState(false);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isProcessingSmartSearch, setIsProcessingSmartSearch] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Handle scroll to hide/show bottom navigation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = scrollContainerRef.current?.scrollTop || 0;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setShowBottomNav(false);
      } else {
        // Scrolling up or at top
        setShowBottomNav(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    const scrollElement = scrollContainerRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY]);

  // Smart search functionality for URLs and content
  const handleSmartSearch = async (query: string) => {
    if (!user || !query.trim()) return;

    // Check if it's a URL
    const urlPattern = /^(https?:\/\/[^\s]+)/i;
    const isUrl = urlPattern.test(query.trim());

    // Check if it's a large content paste (more than 100 characters)
    const isLargeContent = query.length > 100;

    if (isUrl || isLargeContent) {
      setIsProcessingSmartSearch(true);
      
      try {
        let content = query;
        let title = "Smart Search Entry";
        
        if (isUrl) {
          // For URL scraping, we'd need to add a backend endpoint
          title = `Web Content: ${query}`;
          content = `URL: ${query}\n\nNote: URL content scraping feature coming soon.`;
        } else {
          title = `Pasted Content - ${new Date().toLocaleDateString()}`;
        }

        const newCard: InsertInsightCard = {
          type: 'note',
          title,
          content,
          tags: ['smart-search', isUrl ? 'url-content' : 'pasted-content'],
        };

        await createInsightCard(user.uid, newCard);
        
        if (onRefresh) {
          await onRefresh();
        }

        setSearchQuery("");
        
        toast({
          title: "Content Added",
          description: isUrl ? "URL saved as insight card" : "Content saved as insight card",
        });
        
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save content",
          variant: "destructive",
        });
      } finally {
        setIsProcessingSmartSearch(false);
      }
    }
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSmartSearch(searchQuery);
    }
  };

  // Super smart search - incredibly easy and intuitive
  const filteredItems = galleryItems.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    // Search in notes content - exact and partial matches
    const notesText = cleanText(item.notes).toLowerCase();
    if (notesText.includes(query)) return true;
    
    // Enhanced date search - multiple formats
    const itemDate = new Date(item.dateOfContact);
    const dateFormats = [
      format(itemDate, "MMMM").toLowerCase(), // "June"
      format(itemDate, "MMM").toLowerCase(),  // "Jun"  
      format(itemDate, "MMMM yyyy").toLowerCase(), // "June 2024"
      format(itemDate, "MMM yyyy").toLowerCase(),  // "Jun 2024"
      format(itemDate, "MMMM d").toLowerCase(),    // "June 15"
      format(itemDate, "MMM d").toLowerCase(),     // "Jun 15"
      format(itemDate, "MMMM d, yyyy").toLowerCase(), // "June 15, 2024"
      format(itemDate, "MMM d, yyyy").toLowerCase(),  // "Jun 15, 2024"
      format(itemDate, "yyyy").toLowerCase(),      // "2024"
      format(itemDate, "M/d/yyyy").toLowerCase(),  // "6/15/2024"
      format(itemDate, "M-d-yyyy").toLowerCase(),  // "6-15-2024"
    ];
    
    if (dateFormats.some(dateStr => dateStr.includes(query))) return true;
    
    // Search by session duration
    const hourStr = `${item.clientContactHours}h`;
    const hoursStr = `${item.clientContactHours} hour`;
    if (hourStr.includes(query) || hoursStr.includes(query)) return true;
    
    // Word-based search in all content
    const queryWords = query.split(' ').filter(word => word.length > 2);
    const allContent = [
      notesText,
      ...dateFormats,
      hourStr,
      hoursStr
    ].join(' ');
    
    if (queryWords.length > 0 && queryWords.every(word => allContent.includes(word))) return true;
    
    // Search in AI analysis fields if available
    if (item.analysis) {
      const analysis = item.analysis;
      const analysisContent = [];
      
      // Collect all analysis text
      if (analysis.summary) analysisContent.push(cleanText(analysis.summary).toLowerCase());
      if (analysis.themes) analysisContent.push(...analysis.themes.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.therapeuticModalities) analysisContent.push(...analysis.therapeuticModalities.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.clientPresentation) analysisContent.push(...analysis.clientPresentation.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.competencyAreas) analysisContent.push(...analysis.competencyAreas.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.emotionalContent) analysisContent.push(...analysis.emotionalContent.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.keyLearnings) analysisContent.push(...analysis.keyLearnings.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.reflectivePrompts) analysisContent.push(...analysis.reflectivePrompts.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.supervisionTopics) analysisContent.push(...analysis.supervisionTopics.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.professionalGrowthAreas) analysisContent.push(...analysis.professionalGrowthAreas.map((t: string) => cleanText(t).toLowerCase()));
      
      const analysisText = analysisContent.join(' ');
      
      // Direct search in analysis content
      if (analysisText.includes(query)) return true;
      
      // Word-based search in analysis
      if (queryWords.length > 0 && queryWords.every(word => analysisText.includes(word))) return true;
    }
    
    return false;
  });

  // Group items by time period for Disney-style browsing
  const getTimeGroupedItems = () => {
    const now = new Date();
    const thisWeek = [];
    const thisMonth = [];
    const earlier = [];

    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const item of filteredItems) {
      const itemDate = new Date(item.dateOfContact);
      
      if (itemDate >= startOfThisWeek) {
        thisWeek.push(item);
      } else if (itemDate >= startOfThisMonth) {
        thisMonth.push(item);
      } else {
        earlier.push(item);
      }
    }

    const groups = [];
    if (thisWeek.length > 0) {
      groups.push({ label: "This Week", items: thisWeek });
    }
    if (thisMonth.length > 0) {
      groups.push({ label: "This Month", items: thisMonth });
    }
    if (earlier.length > 0) {
      groups.push({ label: "Earlier", items: earlier });
    }

    return groups;
  };

  // Save note functionality
  const handleSaveNote = async () => {
    if (!user || !noteContent.trim()) return;

    try {
      setIsSaving(true);
      
      const finalTitle = noteTitle || (noteContent.split('\n')[0] || "Untitled Note");
      
      // Check if note meets minimum length for AI analysis
      const wordCount = noteContent.trim().split(/\s+/).length;
      let analysisData = null;
      
      if (wordCount >= 10) {
        try {
          // Import AI analysis function
          const { analyzeSessionNotes } = await import("@/lib/ai");
          analysisData = await analyzeSessionNotes(noteContent);
        } catch (aiError) {
          console.log("AI analysis skipped for note:", aiError);
          // Continue saving note even if AI analysis fails
        }
      }
      
      const newNote: InsertInsightCard = {
        type: "note",
        title: finalTitle,
        content: noteContent,
        tags: analysisData ? 
          ["reflection", "personal-note", "ai-analyzed", ...analysisData.themes.slice(0, 3)] : 
          ["reflection", "personal-note"],
      };

      await createInsightCard(user.uid, newNote);
      
      // If AI analysis was successful, also create a log entry for pattern tracking
      if (analysisData && wordCount >= 10) {
        try {
          const { createLogEntry, createAiAnalysis } = await import("@/lib/firestore");
          
          const logEntry = {
            dateOfContact: new Date(),
            clientContactHours: 0,
            indirectHours: false,
            supervisionHours: 0,
            supervisionType: "none" as const,
            techAssistedSupervision: false,
            professionalDevelopmentHours: 0,
            professionalDevelopmentType: "none" as const,
            notes: noteContent
          };

          const logEntryId = await createLogEntry(user.uid, logEntry);

          const aiAnalysisEntry = {
            logEntryId: logEntryId,
            summary: analysisData.summary,
            themes: analysisData.themes,
            potentialBlindSpots: analysisData.potentialBlindSpots || [],
            reflectivePrompts: analysisData.reflectivePrompts,
            keyLearnings: analysisData.keyLearnings || [],
            ccsrCategory: analysisData.ccsrCategory || "Personal Reflection",
            originalNotesSnapshot: noteContent
          };

          await createAiAnalysis(user.uid, aiAnalysisEntry);
        } catch (logError) {
          console.log("Log entry creation skipped:", logError);
          // Note is still saved as insight card
        }
      }
      
      // Refresh the gallery if function provided
      if (onRefresh) {
        await onRefresh();
      }
      
      // Reset form
      setNoteContent("");
      setNoteTitle("");
      setShowNoteEditor(false);
      
      toast({
        title: analysisData ? "Note analyzed and saved" : "Note saved",
        description: analysisData ? 
          "Your reflection has been analyzed and added to your insights for growth tracking." :
          "Your reflection has been added to your insights.",
      });
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error saving note",
        description: "Failed to save your note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Search Bar & Smart Spaces - Auto-hide on scroll */}
      <div className={`bg-gray-50 dark:bg-gray-900 p-4 pt-1 flex-shrink-0 transition-transform duration-300 ${showBottomNav ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="space-y-4">
          {/* Main Search Bar */}
          <div className="flex items-center gap-3 max-w-5xl">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search insights, paste content, or add URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                disabled={isProcessingSmartSearch}
                className="pl-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-full h-12 text-base"
              />
              {isProcessingSmartSearch && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button 
              className="w-8 h-8 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200/30 dark:border-gray-700/30 flex items-center justify-center hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={() => setShowSmartSpaces(!showSmartSpaces)}
            >
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button 
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-colors"
              onClick={() => setShowResourceWidget(true)}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Smart Spaces - Auto-Organization Categories */}
          {showSmartSpaces && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Tags className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Smart Spaces</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedSmartSpace === "all" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setSelectedSmartSpace("all")}
                >
                  All Sessions
                </Button>
                <Button
                  variant={selectedSmartSpace === "anxiety-treatment" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setSelectedSmartSpace("anxiety-treatment")}
                >
                  Anxiety Treatment
                </Button>
                <Button
                  variant={selectedSmartSpace === "trauma-work" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setSelectedSmartSpace("trauma-work")}
                >
                  Trauma Work
                </Button>
                <Button
                  variant={selectedSmartSpace === "cbt-sessions" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setSelectedSmartSpace("cbt-sessions")}
                >
                  CBT Sessions
                </Button>
                <Button
                  variant={selectedSmartSpace === "crisis-intervention" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setSelectedSmartSpace("crisis-intervention")}
                >
                  Crisis Intervention
                </Button>
                <Button
                  variant={selectedSmartSpace === "supervision-prep" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setSelectedSmartSpace("supervision-prep")}
                >
                  Supervision Prep
                </Button>
                <Button
                  variant={selectedSmartSpace === "challenging-cases" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setSelectedSmartSpace("challenging-cases")}
                >
                  Challenging Cases
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Masonry Grid Layout - MyMind Style for Maximum Cards */}
      <div 
        ref={scrollContainerRef}
        className={`flex-1 px-4 pb-20 overflow-y-auto scrollbar-hide ${showBottomNav ? 'pt-0' : '-mt-16 pt-16'}`}
      >
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Session Insights Yet</h3>
            <p className="text-muted-foreground">
              Your session insights will appear here as you add notes and analyses.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <Card 
                key={item.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white dark:bg-gray-800 border-0 rounded-2xl overflow-hidden h-fit shadow-sm"
                onClick={() => onItemClick(item)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Date and Duration - Minimal */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 tracking-wide">
                        {format(new Date(item.dateOfContact), "MMM d")}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {item.clientContactHours}h
                      </span>
                    </div>

                    {/* Notes Content - Premium Typography */}
                    <div 
                      className="text-gray-800 dark:text-gray-200 leading-relaxed"
                      style={{ 
                        fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                        fontSize: '0.9rem',
                        lineHeight: '1.6',
                        letterSpacing: '0.01em'
                      }}
                    >
                      {(() => {
                        const cleanedText = cleanText(item.notes);
                        return cleanedText.length > 100 ? `${cleanedText.substring(0, 100)}...` : cleanedText;
                      })()}
                    </div>

                    {/* Elegant Insights Preview */}
                    {item.analysis && (
                      <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        {/* Primary Themes - Clean and Minimal */}
                        {item.analysis.themes && Array.isArray(item.analysis.themes) && item.analysis.themes.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.analysis.themes.slice(0, 2).map((theme: string, index: number) => (
                              <span 
                                key={index} 
                                className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                              >
                                {theme}
                              </span>
                            ))}
                            {item.analysis.themes.length > 2 && (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
                                +{item.analysis.themes.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Key Learning Indicator */}
                        {item.analysis.keyLearnings && Array.isArray(item.analysis.keyLearnings) && item.analysis.keyLearnings.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                            <span className="font-medium">{item.analysis.keyLearnings.length} insight{item.analysis.keyLearnings.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        
                        {/* Fallback to themes if new fields not available */}
                        {(!item.analysis.therapeuticModalities && !item.analysis.clientPresentation && !item.analysis.competencyAreas) && 
                         item.analysis.themes && Array.isArray(item.analysis.themes) && (
                          <div className="flex flex-wrap gap-1">
                            {item.analysis.themes.slice(0, 2).map((theme: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {theme}
                              </Badge>
                            ))}
                            {item.analysis.themes.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.analysis.themes.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Badge */}
                    {item.analysis && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Sparkles className="h-3 w-3" />
                        <span>AI Analysis</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Compact Bottom Navigation Panel - Replit Style */}
      <div className={`fixed bottom-0 left-0 right-0 z-30 transition-all duration-300 ${showBottomNav ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="bg-gradient-to-t from-gray-50/90 to-transparent dark:from-gray-900/90 dark:to-transparent pt-2 pb-2">
          <div className="max-w-xs mx-auto px-3">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full border border-gray-200/30 dark:border-gray-700/30 shadow-lg px-3 py-1">
              <div className="flex items-center justify-center gap-0">
                {/* Add Note Button */}
                <button
                  onClick={() => {
                    setShowNoteEditor(true);
                    setNoteContent("");
                    setNoteTitle("");
                    setIsHeaderVisible(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center group-hover:bg-blue-500/20 dark:group-hover:bg-blue-400/20 transition-colors">
                    <Plus className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Add Note</span>
                </button>

                {/* AI Agent Button */}
                <button
                  onClick={() => setShowAIAgent(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <div className="w-6 h-6 rounded-full bg-purple-500/10 dark:bg-purple-400/10 flex items-center justify-center group-hover:bg-purple-500/20 dark:group-hover:bg-purple-400/20 transition-colors">
                    <svg className="h-3 w-3 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">AI Agent</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Mode Note Editor - MyMind Style */}
      <Dialog open={showNoteEditor} onOpenChange={setShowNoteEditor}>
        <DialogContent className="max-w-none w-full h-full p-0 gap-0 bg-white dark:bg-gray-900" aria-describedby="note-editor-description">
          <DialogTitle className="sr-only">Create New Note</DialogTitle>
          <div className="flex flex-col h-full">
            {/* Content Area */}
            <div 
              className="flex-1 p-12 overflow-y-auto"
              onScroll={(e) => {
                const scrollTop = e.currentTarget.scrollTop;
                setIsHeaderVisible(scrollTop < 50);
              }}
            >
              <div className="max-w-2xl mx-auto pt-20">
                {/* Note Title - Borderless and Free */}
                <input
                  type="text"
                  placeholder="Type your headline here."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  autoFocus
                  className="w-full text-5xl font-light bg-transparent border-none outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 text-gray-800 dark:text-gray-200 mb-4"
                  style={{ 
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: '300'
                  }}
                />
                
                {/* Note Content - Premium Writing Experience */}
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Start writing right here...

💡PRO TIP: You can use markdown! Try **bold**, *italic*, # headings, - lists, and more. Write naturally and let your thoughts flow."
                  className="w-full min-h-[700px] bg-transparent border-none outline-none resize-none text-gray-800 dark:text-gray-200 text-xl leading-loose tracking-wide placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  style={{ 
                    fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", "Droid Serif", Times, "Source Serif Pro", serif',
                    lineHeight: '1.75',
                    fontWeight: '400',
                    letterSpacing: '0.015em',
                    textRendering: 'optimizeLegibility',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale'
                  }}
                  autoFocus={!noteTitle}
                />
              </div>
            </div>

            {/* Floating Toolbar */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-full px-4 py-2 flex items-center gap-4 border border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" className="p-2 h-auto">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 h-auto">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 h-auto">
                  <Type className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 h-auto">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 h-auto">
                  <Edit3 className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-600"></div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 h-auto text-green-600 hover:text-green-700 disabled:opacity-50"
                  onClick={handleSaveNote}
                  disabled={isSaving || !noteContent.trim()}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Floating Add Button - appears when header is hidden */}
            {!isHeaderVisible && (
              <div className="absolute top-6 right-6">
                <Button 
                  className="rounded-full w-12 h-12 bg-orange-500 hover:bg-orange-600 shadow-lg"
                  onClick={() => {
                    setShowNoteEditor(false);
                    setTimeout(() => setShowNoteEditor(true), 100);
                  }}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Resource Widget */}
      <ResourceWidget 
        open={showResourceWidget}
        onOpenChange={setShowResourceWidget}
        onResourceAdded={onRefresh}
      />

      {/* AI Agent Widget */}
      <AIAgentWidget 
        open={showAIAgent}
        onOpenChange={setShowAIAgent}
        onResourceAdded={onRefresh}
      />
    </div>
  );
}