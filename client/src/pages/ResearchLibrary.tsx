import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  BookOpen, 
  Star, 
  StarOff, 
  Trash2, 
  Plus, 
  Filter,
  ExternalLink,
  Calendar,
  User,
  Tag,
  FolderPlus,
  Folder,
  Edit,
  Download,
  Library,
  Sparkles,
  Heart,
  Archive,
  FileText,
  Globe,
  X
} from "lucide-react";
import { format } from "date-fns";

interface SavedResearch {
  id: string;
  title: string;
  url: string;
  domain: string;
  source: string;
  snippet: string;
  authors: string[];
  publishDate?: string;
  citationApa?: string;
  summary?: string;
  tags: string[];
  notes?: string;
  isFavorite: boolean;
  collectionId?: string;
  createdAt: Date;
}

interface ResearchCollection {
  id: string;
  name: string;
  description?: string;
  color: string;
  isPrivate: boolean;
  userId: string;
}

export default function ResearchLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [savedResearch, setSavedResearch] = useState<SavedResearch[]>([]);
  const [collections, setCollections] = useState<ResearchCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "favorites" | "recent" | "collections">("all");
  const [selectedPaper, setSelectedPaper] = useState<SavedResearch | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState("#3B82F6");

  // Load saved research and collections
  useEffect(() => {
    if (user) {
      loadSavedResearch();
      loadCollections();
    }
  }, [user]);

  const loadSavedResearch = async () => {
    try {
      const response = await fetch(`/api/research/saved/${user?.uid}`);
      if (response.ok) {
        const data = await response.json();
        setSavedResearch(data.savedResearch || []);
      }
    } catch (error) {
      console.error('Error loading saved research:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      const response = await fetch(`/api/research/collections?userId=${user?.uid}`);
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const toggleFavorite = async (paperId: string) => {
    try {
      const paper = savedResearch.find(p => p.id === paperId);
      if (!paper) return;

      const response = await fetch(`/api/research/saved/${paperId}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !paper.isFavorite })
      });

      if (response.ok) {
        setSavedResearch(prev => 
          prev.map(p => p.id === paperId ? { ...p, isFavorite: !p.isFavorite } : p)
        );
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const createCollection = async () => {
    if (!newCollectionName.trim() || !user) return;

    try {
      const response = await fetch('/api/research/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim(),
          color: newCollectionColor,
          isPrivate: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCollections(prev => [...prev, data.collection]);
        setNewCollectionName("");
        setNewCollectionDescription("");
        setNewCollectionColor("#3B82F6");
        setShowCreateCollection(false);
        toast({
          title: "Collection created",
          description: "Your new collection has been created successfully."
        });
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      toast({
        title: "Error",
        description: "Failed to create collection. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter research papers
  const filteredResearch = savedResearch.filter(paper => {
    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const searchFields = [
        paper.title,
        paper.source,
        paper.snippet,
        paper.summary || '',
        paper.authors.join(' '),
        paper.tags.join(' ')
      ].join(' ').toLowerCase();
      
      if (!searchFields.includes(query)) return false;
    }

    // Filter by type
    switch (selectedFilter) {
      case "favorites":
        return paper.isFavorite;
      case "recent":
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(paper.createdAt) > weekAgo;
      case "collections":
        return paper.collectionId !== null;
      default:
        return true;
    }
  });

  const filteredCollections = collections.filter(collection => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return collection.name.toLowerCase().includes(query) ||
             collection.description?.toLowerCase().includes(query);
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading research library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Minimalist Header with Search */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 pt-1 flex-shrink-0">
        <div className="space-y-4">
          {/* Main Search Bar */}
          <div className="flex items-center gap-3 max-w-5xl">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search your research library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-full h-12 text-base"
              />
            </div>
            
            <Button onClick={() => setShowCreateCollection(true)} variant="outline" size="sm" className="rounded-full">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={selectedFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("all")}
              className="rounded-full h-8 px-4 text-xs"
            >
              All
            </Button>
            <Button
              variant={selectedFilter === "favorites" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("favorites")}
              className="rounded-full h-8 px-4 text-xs"
            >
              Favorites
            </Button>
            <Button
              variant={selectedFilter === "recent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("recent")}
              className="rounded-full h-8 px-4 text-xs"
            >
              Recent
            </Button>
            {filteredCollections.length > 0 && (
              <Button
                variant={selectedFilter === "collections" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("collections")}
                className="rounded-full h-8 px-4 text-xs"
              >
                Collections
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Research Cards Grid - MyMind Style */}
      <div className="flex-1 px-4 pb-20 overflow-y-auto scrollbar-hide">
        {filteredResearch.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Research Papers Yet</h3>
            <p className="text-muted-foreground">
              Start building your research library by saving papers from search results.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredResearch.map((paper) => (
              <Card 
                key={paper.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white dark:bg-gray-800 border-0 rounded-2xl overflow-hidden h-fit shadow-sm"
                onClick={() => setSelectedPaper(paper)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Date and Source - Minimal */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 tracking-wide">
                        {format(new Date(paper.createdAt), "MMM d")}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(paper.id);
                        }}
                        className="p-1 h-auto hover:bg-transparent"
                      >
                        {paper.isFavorite ? (
                          <Heart className="h-3 w-3 text-red-500 fill-current" />
                        ) : (
                          <Heart className="h-3 w-3 text-gray-400" />
                        )}
                      </Button>
                    </div>

                    {/* Title - Premium Typography */}
                    <h3 
                      className="text-gray-800 dark:text-gray-200 font-medium leading-snug"
                      style={{ 
                        fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                        fontSize: '0.95rem',
                        lineHeight: '1.4',
                        letterSpacing: '0.01em'
                      }}
                    >
                      {paper.title.length > 80 ? `${paper.title.substring(0, 80)}...` : paper.title}
                    </h3>

                    {/* Summary/Snippet Preview */}
                    <div 
                      className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed"
                      style={{ 
                        fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                        fontSize: '0.85rem',
                        lineHeight: '1.5',
                        letterSpacing: '0.01em'
                      }}
                    >
                      {(() => {
                        const preview = paper.summary || paper.snippet || '';
                        return preview.length > 100 ? `${preview.substring(0, 100)}...` : preview;
                      })()}
                    </div>

                    {/* Source and Tags Preview */}
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {paper.source}
                      </div>
                      
                      {paper.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {paper.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                              {tag}
                            </Badge>
                          ))}
                          {paper.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              +{paper.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Article View Modal */}
      <Dialog open={!!selectedPaper} onOpenChange={() => setSelectedPaper(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white leading-tight">
                  {selectedPaper?.title}
                </DialogTitle>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <span>{selectedPaper?.source}</span>
                  {selectedPaper?.publishDate && (
                    <span>• {selectedPaper.publishDate}</span>
                  )}
                  <span>• Saved {selectedPaper?.createdAt ? format(new Date(selectedPaper.createdAt), "MMM d, yyyy") : ''}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectedPaper && toggleFavorite(selectedPaper.id)}
                >
                  {selectedPaper?.isFavorite ? (
                    <Heart className="h-4 w-4 text-red-500 fill-current" />
                  ) : (
                    <Heart className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
                {selectedPaper?.url && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={selectedPaper.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 mt-6">
            {/* Authors */}
            {selectedPaper?.authors && selectedPaper.authors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Authors</h4>
                <p className="text-gray-700 dark:text-gray-300">{selectedPaper.authors.join(", ")}</p>
              </div>
            )}

            {/* Summary */}
            {selectedPaper?.summary && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Summary</h4>
                <div 
                  className="text-gray-700 dark:text-gray-300 leading-relaxed"
                  style={{ 
                    fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    letterSpacing: '0.01em'
                  }}
                >
                  {selectedPaper.summary}
                </div>
              </div>
            )}

            {/* Snippet if no summary */}
            {!selectedPaper?.summary && selectedPaper?.snippet && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Abstract</h4>
                <div 
                  className="text-gray-700 dark:text-gray-300 leading-relaxed"
                  style={{ 
                    fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    letterSpacing: '0.01em'
                  }}
                >
                  {selectedPaper.snippet}
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedPaper?.tags && selectedPaper.tags.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPaper.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Citation */}
            {selectedPaper?.citationApa && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Citation (APA)</h4>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {selectedPaper.citationApa}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedPaper?.notes && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Notes</h4>
                <div 
                  className="text-gray-700 dark:text-gray-300 leading-relaxed"
                  style={{ 
                    fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    letterSpacing: '0.01em'
                  }}
                >
                  {selectedPaper.notes}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Collection Modal */}
      <Dialog open={showCreateCollection} onOpenChange={setShowCreateCollection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Collection name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <Textarea
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Brief description (optional)"
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={newCollectionColor}
                  onChange={(e) => setNewCollectionColor(e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{newCollectionColor}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={createCollection} className="flex-1">
                Create Collection
              </Button>
              <Button variant="outline" onClick={() => setShowCreateCollection(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}