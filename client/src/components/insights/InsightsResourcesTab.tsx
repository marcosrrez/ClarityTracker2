import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import { 
  Globe, 
  Plus, 
  FileText, 
  Search, 
  Download, 
  Calendar,
  Tag,
  Eye,
  EyeOff,
  ExternalLink 
} from "lucide-react";
import { format } from "date-fns";
import { useInsightCards } from "@/hooks/use-firestore";
import { marked } from "marked";
import { createInsightCard, deleteInsightCard, updateInsightCard } from "@/lib/firestore";
import { summarizeWebContent } from "@/lib/ai";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { InsightCard, InsertInsightCard } from "@shared/schema";

const urlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

type UrlFormData = z.infer<typeof urlSchema>;

export const InsightsResourcesTab = () => {
  const { user } = useAuth();
  const { cards, loading, refetch } = useInsightCards();
  const { toast } = useToast();
  
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "note" | "articleSummary">("all");
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
  });

  // Bear-style auto-save functionality
  useEffect(() => {
    if (!editingCard || !editingContent) return;

    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // Set new auto-save timer (2 seconds after typing stops)
    const timer = setTimeout(async () => {
      if (editingCard && editingContent.trim()) {
        try {
          const finalTitle = editingTitle || (editingContent.split('\n')[0] || "Untitled Note");
          await updateInsightCard(user?.uid || "", editingCard, {
            title: finalTitle,
            content: editingContent,
          });
          setLastSaved(new Date());
          await refetch();
        } catch (error) {
          console.error("Auto-save failed:", error);
        }
      }
    }, 2000);

    setAutoSaveTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [editingContent, editingTitle, editingCard, user?.uid]);

  // Bear-style keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullScreen) return;

      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (editingCard) handleSaveCard(editingCard);
      }

      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, editingCard]);

  const onSummarizeUrl = async (data: UrlFormData) => {
    if (!user) return;

    try {
      setIsSummarizing(true);
      
      // Get the page title from URL for better UX
      let title = data.url;
      try {
        const urlObj = new URL(data.url);
        title = urlObj.hostname.replace('www.', '');
      } catch (e) {
        // Use URL as-is if parsing fails
      }
      
      // Use the actual Google AI web summarization
      const summary = await summarizeWebContent(data.url);
      
      const summaryCard: InsertInsightCard = {
        type: "articleSummary",
        title: `Article from ${title}`,
        content: summary,
        tags: ["web-content", "summary", "professional-development"],
        originalUrl: data.url,
      };

      await createInsightCard(user.uid, summaryCard);
      await refetch();
      
      toast({
        title: "Article summarized successfully",
        description: "The web content has been analyzed and saved to your insights.",
      });
      
      reset();
    } catch (error) {
      console.error("Error summarizing URL:", error);
      
      // Smart fallback: offer manual content paste
      const shouldTryManual = confirm(
        "Website blocked automatic access. Would you like to paste the article content manually? This will still provide the same AI analysis."
      );
      
      if (shouldTryManual) {
        setShowManualInput(true);
        setManualUrl(data.url);
      } else {
        toast({
          title: "Content capture failed",
          description: "Website blocked access. Try copying the content manually.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSummarizing(false);
    }
  };



  // Helper function to extract title from content or generate one
  const getCardTitle = (card: InsightCard): string => {
    if (card.title && card.title !== "New Reflection") {
      return card.title;
    }
    const plainContent = card.content.replace(/<[^>]*>/g, "").trim();
    if (plainContent.length === 0) return "Untitled Note";
    
    // Extract first line or first 50 characters as title
    const firstLine = plainContent.split('\n')[0];
    return firstLine.length > 50 ? firstLine.substring(0, 47) + "..." : firstLine;
  };

  // Convert markdown to HTML using marked library
  const formatMarkdown = (content: string): string => {
    if (!content) return '<p class="text-muted-foreground italic">Start writing...</p>';
    
    try {
      // Configure marked for safe rendering
      marked.setOptions({
        breaks: true,
        gfm: true,
      });
      
      return marked(content) as string;
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return content.replace(/\n/g, '<br>');
    }
  };

  // Live markdown transformation as you type (Bear-style)
  const processLiveMarkdown = (text: string, cursorPos: number): { html: string; newCursorPos: number } => {
    const lines = text.split('\n');
    let processedLines: string[] = [];
    let currentPos = 0;
    let newCursorPos = cursorPos;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineStart = currentPos;
      const lineEnd = currentPos + line.length;
      
      // Check if cursor is in this line
      const cursorInLine = cursorPos >= lineStart && cursorPos <= lineEnd + 1;
      
      // Only auto-transform if cursor is NOT in this line (to avoid interrupting typing)
      if (!cursorInLine && line.trim()) {
        // Transform completed markdown patterns
        let transformedLine = line;
        
        // Headers (only transform if line ends with space or is complete)
        if (/^#{1,6}\s/.test(transformedLine)) {
          const headerLevel = transformedLine.match(/^#{1,6}/)?.[0].length || 1;
          const headerText = transformedLine.replace(/^#{1,6}\s+/, '');
          transformedLine = `<h${headerLevel} class="text-${headerLevel === 1 ? '3xl' : headerLevel === 2 ? '2xl' : 'xl'} font-bold my-4">${headerText}</h${headerLevel}>`;
        }
        // Bold text
        else if (/\*\*([^*]+)\*\*/.test(transformedLine)) {
          transformedLine = transformedLine.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
        }
        // Italic text
        else if (/\*([^*]+)\*/.test(transformedLine)) {
          transformedLine = transformedLine.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
        }
        // Lists
        else if (/^[\s]*[-*+]\s/.test(transformedLine)) {
          const listText = transformedLine.replace(/^[\s]*[-*+]\s+/, '');
          transformedLine = `<li class="ml-6 my-1">• ${listText}</li>`;
        }
        // Blockquotes
        else if (/^>\s/.test(transformedLine)) {
          const quoteText = transformedLine.replace(/^>\s+/, '');
          transformedLine = `<blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground my-2">${quoteText}</blockquote>`;
        }
        
        processedLines.push(transformedLine);
      } else {
        // Keep original line if cursor is in it or if it's empty
        processedLines.push(line);
      }
      
      currentPos = lineEnd + 1; // +1 for newline character
    }
    
    return {
      html: processedLines.join('<br>'),
      newCursorPos: newCursorPos
    };
  };

  const handleEditCard = (card: InsightCard) => {
    setEditingCard(card.id);
    // Keep the content as markdown if it doesn't contain HTML tags
    const isHtml = /<[^>]*>/.test(card.content);
    setEditingContent(isHtml ? card.content.replace(/<[^>]*>/g, "") : card.content);
    setEditingTitle(card.title || getCardTitle(card));
    setIsFullScreen(true);
  };

  const handleCreateNote = async () => {
    if (!user) return;

    try {
      const newNote: InsertInsightCard = {
        type: "note",
        title: "New Reflection",
        content: "",
        tags: [],
      };

      await createInsightCard(user.uid, newNote);
      await refetch();
      
      toast({
        title: "New note created",
        description: "Your reflection note has been created.",
      });
    } catch (error) {
      console.error("Error creating note:", error);
      toast({
        title: "Error creating note",
        description: "Failed to create new note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveCard = async (cardId: string) => {
    if (!user) return;

    try {
      // Generate title from first line of content if not explicitly set
      const finalTitle = editingTitle || (editingContent.split('\n')[0] || "Untitled Note");
      
      await updateInsightCard(user.uid, cardId, {
        title: finalTitle,
        content: editingContent,
      });
      await refetch();
      setEditingCard(null);
      setEditingContent("");
      setEditingTitle("");
      setIsFullScreen(false);
      
      toast({
        title: "Note saved",
        description: "Your reflection has been saved successfully.",
      });
    } catch (error) {
      console.error("Error updating card:", error);
      toast({
        title: "Error saving note",
        description: "Failed to save your note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditingContent("");
    setEditingTitle("");
    setIsFullScreen(false);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!user) return;

    try {
      await deleteInsightCard(user.uid, cardId);
      await refetch();
      
      toast({
        title: "Item deleted",
        description: "The insight item has been removed.",
      });
    } catch (error) {
      console.error("Error deleting card:", error);
      toast({
        title: "Error deleting item",
        description: "Failed to delete the item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAll = () => {
    const data = {
      insights: cards,
      exportedAt: new Date().toISOString(),
      totalCount: cards.length,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `claritylog-insights-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: "Your insights have been downloaded as a JSON file.",
    });
  };

  const filteredCards = cards.filter(card => {
    const matchesSearch = !searchQuery || 
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === "all" || card.type === filterType;

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Bear app-like full-screen editor
  if (isFullScreen && editingCard) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Full-screen editor header */}
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
              <Search className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="text-sm text-muted-foreground">
              {format(new Date(), "MMM dd, yyyy")}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMarkdown(!showMarkdown)}
            >
              <FileText className="h-4 w-4 mr-2" />
              {showMarkdown ? "Show Preview" : "Show Markdown"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => handleSaveCard(editingCard)}>
              Save
            </Button>
          </div>
        </div>

        {/* Beautiful rich text editor */}
        <div className="flex-1 max-w-5xl mx-auto w-full p-6">
          <div className="flex flex-col h-full">
            <div className="text-sm text-muted-foreground mb-4 font-medium">Write Your Reflection</div>
            <div className="flex-1 border border-border rounded-xl overflow-hidden shadow-sm bg-background">
              <RichTextEditor
                content={editingContent}
                onChange={setEditingContent}
                placeholder="Start writing your professional reflection, insights, or notes...

Use the toolbar above to format your text with headings, bold, italic, lists, and more. No markdown syntax needed!"
                minHeight="calc(100vh - 280px)"
                maxLength={50000}
                showCharacterCount={true}
              />
            </div>
          </div>
        </div>
        
        {/* Bear-style bottom stats */}
        <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground max-w-7xl mx-auto px-6">
          <div className="flex items-center space-x-4">
            <span>{editingContent.length} characters</span>
            <span>{editingContent.split(/\s+/).filter(word => word.length > 0).length} words</span>
            <span>{editingContent.split('\n').length} lines</span>
          </div>
          <div className="flex items-center space-x-2">
            {lastSaved ? (
              <span className="text-green-600">
                Saved {format(lastSaved, "h:mm a")}
              </span>
            ) : autoSaveTimer ? (
              <span className="text-yellow-600">
                Saving...
              </span>
            ) : (
              <span>
                Last edited: {format(new Date(), "h:mm a")}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Web Content Summarizer - Notion Style */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden mb-8">

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Globe className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Summarize Web Content</h3>
            <p className="text-sm text-gray-500 font-medium">
              Enter a URL to automatically summarize and save key insights from web articles, research papers, or professional resources.
            </p>
          </div>
        </div>
        <div>
          <form onSubmit={handleSubmit(onSummarizeUrl)} className="space-y-4">
            {errors.url && (
              <Alert variant="destructive">
                <AlertDescription>{errors.url.message}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex space-x-3">
              <Input
                placeholder="https://example.com/article"
                {...register("url")}
                disabled={isSummarizing}
                className="flex-1 rounded-3xl border-gray-200"
              />
              <Button 
                type="submit" 
                disabled={isSummarizing}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-3xl"
              >
                {isSummarizing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Summarize
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* My Insights & Reflections - Notion Style */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">My Insights & Reflections</h3>
              <p className="text-sm text-gray-500 font-medium">
                Your personal notes, reflections, and summarized resources.
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadAll}
              className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-3xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
            <Button 
              size="sm" 
              onClick={handleCreateNote}
              className="bg-purple-500 hover:bg-purple-600 text-white rounded-3xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search insights, notes, and tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-3xl border-gray-200"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                className={filterType === "all" ? "bg-purple-500 hover:bg-purple-600 rounded-3xl" : "border-gray-200 text-gray-600 hover:bg-gray-50 rounded-3xl"}
              >
                All
              </Button>
              <Button
                variant={filterType === "note" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("note")}
                className={filterType === "note" ? "bg-purple-500 hover:bg-purple-600 rounded-3xl" : "border-gray-200 text-gray-600 hover:bg-gray-50 rounded-3xl"}
              >
                Notes
              </Button>
              <Button
                variant={filterType === "articleSummary" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("articleSummary")}
                className={filterType === "articleSummary" ? "bg-purple-500 hover:bg-purple-600 rounded-3xl" : "border-gray-200 text-gray-600 hover:bg-gray-50 rounded-3xl"}
              >
                Summaries
              </Button>
            </div>
          </div>

          {/* Empty State for New Note */}
          {filteredCards.length === 0 && filterType === "all" && !searchQuery && (
            <Card 
              className="border-dashed border-2 hover:border-primary/50 cursor-pointer transition-colors"
              onClick={handleCreateNote}
            >
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plus className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-medium text-foreground mb-1">Add a reflection or idea...</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Start documenting your professional insights and learning journey.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Insights Grid - Notion Style Cards */}
          {filteredCards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCards.map((card) => (
                <div key={card.id} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${card.type === "note" ? "bg-blue-50" : "bg-green-50"}`}>
                            {card.type === "note" ? (
                              <FileText className="h-3 w-3 text-blue-500" />
                            ) : (
                              <Globe className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                            {card.type === "note" ? "Note" : "Summary"}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-gray-900 text-base line-clamp-2 mb-3">
                          {getCardTitle(card)}
                        </h4>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div 
                        className="text-sm text-gray-600 line-clamp-3 cursor-pointer hover:bg-gray-50 p-2 rounded-3xl transition-colors"
                        onClick={() => handleEditCard(card)}
                        dangerouslySetInnerHTML={{
                          __html: card.content.replace(/<[^>]*>/g, "") || "Click to start writing..."
                        }}
                      />

                      {card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {card.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                              {tag}
                            </Badge>
                          ))}
                          {card.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                              +{card.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {card.originalUrl && (
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate">{new URL(card.originalUrl).hostname}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(card.createdAt), "MMM dd, yyyy")}</span>
                        </div>
                        
                        <div className="flex space-x-1">
                          {card.type === "note" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCard(card);
                              }}
                              className="text-xs text-gray-600 hover:bg-gray-50 rounded-lg"
                            >
                              Edit
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCard(card.id);
                            }}
                            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredCards.length === 0 && (searchQuery || filterType !== "all") && (
            <div className="text-center py-12">
              <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-sm text-gray-500">
                Try adjusting your search terms or filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
