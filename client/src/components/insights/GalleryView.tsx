import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Sparkles, Search } from "lucide-react";
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
              return { ...entry, analysis };
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
            <Card key={item.id} className="hover:shadow-md transition-shadow duration-200">
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
    </div>
  );
};
