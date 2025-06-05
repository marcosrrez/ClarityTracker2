import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Search, 
  BookOpen, 
  Plus, 
  FolderPlus, 
  Globe, 
  Calendar, 
  Quote, 
  Tag, 
  Filter, 
  SortDesc,
  Bookmark,
  Trash2,
  Edit3,
  Eye,
  Download,
  Share2,
  Star,
  StarOff
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
  lastAccessed?: Date;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isPrivate: boolean;
  paperCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function ResearchLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [savedResearch, setSavedResearch] = useState<SavedResearch[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  const [showPaperDetails, setShowPaperDetails] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<SavedResearch | null>(null);
  
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState("#3b82f6");
  const [isPrivateCollection, setIsPrivateCollection] = useState(false);

  // Load saved research and collections
  useEffect(() => {
    if (user?.uid) {
      loadResearchData();
    }
  }, [user?.uid]);

  const loadResearchData = async () => {
    setIsLoading(true);
    try {
      const [researchResponse, collectionsResponse] = await Promise.all([
        fetch(`/api/research/saved/${user?.uid}`),
        fetch(`/api/research/collections?userId=${user?.uid}`)
      ]);

      if (researchResponse.ok) {
        const researchData = await researchResponse.json();
        setSavedResearch(researchData.savedResearch || []);
      }

      if (collectionsResponse.ok) {
        const collectionsData = await collectionsResponse.json();
        setCollections(collectionsData.collections || []);
      }
    } catch (error) {
      console.error('Error loading research data:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load research library. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create new collection
  const createCollection = async () => {
    if (!newCollectionName.trim()) return;

    try {
      const response = await fetch('/api/research/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          name: newCollectionName,
          description: newCollectionDescription,
          color: newCollectionColor,
          isPrivate: isPrivateCollection
        })
      });

      if (response.ok) {
        const newCollection = await response.json();
        setCollections(prev => [...prev, newCollection]);
        setNewCollectionName("");
        setNewCollectionDescription("");
        setNewCollectionColor("#3b82f6");
        setIsPrivateCollection(false);
        setShowNewCollectionDialog(false);
        
        toast({
          title: "Collection Created",
          description: `"${newCollectionName}" collection has been created.`
        });
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      toast({
        title: "Creation Failed",
        description: "Unable to create collection. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (paperId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/research/saved/${paperId}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentStatus })
      });

      if (response.ok) {
        setSavedResearch(prev => 
          prev.map(paper => 
            paper.id === paperId 
              ? { ...paper, isFavorite: !currentStatus }
              : paper
          )
        );
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Delete research paper
  const deletePaper = async (paperId: string) => {
    try {
      const response = await fetch(`/api/research/saved/${paperId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSavedResearch(prev => prev.filter(paper => paper.id !== paperId));
        toast({
          title: "Paper Deleted",
          description: "Research paper has been removed from your library."
        });
      }
    } catch (error) {
      console.error('Error deleting paper:', error);
      toast({
        title: "Deletion Failed",
        description: "Unable to delete paper. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter and sort research papers
  const filteredResearch = (Array.isArray(savedResearch) ? savedResearch : [])
    .filter(paper => {
      const matchesSearch = searchQuery === "" || 
        paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCollection = selectedCollection === "all" || 
        paper.collectionId === selectedCollection;
      
      const matchesFavorites = !showOnlyFavorites || paper.isFavorite;
      
      return matchesSearch && matchesCollection && matchesFavorites;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "accessed":
          const aAccessed = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0;
          const bAccessed = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0;
          return bAccessed - aAccessed;
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Research Library</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize and access your saved research papers
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowNewCollectionDialog(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FolderPlus className="h-4 w-4" />
            New Collection
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search papers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCollection} onValueChange={setSelectedCollection}>
          <SelectTrigger>
            <SelectValue placeholder="All Collections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {collections.map(collection => (
              <SelectItem key={collection.id} value={collection.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: collection.color }}
                  />
                  {collection.name} ({collection.paperCount})
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently Added</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
            <SelectItem value="accessed">Last Accessed</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showOnlyFavorites ? "default" : "outline"}
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          className="flex items-center gap-2"
        >
          <Star className={`h-4 w-4 ${showOnlyFavorites ? 'fill-current' : ''}`} />
          Favorites Only
        </Button>
      </div>

      {/* Collections Summary */}
      {collections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {collections.slice(0, 4).map(collection => (
            <Card key={collection.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: collection.color }}
                  />
                  <div>
                    <h3 className="font-medium text-sm">{collection.name}</h3>
                    <p className="text-xs text-gray-500">{collection.paperCount} papers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Research Papers Grid */}
      {filteredResearch.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {savedResearch.length === 0 ? "No saved research yet" : "No papers match your filters"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {savedResearch.length === 0 
                ? "Start saving research papers from the AI Coach to build your library"
                : "Try adjusting your search terms or filters"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResearch.map(paper => (
            <Card key={paper.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium line-clamp-2 mb-2">
                      {paper.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Globe className="h-3 w-3" />
                      <span>{paper.domain}</span>
                      {paper.publishDate && (
                        <>
                          <span>•</span>
                          <Calendar className="h-3 w-3" />
                          <span>{paper.publishDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleFavorite(paper.id, paper.isFavorite)}
                    className="ml-2 p-1 h-auto"
                  >
                    {paper.isFavorite ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                  {paper.snippet}
                </p>
                
                {paper.authors.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Authors:</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {paper.authors.slice(0, 3).join(", ")}
                      {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                    </p>
                  </div>
                )}

                {paper.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {paper.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {paper.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{paper.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPaper(paper);
                        setShowPaperDetails(true);
                      }}
                      className="text-xs h-7 px-2"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(paper.url, '_blank')}
                      className="text-xs h-7 px-2"
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      Visit
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deletePaper(paper.id)}
                    className="text-xs h-7 px-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Collection Dialog */}
      <Dialog open={showNewCollectionDialog} onOpenChange={setShowNewCollectionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Organize your research papers into themed collections
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Collection Name</label>
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., CBT Techniques, Trauma Therapy"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
              <Textarea
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Brief description of this collection's focus"
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Color</label>
                <div className="flex gap-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCollectionColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newCollectionColor === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="private"
                checked={isPrivateCollection}
                onChange={(e) => setIsPrivateCollection(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="private" className="text-sm">
                Make this collection private
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowNewCollectionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createCollection} disabled={!newCollectionName.trim()}>
              Create Collection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paper Details Dialog */}
      <Dialog open={showPaperDetails} onOpenChange={setShowPaperDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPaper && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg leading-tight pr-8">
                  {selectedPaper.title}
                </DialogTitle>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Globe className="h-4 w-4" />
                  <span>{selectedPaper.domain}</span>
                  {selectedPaper.publishDate && (
                    <>
                      <span>•</span>
                      <Calendar className="h-4 w-4" />
                      <span>{selectedPaper.publishDate}</span>
                    </>
                  )}
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {selectedPaper.authors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Authors</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedPaper.authors.join(", ")}
                    </p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium mb-2">Abstract/Summary</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {selectedPaper.snippet}
                  </p>
                </div>
                
                {selectedPaper.summary && (
                  <div>
                    <h4 className="font-medium mb-2">AI Summary</h4>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedPaper.summary}
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedPaper.citationApa && (
                  <div>
                    <h4 className="font-medium mb-2">APA Citation</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                        {selectedPaper.citationApa}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigator.clipboard.writeText(selectedPaper.citationApa || '')}
                        className="mt-2 text-xs"
                      >
                        Copy Citation
                      </Button>
                    </div>
                  </div>
                )}
                
                {selectedPaper.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedPaper.notes}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    Saved {format(new Date(selectedPaper.createdAt), 'MMM d, yyyy')}
                    {selectedPaper.lastAccessed && (
                      <span> • Last accessed {format(new Date(selectedPaper.lastAccessed), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(selectedPaper.url, '_blank')}
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      View Original
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleFavorite(selectedPaper.id, selectedPaper.isFavorite)}
                    >
                      {selectedPaper.isFavorite ? (
                        <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="h-4 w-4 mr-1" />
                      )}
                      {selectedPaper.isFavorite ? 'Favorited' : 'Add to Favorites'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}