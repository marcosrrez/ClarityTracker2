import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Globe
} from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<SavedResearch | null>(null);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");

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
        description: "Failed to load research data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createCollection = async () => {
    if (!newCollectionName.trim() || !user?.uid) return;

    try {
      const response = await fetch('/api/research/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim(),
          isPrivate: true
        })
      });

      if (response.ok) {
        const newCollection = await response.json();
        setCollections(prev => [...prev, newCollection.collection]);
        setNewCollectionName("");
        setNewCollectionDescription("");
        setIsCreateCollectionOpen(false);
        toast({
          title: "Collection Created",
          description: `"${newCollectionName}" has been created successfully.`,
        });
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      toast({
        title: "Creation Error",
        description: "Failed to create collection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = async (paperId: string) => {
    try {
      const response = await fetch(`/api/research/saved/${paperId}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setSavedResearch(prev => 
          prev.map(paper => 
            paper.id === paperId 
              ? { ...paper, isFavorite: !paper.isFavorite }
              : paper
          )
        );
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status.",
        variant: "destructive",
      });
    }
  };

  const deletePaper = async (paperId: string) => {
    try {
      const response = await fetch(`/api/research/saved/${paperId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedResearch(prev => prev.filter(paper => paper.id !== paperId));
        setSelectedPaper(null);
        toast({
          title: "Paper Deleted",
          description: "Research paper has been removed from your library.",
        });
      }
    } catch (error) {
      console.error('Error deleting paper:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete paper. Please try again.",
        variant: "destructive",
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
      
      const matchesCollection = selectedCollection === "all" || paper.collectionId === selectedCollection;
      const matchesFavorites = !showFavoritesOnly || paper.isFavorite;
      
      return matchesSearch && matchesCollection && matchesFavorites;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const favoriteCount = savedResearch.filter(paper => paper.isFavorite).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-6 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col space-y-8 mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Library className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Research Library
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg mt-1">
                  Organize and manage your research collection
                </p>
              </div>
            </div>

            <Dialog open={isCreateCollectionOpen} onOpenChange={setIsCreateCollectionOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3">
                  <FolderPlus className="h-5 w-5 mr-2" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <FolderPlus className="h-5 w-5 text-blue-600" />
                    <span>Create Collection</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Collection name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="rounded-xl"
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                    className="rounded-xl resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setIsCreateCollectionOpen(false)} className="rounded-xl">
                      Cancel
                    </Button>
                    <Button 
                      onClick={createCollection}
                      className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                      disabled={!newCollectionName.trim()}
                    >
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Papers</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{savedResearch.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                    <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Favorites</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{favoriteCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Folder className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Collections</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{collections.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Archive className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">This Month</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {savedResearch.filter(paper => {
                        const paperDate = new Date(paper.createdAt);
                        const now = new Date();
                        return paperDate.getMonth() === now.getMonth() && paperDate.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Search papers, authors, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50"
                />
              </div>

              <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                <SelectTrigger className="w-full sm:w-48 rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
                  <SelectValue placeholder="All Collections" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Collections</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="rounded-xl"
            >
              <Heart className={`h-4 w-4 mr-2 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              Favorites Only
            </Button>
          </div>
        </div>

        {/* Research Papers Grid */}
        {filteredResearch.length === 0 ? (
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full">
                  <BookOpen className="h-12 w-12 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {savedResearch.length === 0 ? "No research papers yet" : "No papers match your filters"}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    {savedResearch.length === 0 
                      ? "Start building your research library by saving papers from the AI Coach in Insights & Resources."
                      : "Try adjusting your search terms or collection filter to find more papers."
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResearch.map((paper) => (
              <Card 
                key={paper.id} 
                className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl group cursor-pointer"
                onClick={() => setSelectedPaper(paper)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <Badge variant="secondary" className="text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {paper.domain}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg leading-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {paper.title}
                      </CardTitle>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(paper.id);
                      }}
                      className="ml-2 p-2 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                    >
                      {paper.isFavorite ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      ) : (
                        <StarOff className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                    {paper.snippet}
                  </p>

                  {paper.authors.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {paper.authors.slice(0, 2).join(', ')}
                        {paper.authors.length > 2 && ` +${paper.authors.length - 2} more`}
                      </p>
                    </div>
                  )}

                  {paper.publishDate && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(paper.publishDate).getFullYear()}
                      </p>
                    </div>
                  )}

                  {paper.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {paper.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs rounded-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                          {tag}
                        </Badge>
                      ))}
                      {paper.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs rounded-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                          +{paper.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Saved {new Date(paper.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(paper.url, '_blank');
                        }}
                        className="p-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      >
                        <ExternalLink className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePaper(paper.id);
                        }}
                        className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Paper Details Modal */}
        <Dialog open={!!selectedPaper} onOpenChange={() => setSelectedPaper(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedPaper && (
              <>
                <DialogHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <Badge variant="secondary" className="rounded-full">
                        {selectedPaper.domain}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => toggleFavorite(selectedPaper.id)}
                      className="rounded-xl"
                    >
                      {selectedPaper.isFavorite ? (
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      ) : (
                        <StarOff className="h-5 w-5 text-slate-400" />
                      )}
                    </Button>
                  </div>
                  <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {selectedPaper.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                  {selectedPaper.authors.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-slate-400" />
                      <p className="text-slate-600 dark:text-slate-400">
                        <strong>Authors:</strong> {selectedPaper.authors.join(', ')}
                      </p>
                    </div>
                  )}

                  {selectedPaper.publishDate && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-slate-400" />
                      <p className="text-slate-600 dark:text-slate-400">
                        <strong>Published:</strong> {new Date(selectedPaper.publishDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Abstract</h4>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {selectedPaper.snippet}
                    </p>
                  </div>

                  {selectedPaper.summary && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-900 dark:text-white">Summary</h4>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {selectedPaper.summary}
                      </p>
                    </div>
                  )}

                  {selectedPaper.citationApa && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-900 dark:text-white">APA Citation</h4>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                          {selectedPaper.citationApa}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedPaper.tags.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-900 dark:text-white">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPaper.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="rounded-full">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPaper.notes && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-900 dark:text-white">Notes</h4>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {selectedPaper.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Saved on {new Date(selectedPaper.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedPaper.url, '_blank')}
                        className="rounded-xl"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Original
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          deletePaper(selectedPaper.id);
                          setSelectedPaper(null);
                        }}
                        className="rounded-xl"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}