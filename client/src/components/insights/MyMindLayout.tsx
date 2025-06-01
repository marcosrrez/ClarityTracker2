import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Sparkles, Search, Plus, Bold, Italic, Type, Paperclip, Edit3, Check, Filter, Tags } from "lucide-react";
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

  // Enhanced MyMind-style search - search across all analysis fields
  const filteredItems = galleryItems.filter(item => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    
    // Search in notes content
    if (item.notes.toLowerCase().includes(query)) return true;
    
    // Search in date
    if (format(new Date(item.dateOfContact), "MMM d, yyyy").toLowerCase().includes(query)) return true;
    
    // Search in AI analysis fields if available
    if (item.analysis) {
      const analysis = item.analysis;
      
      // Search in themes
      if (analysis.themes && Array.isArray(analysis.themes)) {
        if (analysis.themes.some((theme: string) => theme.toLowerCase().includes(query))) return true;
      }
      
      // Search in therapeutic modalities
      if (analysis.therapeuticModalities && Array.isArray(analysis.therapeuticModalities)) {
        if (analysis.therapeuticModalities.some((mod: string) => mod.toLowerCase().includes(query))) return true;
      }
      
      // Search in client presentation
      if (analysis.clientPresentation && Array.isArray(analysis.clientPresentation)) {
        if (analysis.clientPresentation.some((pres: string) => pres.toLowerCase().includes(query))) return true;
      }
      
      // Search in competency areas
      if (analysis.competencyAreas && Array.isArray(analysis.competencyAreas)) {
        if (analysis.competencyAreas.some((comp: string) => comp.toLowerCase().includes(query))) return true;
      }
      
      // Search in emotional content
      if (analysis.emotionalContent && Array.isArray(analysis.emotionalContent)) {
        if (analysis.emotionalContent.some((emo: string) => emo.toLowerCase().includes(query))) return true;
      }
      
      // Search in summary
      if (analysis.summary && analysis.summary.toLowerCase().includes(query)) return true;
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
      
      const newNote: InsertInsightCard = {
        type: "note",
        title: finalTitle,
        content: noteContent,
        tags: ["reflection", "personal-note"],
      };

      await createInsightCard(user.uid, newNote);
      
      // Refresh the gallery if function provided
      if (onRefresh) {
        await onRefresh();
      }
      
      // Reset form
      setNoteContent("");
      setNoteTitle("");
      setShowNoteEditor(false);
      
      toast({
        title: "Note saved",
        description: "Your reflection has been added to your insights.",
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Search Bar & Smart Spaces - MyMind Style */}
      <div className="sticky top-0 z-40 bg-gray-50 dark:bg-gray-900 p-6 pb-20 md:pb-6">
        <div className="space-y-4">
          {/* Main Search Bar */}
          <div className="flex items-center gap-4 max-w-4xl">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search insights & resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-full h-14 text-lg"
              />
            </div>
            <Button 
              variant="outline"
              className="rounded-full w-14 h-14 p-0 border-gray-200 dark:border-gray-700"
              onClick={() => setShowSmartSpaces(!showSmartSpaces)}
            >
              <Filter className="h-5 w-5" />
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 p-0 shadow-lg"
              onClick={() => setShowResourceWidget(true)}
            >
              <Plus className="h-6 w-6" />
            </Button>
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
      <div className="px-4 pb-32">
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
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden h-fit"
                onClick={() => onItemClick(item)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Date and Duration */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span className="truncate">{format(new Date(item.dateOfContact), "MMM d")}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.clientContactHours}h
                      </Badge>
                    </div>

                    {/* Notes Content */}
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {item.notes.length > 120 ? `${item.notes.substring(0, 120)}...` : item.notes}
                    </div>

                    {/* Enhanced AI Analysis Tags - MyMind Style */}
                    {item.analysis && (
                      <div className="space-y-2">
                        {/* Therapeutic Modalities */}
                        {item.analysis.therapeuticModalities && Array.isArray(item.analysis.therapeuticModalities) && item.analysis.therapeuticModalities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.analysis.therapeuticModalities.slice(0, 2).map((mod: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {mod}
                              </Badge>
                            ))}
                            {item.analysis.therapeuticModalities.length > 2 && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                +{item.analysis.therapeuticModalities.length - 2} modalities
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {/* Client Presentation */}
                        {item.analysis.clientPresentation && Array.isArray(item.analysis.clientPresentation) && item.analysis.clientPresentation.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.analysis.clientPresentation.slice(0, 2).map((pres: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                {pres}
                              </Badge>
                            ))}
                            {item.analysis.clientPresentation.length > 2 && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                +{item.analysis.clientPresentation.length - 2} presentations
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {/* Competency Areas */}
                        {item.analysis.competencyAreas && Array.isArray(item.analysis.competencyAreas) && item.analysis.competencyAreas.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.analysis.competencyAreas.slice(0, 1).map((comp: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                {comp}
                              </Badge>
                            ))}
                            {item.analysis.competencyAreas.length > 1 && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                +{item.analysis.competencyAreas.length - 1} competencies
                              </Badge>
                            )}
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

      {/* Unified Bottom Navigation Panel - Replit Style */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="bg-gradient-to-t from-white to-transparent dark:from-gray-900 dark:to-transparent pt-6 pb-2">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-2">
              <div className="flex items-center justify-center gap-1">
                {/* Add Note Button */}
                <button
                  onClick={() => {
                    setShowNoteEditor(true);
                    setNoteContent("");
                    setNoteTitle("");
                    setIsHeaderVisible(true);
                  }}
                  className="flex-1 flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Add Note</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Start writing...</div>
                  </div>
                </button>

                {/* Separator */}
                <div className="w-px h-12 bg-gray-200 dark:bg-gray-600 mx-1"></div>

                {/* AI Agent Button */}
                <button
                  onClick={() => setShowAIAgent(true)}
                  className="flex-1 flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {/* Custom ClarityLog AI Icon */}
                    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">AI Agent</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Ask anything...</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Note Editor Modal - MyMind Style */}
      <Dialog open={showNoteEditor} onOpenChange={setShowNoteEditor}>
        <DialogContent className="max-w-none w-full h-full p-0 gap-0 bg-gray-50 dark:bg-gray-900" aria-describedby="note-editor-description">
          <DialogTitle className="sr-only">Create New Note</DialogTitle>
          <div className="flex flex-col h-full">
            {/* Header - hides on scroll */}
            <div className={`transition-all duration-300 ${isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full absolute'}`}>
              <div className="bg-gray-200 dark:bg-gray-800 px-6 py-4 text-center">
                <h2 className="text-lg font-medium text-gray-600 dark:text-gray-300">Create a new note</h2>
              </div>
            </div>

            {/* Content Area */}
            <div 
              className="flex-1 p-8 overflow-y-auto"
              onScroll={(e) => {
                const scrollTop = e.currentTarget.scrollTop;
                setIsHeaderVisible(scrollTop < 50);
              }}
            >
              <div className="max-w-4xl mx-auto">
                {/* Note Header */}
                <div className="mb-8">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">ADD A NEW NOTE</p>
                  <Input
                    placeholder="Start typing here..."
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="text-lg font-medium border-none bg-transparent p-0 focus-visible:ring-0 placeholder:text-gray-400"
                    autoFocus
                  />
                </div>

                {/* Note Content */}
                <div className="min-h-[500px]">
                  <Textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write your thoughts, insights, or reflections here..."
                    className="min-h-[500px] border-none bg-transparent resize-none focus-visible:ring-0 text-base leading-relaxed p-0"
                  />
                </div>
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