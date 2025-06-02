import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Sparkles, AlertTriangle, ChevronDown, Trash2, Share2, MoreHorizontal, X, Archive, Edit3, Copy } from "lucide-react";
import { MyMindLayout } from "./MyMindLayout";
import { format } from "date-fns";
import { useLogEntries, useInsightCards } from "@/hooks/use-firestore";
import { getAiAnalysis, deleteAiAnalysis, updateLogEntry, deleteInsightCard, updateInsightCard } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface GalleryItem {
  id: string;
  dateOfContact: Date;
  clientContactHours: number;
  notes: string;
  analysis?: any;
}

interface GalleryViewProps {
  userId: string;
}

export function GalleryView({ userId }: GalleryViewProps) {
  const { user } = useAuth();
  const { entries: logEntries, loading: isLoading, refetch } = useLogEntries();
  const { cards: insightCards, loading: cardsLoading, refetch: refetchCards } = useInsightCards();
  const [expandedCard, setExpandedCard] = useState<GalleryItem | null>(null);
  const [deleteDialogItem, setDeleteDialogItem] = useState<GalleryItem | null>(null);
  const [editingCard, setEditingCard] = useState<GalleryItem | null>(null);
  const [editedNotes, setEditedNotes] = useState<string>("");
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const { toast } = useToast();

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

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const processItems = async () => {
      const items: GalleryItem[] = [];

      // Add log entries with their analyses
      if (logEntries) {
        for (const entry of logEntries) {
          let analysis = null;
          
          try {
            const analysisData = await getAiAnalysis(user?.uid || "", entry.id);
            if (analysisData) {
              analysis = analysisData;
            }
          } catch (error) {
            console.log("No analysis found for entry:", entry.id);
          }

          items.push({
            id: entry.id,
            dateOfContact: new Date(entry.dateOfContact),
            clientContactHours: entry.clientContactHours,
            notes: entry.notes || "",
            analysis
          });
        }
      }

      // Add standalone insight cards (notes, article summaries)
      if (insightCards) {
        for (const card of insightCards) {
          items.push({
            id: `card-${card.id}`,
            dateOfContact: new Date(card.createdAt),
            clientContactHours: 0, // Not applicable for insight cards
            notes: card.content,
            analysis: {
              type: 'insight-card',
              cardType: card.type,
              title: card.title,
              tags: card.tags,
              originalUrl: card.originalUrl
            }
          });
        }
      }

      items.sort((a, b) => new Date(b.dateOfContact).getTime() - new Date(a.dateOfContact).getTime());
      setGalleryItems(items);
    };

    processItems();
  }, [logEntries, insightCards, user?.uid]);

  const handleDeleteAnalysis = async (itemId: string) => {
    try {
      await deleteAiAnalysis(user?.uid || "", itemId);
      
      setGalleryItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, analysis: undefined }
            : item
        )
      );

      toast({
        title: "Analysis Deleted",
        description: "The AI analysis has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting analysis:", error);
      toast({
        title: "Error",
        description: "Failed to delete the analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInsightCard = async (cardId: string) => {
    try {
      await deleteInsightCard(user?.uid || '', cardId);
      await refetchCards();
      toast({
        title: "Card deleted",
        description: "The insight card has been permanently removed. Your hour tracking data remains intact.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete insight card.",
        variant: "destructive",
      });
    }
  };

  const handleEditNotes = (item: GalleryItem) => {
    setEditingCard(item);
    setEditedNotes(cleanText(item.notes));
    setIsInlineEditing(true);
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditedNotes("");
    setIsInlineEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;

    try {
      // Check if this is an insight card or log entry
      const isInsightCard = insightCards?.some(card => card.id === editingCard.id);
      
      if (isInsightCard) {
        // Update insight card content
        await updateInsightCard(user?.uid || '', editingCard.id, {
          content: editedNotes
        });
        await refetchCards();
      } else {
        // Update log entry notes - this preserves all hour tracking data
        await updateLogEntry(user?.uid || '', editingCard.id, {
          notes: editedNotes
        });
        await refetch();
      }

      // Update local state
      setGalleryItems(prev => 
        prev.map(item => 
          item.id === editingCard.id 
            ? { ...item, notes: editedNotes }
            : item
        )
      );

      // Update the expanded card display
      if (expandedCard?.id === editingCard.id) {
        setExpandedCard({
          ...expandedCard,
          notes: editedNotes
        });
      }

      setEditingCard(null);
      setEditedNotes("");
      setIsInlineEditing(false);
      
      toast({
        title: "Notes updated",
        description: "Your changes have been saved. Hour tracking data is preserved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || cardsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <MyMindLayout 
        galleryItems={galleryItems}
        onItemClick={setExpandedCard}
        onRefresh={async () => {
          await refetch();
          await refetchCards();
        }}
      />

      {/* Full Page Open Card Modal */}
      {expandedCard && (
        <Dialog open={!!expandedCard} onOpenChange={() => setExpandedCard(null)}>
          <DialogContent className="max-w-none w-full h-full p-0 gap-0 bg-gray-50 dark:bg-gray-900 [&>button]:hidden overflow-hidden" aria-describedby="session-description">
            <DialogTitle className="sr-only">Session Details</DialogTitle>
            <DialogDescription id="session-description" className="sr-only">
              View and manage session details with AI analysis and tags
            </DialogDescription>
            
            {/* Spacious Content Area with Rounded Card Feel */}
            <div className="flex-1 overflow-y-auto p-8 pt-12">
              <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-12 space-y-16">
                
                {/* Header with Dropdown - No Divider */}
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setExpandedCard(null)}
                    className="p-2 -ml-2"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleEditNotes(expandedCard)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit notes
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteDialogItem(expandedCard)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete card
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Key Insights Summary */}
                {expandedCard.analysis && expandedCard.analysis.summary && (
                  <div className="space-y-6">
                    <h2 
                      className="text-2xl font-light text-gray-900 dark:text-gray-100"
                      style={{ 
                        fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", serif'
                      }}
                    >
                      Key Insights
                    </h2>
                    <div 
                      className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg"
                      style={{ 
                        fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", serif',
                        lineHeight: '1.75',
                        fontWeight: '400',
                        letterSpacing: '0.015em'
                      }}
                    >
                      {cleanText(expandedCard.analysis.summary)}
                    </div>
                  </div>
                )}

                {/* Session Notes - Free from Boxes */}
                <div className="space-y-6">
                  <h2 
                    className="text-2xl font-light text-gray-900 dark:text-gray-100"
                    style={{ 
                      fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", serif'
                    }}
                  >
                    {expandedCard.analysis?.type === "ai-conversation" ? "Reflection Notes" : "Session Notes"}
                  </h2>
                  
                  {!isInlineEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNotes(expandedCard)}
                      className="text-gray-500 hover:text-gray-700 -ml-2"
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}

                  {isInlineEditing && editingCard?.id === expandedCard.id ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        className="min-h-[300px] border-none resize-none focus:ring-0 p-0 text-lg"
                        style={{ 
                          fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", serif',
                          lineHeight: '1.75',
                          fontWeight: '400',
                          letterSpacing: '0.015em'
                        }}
                        placeholder="Enter your notes..."
                      />
                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveEdit}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg cursor-text"
                      style={{ 
                        fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", serif',
                        lineHeight: '1.75',
                        fontWeight: '400',
                        letterSpacing: '0.015em'
                      }}
                      onClick={() => handleEditNotes(expandedCard)}
                    >
                      {cleanText(expandedCard.notes) || "No notes available for this session."}
                    </div>
                  )}
                </div>

                {/* Professional Development Insights */}
                {expandedCard.analysis && expandedCard.analysis.type === "ai-conversation" && (
                  <div className="space-y-12">
                    {/* Consultation Topics */}
                    {expandedCard.analysis.consultationTopics && expandedCard.analysis.consultationTopics.length > 0 && (
                      <div className="space-y-6">
                        <h2 
                          className="text-2xl font-light text-gray-900 dark:text-gray-100"
                          style={{ 
                            fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", serif'
                          }}
                        >
                          Consultation Topics
                        </h2>
                        <div className="flex flex-wrap gap-3">
                          {expandedCard.analysis.consultationTopics.map((topic: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-sm px-4 py-2 bg-purple-50 text-purple-700 border-0 rounded-full">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Learning Themes */}
                    {expandedCard.analysis.learningThemes && expandedCard.analysis.learningThemes.length > 0 && (
                      <div className="space-y-6">
                        <h2 
                          className="text-2xl font-light text-gray-900 dark:text-gray-100"
                          style={{ 
                            fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", serif'
                          }}
                        >
                          Learning Themes
                        </h2>
                        <div 
                          className="space-y-4 text-gray-700 dark:text-gray-300 text-lg"
                          style={{ 
                            fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", serif',
                            lineHeight: '1.6',
                            fontWeight: '400',
                            letterSpacing: '0.015em'
                          }}
                        >
                          {expandedCard.analysis.learningThemes.map((theme: string, index: number) => (
                            <div key={index}>• {cleanText(theme)}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Mind Tags at Bottom - Smaller */}
                <div className="space-y-4 pt-8">
                  <h3 
                    className="text-lg font-light text-gray-500 dark:text-gray-400"
                    style={{ 
                      fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", serif'
                    }}
                  >
                    Mind Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                      #{expandedCard.clientContactHours}h Session
                    </Badge>
                    <Badge variant="secondary" className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                      #{format(new Date(expandedCard.dateOfContact), "MMM yyyy")}
                    </Badge>
                    <Badge variant="secondary" className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                      #Counseling
                    </Badge>
                  </div>
                </div>

              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation dialog */}
      {deleteDialogItem && (
        <Dialog open={!!deleteDialogItem} onOpenChange={() => setDeleteDialogItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Delete Card
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this card from{" "}
                {format(new Date(deleteDialogItem.dateOfContact), "MMMM d, yyyy")}?
                <br />
                <strong className="text-green-600">Your hour tracking data will remain completely intact.</strong>
                <br />
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteDialogItem(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  const isInsightCard = insightCards?.some(card => card.id === deleteDialogItem.id);
                  
                  if (isInsightCard) {
                    await handleDeleteInsightCard(deleteDialogItem.id);
                  } else {
                    await handleDeleteAnalysis(deleteDialogItem.id);
                  }
                  
                  setDeleteDialogItem(null);
                  setExpandedCard(null);
                }}
              >
                Delete Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}