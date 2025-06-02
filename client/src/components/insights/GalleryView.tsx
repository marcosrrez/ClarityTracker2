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

      // Add session entries with AI analysis
      if (logEntries) {
        for (const entry of logEntries) {
          if (!entry.notes || entry.notes.trim().length === 0) continue;
          
          // Filter out entries with insufficient content for meaningful insights
          const wordCount = entry.notes.trim().split(/\s+/).length;
          if (wordCount < 10) continue;

          try {
            const analysis = await getAiAnalysis(user?.uid || "", entry.id);
            items.push({
              id: entry.id,
              dateOfContact: new Date(entry.dateOfContact),
              clientContactHours: entry.clientContactHours,
              notes: entry.notes,
              analysis: analysis || undefined,
            });
          } catch (error) {
            items.push({
              id: entry.id,
              dateOfContact: new Date(entry.dateOfContact),
              clientContactHours: entry.clientContactHours,
              notes: entry.notes,
            });
          }
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
  }

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

      {/* Full Page MyMind Style Modal */}
      {expandedCard && (
        <Dialog open={!!expandedCard} onOpenChange={() => setExpandedCard(null)}>
          <DialogContent className="max-w-none w-full h-full p-0 gap-0 bg-gray-50 dark:bg-gray-900 [&>button]:hidden overflow-hidden" aria-describedby="session-description">
            <DialogTitle className="sr-only">Session Details</DialogTitle>
            <DialogDescription id="session-description" className="sr-only">
              View and manage session details with AI analysis and tags
            </DialogDescription>
            <div className="flex flex-col h-full">
              {/* Top Navigation Bar */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setExpandedCard(null)}
                  className="p-2"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  Session from {format(new Date(expandedCard.dateOfContact), "MMMM d, yyyy")}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => {
                      toast({
                        title: "Auto-organize",
                        description: "This session will be automatically tagged and organized into Smart Spaces based on therapeutic modalities and client presentations.",
                      });
                    }}>
                      <Archive className="h-4 w-4 mr-2" />
                      Auto-organize to Space
                    </DropdownMenuItem>
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
                    <DropdownMenuItem onClick={() => {
                      navigator.clipboard.writeText(`Session: ${format(new Date(expandedCard.dateOfContact), "MMMM d, yyyy")}\n\n${expandedCard.notes}`);
                      toast({
                        title: "Copied",
                        description: "Session content copied to clipboard",
                      });
                    }}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy content
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-y-contain" style={{ maxHeight: 'calc(100vh - 80px)' }}>
                <div className="max-w-none p-6 space-y-8 pb-20">
                  {/* Main Title */}
                  <div>
                    <h1 className="text-3xl font-bold text-black dark:text-white mb-6 leading-tight">
                      Session: {format(new Date(expandedCard.dateOfContact), "MMMM d, yyyy")}
                    </h1>
                  </div>

                  {/* TL;DR Box */}
                  {expandedCard.analysis && expandedCard.analysis.summary && (
                    <div className="border border-blue-300 rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20">
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">TL;DR</div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {expandedCard.analysis.summary}
                      </p>
                    </div>
                  )}

                  {/* Comprehensive AI Analysis */}
                  {expandedCard.analysis && (
                    <div className="space-y-6">
                      {/* AI Analysis Header */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-3">AI Analysis</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Generated insights from your session notes
                        </div>
                        
                        {/* Check if this is metadata instead of actual analysis */}
                        {(expandedCard.analysis.type === "insight-card" || expandedCard.analysis.cardType) && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Processing</span>
                            </div>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              This card is being processed for AI analysis. The insights will appear once the analysis is complete.
                            </p>
                          </div>
                        )}

                        {/* AI Conversation Analysis */}
                        {expandedCard.analysis.type === "ai-conversation" && (
                          <div className="space-y-4">
                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">Professional Consultation</span>
                              </div>
                              <p className="text-sm text-purple-700 dark:text-purple-300">
                                This conversation has been analyzed for professional development insights and learning opportunities.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Show message if no structured analysis is available */}
                        {(!expandedCard.analysis.therapeuticModalities?.length && 
                          !expandedCard.analysis.clientPresentation?.length && 
                          !expandedCard.analysis.competencyAreas?.length &&
                          !expandedCard.analysis.themes?.length &&
                          !expandedCard.analysis.keyLearnings?.length &&
                          !expandedCard.analysis.type) && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <p className="text-gray-600 dark:text-gray-400 text-sm italic">
                              No structured analysis available for this session yet.
                            </p>
                          </div>
                        )}
                      </div>
                      {/* Conversation Analysis - Professional Development Insights */}
                      {expandedCard.analysis.type === "ai-conversation" && (
                        <div className="space-y-6">
                          {/* Consultation Topics */}
                          {expandedCard.analysis.consultationTopics && expandedCard.analysis.consultationTopics.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                              <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Consultation Topics</h3>
                              <div className="flex flex-wrap gap-2">
                                {expandedCard.analysis.consultationTopics.map((topic: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Learning Themes */}
                          {expandedCard.analysis.learningThemes && expandedCard.analysis.learningThemes.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                              <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Learning Themes</h3>
                              <ul className="space-y-2">
                                {expandedCard.analysis.learningThemes.map((theme: string, index: number) => (
                                  <li key={index} className="text-gray-700 dark:text-gray-300">• {theme}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Knowledge Areas */}
                          {expandedCard.analysis.knowledgeAreas && expandedCard.analysis.knowledgeAreas.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                              <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Knowledge Areas</h3>
                              <div className="flex flex-wrap gap-2">
                                {expandedCard.analysis.knowledgeAreas.map((area: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                                    {area}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Competency Focus */}
                          {expandedCard.analysis.competencyFocus && expandedCard.analysis.competencyFocus.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                              <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Competency Development</h3>
                              <ul className="space-y-2">
                                {expandedCard.analysis.competencyFocus.map((comp: string, index: number) => (
                                  <li key={index} className="text-gray-700 dark:text-gray-300">• {comp}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Growth Indicators */}
                          {expandedCard.analysis.growthIndicators && expandedCard.analysis.growthIndicators.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                              <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Professional Growth Indicators</h3>
                              <ul className="space-y-2">
                                {expandedCard.analysis.growthIndicators.map((indicator: string, index: number) => (
                                  <li key={index} className="text-gray-700 dark:text-gray-300">• {indicator}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Therapeutic Insights - For Session Notes */}
                      {expandedCard.analysis.type !== "ai-conversation" && expandedCard.analysis.therapeuticModalities && Array.isArray(expandedCard.analysis.therapeuticModalities) && expandedCard.analysis.therapeuticModalities.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Therapeutic Modalities</h3>
                          <div className="flex flex-wrap gap-2">
                            {expandedCard.analysis.therapeuticModalities.map((mod: string, index: number) => (
                              <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                                {mod}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Client Presentation */}
                      {expandedCard.analysis.clientPresentation && Array.isArray(expandedCard.analysis.clientPresentation) && expandedCard.analysis.clientPresentation.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Client Presentation</h3>
                          <ul className="space-y-2">
                            {expandedCard.analysis.clientPresentation.map((item: string, index: number) => (
                              <li key={index} className="text-gray-700 dark:text-gray-300">• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Competency Areas */}
                      {expandedCard.analysis.competencyAreas && Array.isArray(expandedCard.analysis.competencyAreas) && expandedCard.analysis.competencyAreas.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Competency Development</h3>
                          <div className="flex flex-wrap gap-2">
                            {expandedCard.analysis.competencyAreas.map((comp: string, index: number) => (
                              <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                                {comp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key Learnings */}
                      {expandedCard.analysis.keyLearnings && Array.isArray(expandedCard.analysis.keyLearnings) && expandedCard.analysis.keyLearnings.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Key Learnings</h3>
                          <ul className="space-y-2">
                            {expandedCard.analysis.keyLearnings.map((learning: string, index: number) => (
                              <li key={index} className="text-gray-700 dark:text-gray-300">• {learning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Supervision Topics */}
                      {expandedCard.analysis.supervisionTopics && Array.isArray(expandedCard.analysis.supervisionTopics) && expandedCard.analysis.supervisionTopics.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Supervision Topics</h3>
                          <ul className="space-y-2">
                            {expandedCard.analysis.supervisionTopics.map((topic: string, index: number) => (
                              <li key={index} className="text-gray-700 dark:text-gray-300">• {topic}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Reflective Prompts */}
                      {expandedCard.analysis.reflectivePrompts && Array.isArray(expandedCard.analysis.reflectivePrompts) && expandedCard.analysis.reflectivePrompts.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">Reflective Questions</h3>
                          <ul className="space-y-2">
                            {expandedCard.analysis.reflectivePrompts.map((prompt: string, index: number) => (
                              <li key={index} className="text-gray-700 dark:text-gray-300 italic">• {prompt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mind Tags Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">MIND TAGS</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2"
                        onClick={() => {
                          toast({
                            title: "Add tag",
                            description: "Tag functionality coming soon!",
                          });
                        }}
                      >
                        + Add tag
                      </Button>
                      
                      {/* Auto-generated tags */}
                      {expandedCard.analysis?.therapeuticModalities && Array.isArray(expandedCard.analysis.therapeuticModalities) && 
                        expandedCard.analysis.therapeuticModalities.map((mod: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer">
                            # {mod}
                          </Badge>
                        ))
                      }
                      
                      {expandedCard.analysis?.clientPresentation && Array.isArray(expandedCard.analysis.clientPresentation) && 
                        expandedCard.analysis.clientPresentation.map((pres: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer">
                            # {pres}
                          </Badge>
                        ))
                      }
                      
                      {expandedCard.analysis?.competencyAreas && Array.isArray(expandedCard.analysis.competencyAreas) && 
                        expandedCard.analysis.competencyAreas.map((comp: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer">
                            # {comp}
                          </Badge>
                        ))
                      }
                      
                      {/* Fallback to themes */}
                      {(!expandedCard.analysis?.therapeuticModalities && !expandedCard.analysis?.clientPresentation && !expandedCard.analysis?.competencyAreas) && 
                       expandedCard.analysis?.themes && Array.isArray(expandedCard.analysis.themes) && 
                        expandedCard.analysis.themes.map((theme: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer">
                            # {theme}
                          </Badge>
                        ))
                      }
                      
                      {/* Session metadata tags */}
                      <Badge variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700">
                        # {expandedCard.clientContactHours}h Session
                      </Badge>
                      <Badge variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700">
                        # {format(new Date(expandedCard.dateOfContact), "MMMM yyyy")}
                      </Badge>
                      <Badge variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700">
                        # Professional Development
                      </Badge>
                      <Badge variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700">
                        # Therapy Session
                      </Badge>
                      <Badge variant="secondary" className="text-sm px-3 py-1 bg-gray-200 text-gray-700">
                        # Counseling
                      </Badge>
                    </div>
                  </div>

                  {/* Original Session Note */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">ORIGINAL SESSION NOTE</span>
                      {!isInlineEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNotes(expandedCard)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                      {isInlineEditing && editingCard?.id === expandedCard.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editedNotes}
                            onChange={(e) => setEditedNotes(e.target.value)}
                            className="min-h-[200px] border-none resize-none focus:ring-0 p-0 text-base"
                            style={{ 
                              fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", serif',
                              lineHeight: '1.75',
                              fontWeight: '400',
                              letterSpacing: '0.015em'
                            }}
                            placeholder="Enter your session notes..."
                          />
                          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="text-gray-700 dark:text-gray-300 leading-relaxed cursor-text"
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
                  </div>

                  {/* Additional space for content */}
                  <div className="h-32"></div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-center gap-8">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setDeleteDialogItem(expandedCard)}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Share",
                        description: "Share functionality coming soon!",
                      });
                    }}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <MoreHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit notes dialog */}
      {editingCard && (
        <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-blue-500" />
                Edit Notes
              </DialogTitle>
              <DialogDescription>
                Edit the notes for {format(new Date(editingCard.dateOfContact), "MMMM d, yyyy")}. 
                Your hour tracking data will remain unchanged.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Enter your session notes..."
                className="min-h-[200px]"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditingCard(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
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
                  // Check if this is an insight card
                  const isInsightCard = insightCards?.some(card => card.id === deleteDialogItem.id);
                  
                  if (isInsightCard) {
                    await handleDeleteInsightCard(deleteDialogItem.id);
                  } else {
                    await handleDeleteAnalysis(deleteDialogItem.id);
                  }
                  
                  setDeleteDialogItem(null);
                  setExpandedCard(null); // Close the expanded view
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