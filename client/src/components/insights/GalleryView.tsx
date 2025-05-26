import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Sparkles, Search, Lightbulb, Target, Eye, BookOpen, Tag, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useLogEntries } from "@/hooks/use-firestore";
import { getAiAnalysis } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import type { LogEntry, AiAnalysis } from "@shared/schema";

interface GalleryItem extends LogEntry {
  analysis?: AiAnalysis;
}

export const GalleryView = () => {
  const { user } = useAuth();
  const { entries, loading: entriesLoading } = useLogEntries();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

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

  const filteredItems = galleryItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.analysis?.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.analysis?.themes.some(theme => theme.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === "all" || 
      item.analysis?.ccsrCategory === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = Array.from(
    new Set(galleryItems.map(item => item.analysis?.ccsrCategory).filter(Boolean))
  ).sort();

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
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {uniqueCategories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredItems.length} of {galleryItems.length} session insights
      </div>

      {/* Gallery Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No insights match your current search and filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card 
              key={item.id} 
              className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(item.dateOfContact), "MMM dd, yyyy")}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.clientContactHours}h
                  </Badge>
                </div>
                
                {item.analysis?.ccsrCategory && (
                  <Badge variant="secondary" className="w-fit text-xs">
                    {item.analysis.ccsrCategory}
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {item.analysis ? (
                  <>
                    {/* AI Summary */}
                    <div>
                      <h4 className="font-medium text-sm text-foreground mb-2">AI Summary</h4>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {item.analysis.summary}
                      </p>
                    </div>

                    {/* Key Themes */}
                    {item.analysis.themes.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-foreground mb-2">Key Themes</h4>
                        <div className="flex flex-wrap gap-1">
                          {item.analysis.themes.slice(0, 3).map((theme, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {theme}
                            </Badge>
                          ))}
                          {item.analysis.themes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.analysis.themes.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Key Learnings */}
                    {item.analysis.keyLearnings.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-foreground mb-2">Key Learnings</h4>
                        <ul className="space-y-1">
                          {item.analysis.keyLearnings.slice(0, 2).map((learning, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex items-start space-x-2">
                              <span className="block w-1 h-1 bg-current rounded-full flex-shrink-0 mt-1.5" />
                              <span className="line-clamp-2">{learning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Analysis not available
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Run AI analysis to generate insights
                    </p>
                  </div>
                )}

                {/* Original Notes Preview */}
                <div className="pt-3 border-t">
                  <h4 className="font-medium text-sm text-foreground mb-2">Session Notes</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.notes}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detailed Analysis Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>AI Analysis Details</span>
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Session Info */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(selectedItem.dateOfContact), "MMMM dd, yyyy")}</span>
                  </div>
                  <Badge variant="outline">
                    {selectedItem.clientContactHours}h session
                  </Badge>
                </div>
                {selectedItem.analysis?.ccsrCategory && (
                  <Badge variant="secondary" className="w-fit">
                    {selectedItem.analysis.ccsrCategory}
                  </Badge>
                )}
              </div>

              {selectedItem.analysis ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Summary</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedItem.analysis.summary}
                    </p>
                  </div>

                  <Separator />

                  {/* Key Themes */}
                  {selectedItem.analysis.themes.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Lightbulb className="h-5 w-5 text-amber-500" />
                        <h3 className="text-lg font-semibold">Key Themes</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedItem.analysis.themes.map((theme, index) => (
                          <div key={index} className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                            <p className="text-sm">{theme}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Potential Blind Spots */}
                  {selectedItem.analysis.potentialBlindSpots.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Eye className="h-5 w-5 text-orange-500" />
                        <h3 className="text-lg font-semibold">Potential Blind Spots</h3>
                      </div>
                      <div className="space-y-3">
                        {selectedItem.analysis.potentialBlindSpots.map((blindSpot, index) => (
                          <div key={index} className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
                            <p className="text-sm">{blindSpot}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Reflective Prompts */}
                  {selectedItem.analysis.reflectivePrompts.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Target className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg font-semibold">Reflective Prompts</h3>
                      </div>
                      <div className="space-y-3">
                        {selectedItem.analysis.reflectivePrompts.map((prompt, index) => (
                          <div key={index} className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                            <p className="text-sm font-medium">Question {index + 1}:</p>
                            <p className="text-sm text-muted-foreground mt-1">{prompt}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Key Learnings */}
                  {selectedItem.analysis.keyLearnings.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <BookOpen className="h-5 w-5 text-green-500" />
                        <h3 className="text-lg font-semibold">Key Learnings</h3>
                      </div>
                      <div className="space-y-3">
                        {selectedItem.analysis.keyLearnings.map((learning, index) => (
                          <div key={index} className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                            <p className="text-sm">{learning}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Original Notes */}
                  <Separator />
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Tag className="h-5 w-5 text-purple-500" />
                      <h3 className="text-lg font-semibold">Original Session Notes</h3>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                        {selectedItem.notes}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No AI analysis available for this session.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
