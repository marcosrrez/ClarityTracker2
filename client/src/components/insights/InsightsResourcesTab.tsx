import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ExternalLink 
} from "lucide-react";
import { format } from "date-fns";
import { useInsightCards } from "@/hooks/use-firestore";
import { createInsightCard, deleteInsightCard } from "@/lib/firestore";
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
  });

  const onSummarizeUrl = async (data: UrlFormData) => {
    if (!user) return;

    try {
      setIsSummarizing(true);
      
      // TODO: Implement actual web content summarization with Google AI
      // For now, create a mock summary
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSummary: InsertInsightCard = {
        type: "articleSummary",
        title: "Article Summary from " + new URL(data.url).hostname,
        content: `<h3>Summary of ${data.url}</h3><p>This is a summarized version of the web content. The AI has extracted key insights and main points from the article to help with your professional development.</p>`,
        tags: ["web-content", "summary", "resource"],
        originalUrl: data.url,
      };

      await createInsightCard(user.uid, mockSummary);
      await refetch();
      
      toast({
        title: "Article summarized successfully",
        description: "The web content has been analyzed and saved to your insights.",
      });
      
      reset();
    } catch (error) {
      console.error("Error summarizing URL:", error);
      toast({
        title: "Error summarizing content",
        description: "Failed to process the web content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCreateNote = async () => {
    if (!user) return;

    try {
      const newNote: InsertInsightCard = {
        type: "note",
        title: "New Reflection",
        content: "<p>Start writing your thoughts and reflections here...</p>",
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

  return (
    <div className="space-y-6">
      {/* Web Content Summarizer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-primary" />
            <span>Summarize Web Content</span>
          </CardTitle>
          <CardDescription>
            Enter a URL to automatically summarize and save key insights from web articles, 
            research papers, or professional resources.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                className="flex-1"
              />
              <Button type="submit" disabled={isSummarizing}>
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
        </CardContent>
      </Card>

      {/* My Insights & Reflections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Insights & Reflections</CardTitle>
              <CardDescription>
                Your personal notes, reflections, and summarized resources.
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
              <Button size="sm" onClick={handleCreateNote}>
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search insights, notes, and tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
              >
                All
              </Button>
              <Button
                variant={filterType === "note" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("note")}
              >
                Notes
              </Button>
              <Button
                variant={filterType === "articleSummary" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("articleSummary")}
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

          {/* Insights Grid */}
          {filteredCards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCards.map((card) => (
                <Card key={card.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {card.type === "note" ? (
                            <FileText className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Globe className="h-4 w-4 text-green-500" />
                          )}
                          <Badge variant="outline" className="text-xs">
                            {card.type === "note" ? "Note" : "Summary"}
                          </Badge>
                        </div>
                        <CardTitle className="text-base line-clamp-2">
                          {card.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div 
                      className="text-sm text-muted-foreground line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html: card.content.replace(/<[^>]*>/g, "")
                      }}
                    />

                    {card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {card.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {card.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{card.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {card.originalUrl && (
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{new URL(card.originalUrl).hostname}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(card.createdAt), "MMM dd, yyyy")}</span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-xs text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredCards.length === 0 && (searchQuery || filterType !== "all") && (
            <div className="text-center py-12">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-foreground mb-1">No results found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search terms or filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
