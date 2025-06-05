import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Sparkles, Search, Plus, Filter, Tags, Upload, Download, Mail, X, Send, MessageCircle, Globe } from "lucide-react";
import { LoadingQuoteCompact } from "@/components/ui/loading-quote";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { createInsightCard } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { ResourceWidget } from "./ResourceWidget";
import { CustomRichEditor } from "@/components/ui/custom-rich-editor";
import { DynamicInputBox } from "@/components/ui/dynamic-input-box";
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
  const [showThreads, setShowThreads] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState('default');
  const [threads, setThreads] = useState<{[key: string]: any[]}>({
    'default': []
  });
  const [threadTitles, setThreadTitles] = useState<{[key: string]: string}>({
    'default': 'Conversation with Dinger'
  });
  const [aiInputValue, setAiInputValue] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Get current thread messages
  const aiMessages = threads[currentThreadId] || [];
  
  // Enhanced scroll detection functions
  const isAtBottom = () => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return true;
    
    const threshold = 100; // pixels from bottom
    return chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < threshold;
  };

  const scrollToBottom = () => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
      });
      setUserScrolledUp(false);
      setShowScrollToBottom(false);
    }
  };

  // Handle scroll events to show/hide scroll-to-bottom button
  const handleScroll = () => {
    const atBottom = isAtBottom();
    setShowScrollToBottom(!atBottom);
    setUserScrolledUp(!atBottom);
  };

  // Auto-scroll to bottom when new messages are added (only if user hasn't scrolled up)
  useEffect(() => {
    if (aiMessages.length > 0 && !userScrolledUp) {
      const timer = setTimeout(() => {
        if (isAtBottom() || !userScrolledUp) {
          scrollToBottom();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [aiMessages.length, isAiLoading, userScrolledUp]);

  // Handle viewport changes for mobile keyboard
  useEffect(() => {
    const handleResize = () => {
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer && aiMessages.length > 0) {
        setTimeout(() => {
          chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
          });
        }, 300);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [aiMessages.length]);

  // Handle AI Coach message sending
  const handleSendAiMessage = async () => {
    if (!aiInputValue.trim() || isAiLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      content: aiInputValue.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setThreads(prev => ({
      ...prev,
      [currentThreadId]: [...(prev[currentThreadId] || []), userMessage]
    }));
    setAiInputValue('');
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/ai/coaching-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: user?.uid,
          conversationHistory: aiMessages.slice(-10)
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date()
      };

      setThreads(prev => ({
        ...prev,
        [currentThreadId]: [...(prev[currentThreadId] || []), aiMessage]
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Try to get a relevant response from counseling dataset
      let fallbackResponse = "I'm having trouble connecting right now. Please try again in a moment.";
      
      try {
        const fallbackResp = await fetch('/api/ai/counseling-fallback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: userMessage.content }),
        });
        
        if (fallbackResp.ok) {
          const fallbackData = await fallbackResp.json();
          fallbackResponse = fallbackData.response;
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: fallbackResponse,
        isUser: false,
        timestamp: new Date()
      };
      setThreads(prev => ({
        ...prev,
        [currentThreadId]: [...(prev[currentThreadId] || []), errorMessage]
      }));
    } finally {
      setIsAiLoading(false);
    }
  };

  // Auto-scroll to bottom of AI chat
  useEffect(() => {
    if (aiMessagesEndRef.current) {
      aiMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages]);

  // Create new thread
  const createNewThread = () => {
    const newThreadId = `thread_${Date.now()}`;
    const greeting = user?.displayName ? `Hey ${user.displayName}, great to meet you. I'm Dinger, your personal AI.` : "Hey there, great to meet you. I'm Dinger, your personal AI.";
    
    setThreads(prev => ({
      ...prev,
      [newThreadId]: [
        {
          id: '1',
          content: greeting,
          isUser: false,
          timestamp: new Date()
        },
        {
          id: '2', 
          content: "My goal is to be useful, friendly and fun. Ask me for advice, for answers, or let's talk about whatever's on your mind.",
          isUser: false,
          timestamp: new Date()
        },
        {
          id: '3',
          content: "How's your day going?",
          isUser: false,
          timestamp: new Date()
        }
      ]
    }));
    
    setThreadTitles(prev => ({
      ...prev,
      [newThreadId]: 'New conversation'
    }));
    
    setCurrentThreadId(newThreadId);
    setShowThreads(false);
  };
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isProcessingSmartSearch, setIsProcessingSmartSearch] = useState(false);
  const [historicalInsights, setHistoricalInsights] = useState<any[]>([]);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
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

  // Fetch historical AI insights when AI insights filter is selected
  useEffect(() => {
    const fetchHistoricalInsights = async () => {
      if (selectedSmartSpace === "ai-insights" && user?.uid) {
        try {
          const response = await fetch(`/api/ai/insights-history/${user.uid}`);
          if (response.ok) {
            const insights = await response.json();
            setHistoricalInsights(insights);
          }
        } catch (error) {
          console.error('Error fetching historical insights:', error);
        }
      }
    };

    fetchHistoricalInsights();
  }, [selectedSmartSpace, user?.uid]);

  // Export historical insights to CSV
  const handleExportInsights = () => {
    if (selectedSmartSpace !== "ai-insights" || historicalInsights.length === 0) return;

    const headers = ['Date', 'Type', 'Title', 'Content', 'Action Taken', 'Helpful'];
    const csvData = historicalInsights.map(insight => [
      new Date(insight.createdAt).toLocaleDateString(),
      insight.type,
      insight.title,
      insight.content.replace(/"/g, '""'),
      insight.actionTaken || '',
      insight.helpful ? 'Yes' : 'No'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-insights-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Your AI insights history has been downloaded as CSV.",
    });
  };

  // Email historical insights
  const handleEmailInsights = async () => {
    if (selectedSmartSpace !== "ai-insights" || historicalInsights.length === 0) return;

    try {
      const response = await fetch('/api/insights/email-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.uid,
          insights: historicalInsights,
          userEmail: user?.email
        }),
      });

      if (response.ok) {
        toast({
          title: "Email Sent",
          description: "Your AI insights history has been emailed to you.",
        });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      toast({
        title: "Email Failed",
        description: "Failed to send email. Please try again or use the export feature.",
        variant: "destructive",
      });
    }
  };

  // Smart search functionality for URLs and content
  const handleSmartSearch = async (query: string) => {
    if (!user || !query.trim()) return;

    // Check if it's a URL
    const urlPattern = /^(https?:\/\/[^\s]+)/i;
    const isUrl = urlPattern.test(query.trim());

    // Check if it's a large content paste (more than 100 characters)
    const isLargeContent = query.length > 100;

    if (isUrl || isLargeContent) {
      setIsProcessingSmartSearch(true);
      
      try {
        let content = query;
        let title = "Smart Search Entry";
        
        if (isUrl) {
          // For URL scraping, we'd need to add a backend endpoint
          title = `Web Content: ${query}`;
          content = `URL: ${query}\n\nNote: URL content scraping feature coming soon.`;
        } else {
          title = `Pasted Content - ${new Date().toLocaleDateString()}`;
        }

        const newCard: InsertInsightCard = {
          type: 'note',
          title,
          content,
          tags: ['smart-search', isUrl ? 'url-content' : 'pasted-content'],
        };

        await createInsightCard(user.uid, newCard);
        
        if (onRefresh) {
          await onRefresh();
        }

        setSearchQuery("");
        
        toast({
          title: "Content Added",
          description: isUrl ? "URL saved as insight card" : "Content saved as insight card",
        });
        
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save content",
          variant: "destructive",
        });
      } finally {
        setIsProcessingSmartSearch(false);
      }
    } else {
      // For regular search queries, don't clear the input - just filter the results
      // The filtering is already handled by the search logic in the display items
    }
  };

  // Action handlers for smart search buttons
  const handleCreateInsightCard = async (content: string) => {
    if (!user || !content.trim()) return;
    
    setIsProcessingSmartSearch(true);
    try {
      const newCard = {
        type: 'note' as const,
        title: `Quick Note - ${new Date().toLocaleDateString()}`,
        content: content.trim(),
        tags: ['quick-note'],
      };

      await createInsightCard(user.uid, newCard);
      setSearchQuery("");
      
      toast({
        title: "Insight Created",
        description: "Your content has been saved as an insight card",
      });

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create insight card",
        variant: "destructive",
      });
    } finally {
      setIsProcessingSmartSearch(false);
    }
  };

  const handleScrapeUrl = async (url: string) => {
    if (!user || !url.trim()) return;
    
    setIsProcessingSmartSearch(true);
    try {
      // For now, save URL as placeholder - web scraping would need backend endpoint
      const newCard = {
        type: 'note' as const,
        title: `Web Content: ${new URL(url).hostname}`,
        content: `URL: ${url}\n\nNote: Web scraping feature coming soon. URL saved for reference.`,
        tags: ['url-content', 'web-scraping'],
      };

      await createInsightCard(user.uid, newCard);
      setSearchQuery("");
      
      toast({
        title: "URL Saved",
        description: "URL saved as insight card. Web scraping feature coming soon.",
      });

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save URL",
        variant: "destructive",
      });
    } finally {
      setIsProcessingSmartSearch(false);
    }
  };

  const handleAIAnalysis = async (content: string) => {
    if (!user || !content.trim()) return;
    
    setIsProcessingSmartSearch(true);
    try {
      const response = await fetch('/api/ai/analyze-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const data = await response.json();
      
      // Format the analysis with clean typography and proper spacing
      const formattedAnalysis = data.analysis
        .replace(/\*\*(.*?)\*\*/g, '\n\n$1\n\n') // Remove bold markdown but add spacing
        .replace(/## (.*?)(\n|$)/g, '\n\n$1:\n\n') // Convert headings to titles with colons and spacing
        .replace(/\* /g, '\n• ') // Convert asterisks to bullets with line breaks
        .replace(/(\.)(\s*)([A-Z][^.]*:)/g, '$1\n\n$3') // Break before topic headers
        .replace(/(\.)(\s*)([A-Z])/g, '$1\n\n$3') // Break sentences into paragraphs
        .replace(/([a-z]:)(\s*)([A-Z])/g, '$1\n\n$3') // Break after colons
        .replace(/\n{4,}/g, '\n\n\n') // Allow triple spacing for better section breaks
        .trim();

      const newCard = {
        type: 'note' as const,
        title: `AI Analysis - ${new Date().toLocaleDateString()}`,
        content: `Original Content:\n\n${content}\n\n\nProfessional Analysis:\n\n${formattedAnalysis}`,
        tags: ['ai-analysis', 'analyzed-content'],
      };

      await createInsightCard(user.uid, newCard);
      setSearchQuery("");
      
      const remaining = data.remainingAnalyses || 0;
      toast({
        title: "AI Analysis Complete",
        description: `Content analyzed and saved. ${remaining} AI analyses remaining today.`,
      });

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      // Check if it's a limit error
      if (error instanceof Error && error.message.includes('Failed to analyze content')) {
        try {
          const errorResponse = await fetch('/api/ai/analyze-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content.trim(), userId: user.uid }),
          });
          
          if (errorResponse.status === 429) {
            const errorData = await errorResponse.json();
            await handleCreateInsightCard(content);
            toast({
              title: "Daily Limit Reached",
              description: errorData.analysis,
            });
            return;
          }
        } catch (limitCheckError) {
          // Continue with fallback
        }
      }
      
      // Fallback to simple save if AI analysis fails
      await handleCreateInsightCard(content);
      toast({
        title: "Content Saved",
        description: "AI analysis unavailable, content saved as insight card",
      });
    } finally {
      setIsProcessingSmartSearch(false);
    }
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSmartSearch(searchQuery);
    }
  };

  // Get items to display based on selected Smart Space
  const getDisplayItems = () => {
    if (selectedSmartSpace === "ai-insights") {
      // Return historical insights when AI insights filter is selected
      return historicalInsights.map(insight => ({
        id: insight.id,
        dateOfContact: new Date(insight.createdAt),
        clientContactHours: 0, // AI insights don't have contact hours
        notes: insight.content,
        analysis: {
          summary: insight.title,
          type: insight.type,
          helpful: insight.helpful,
          actionTaken: insight.actionTaken
        }
      }));
    }
    return galleryItems;
  };

  // Super smart search - incredibly easy and intuitive
  const filteredItems = getDisplayItems().filter(item => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    // Search in notes content - exact and partial matches
    const notesText = cleanText(item.notes).toLowerCase();
    if (notesText.includes(query)) return true;
    
    // Enhanced date search - multiple formats
    const itemDate = new Date(item.dateOfContact);
    const dateFormats = [
      format(itemDate, "MMMM").toLowerCase(), // "June"
      format(itemDate, "MMM").toLowerCase(),  // "Jun"  
      format(itemDate, "MMMM yyyy").toLowerCase(), // "June 2024"
      format(itemDate, "MMM yyyy").toLowerCase(),  // "Jun 2024"
      format(itemDate, "MMMM d").toLowerCase(),    // "June 15"
      format(itemDate, "MMM d").toLowerCase(),     // "Jun 15"
      format(itemDate, "MMMM d, yyyy").toLowerCase(), // "June 15, 2024"
      format(itemDate, "MMM d, yyyy").toLowerCase(),  // "Jun 15, 2024"
      format(itemDate, "yyyy").toLowerCase(),      // "2024"
      format(itemDate, "M/d/yyyy").toLowerCase(),  // "6/15/2024"
      format(itemDate, "M-d-yyyy").toLowerCase(),  // "6-15-2024"
    ];
    
    if (dateFormats.some(dateStr => dateStr.includes(query))) return true;
    
    // Search by session duration
    const hourStr = `${item.clientContactHours}h`;
    const hoursStr = `${item.clientContactHours} hour`;
    if (hourStr.includes(query) || hoursStr.includes(query)) return true;
    
    // Word-based search in all content
    const queryWords = query.split(' ').filter(word => word.length > 2);
    const allContent = [
      notesText,
      ...dateFormats,
      hourStr,
      hoursStr
    ].join(' ');
    
    if (queryWords.length > 0 && queryWords.every(word => allContent.includes(word))) return true;
    
    // Search in AI analysis fields if available
    if (item.analysis) {
      const analysis = item.analysis;
      const analysisContent = [];
      
      // Collect all analysis text with safe array checks
      if (analysis.summary) analysisContent.push(cleanText(analysis.summary).toLowerCase());
      if (analysis.themes && Array.isArray(analysis.themes)) analysisContent.push(...analysis.themes.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.therapeuticModalities && Array.isArray(analysis.therapeuticModalities)) analysisContent.push(...analysis.therapeuticModalities.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.clientPresentation && Array.isArray(analysis.clientPresentation)) analysisContent.push(...analysis.clientPresentation.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.competencyAreas && Array.isArray(analysis.competencyAreas)) analysisContent.push(...analysis.competencyAreas.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.emotionalContent && Array.isArray(analysis.emotionalContent)) analysisContent.push(...analysis.emotionalContent.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.keyLearnings && Array.isArray(analysis.keyLearnings)) analysisContent.push(...analysis.keyLearnings.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.reflectivePrompts && Array.isArray(analysis.reflectivePrompts)) analysisContent.push(...analysis.reflectivePrompts.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.supervisionTopics) analysisContent.push(...analysis.supervisionTopics.map((t: string) => cleanText(t).toLowerCase()));
      if (analysis.professionalGrowthAreas) analysisContent.push(...analysis.professionalGrowthAreas.map((t: string) => cleanText(t).toLowerCase()));
      
      const analysisText = analysisContent.join(' ');
      
      // Direct search in analysis content
      if (analysisText.includes(query)) return true;
      
      // Word-based search in analysis
      if (queryWords.length > 0 && queryWords.every(word => analysisText.includes(word))) return true;
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
      
      const finalTitle = noteTitle || "Untitled Note";
      
      // Check if note meets minimum length for AI analysis
      const wordCount = noteContent.trim().split(/\s+/).length;
      let analysisData = null;
      
      if (wordCount >= 10) {
        try {
          // Import AI analysis function
          const { analyzeSessionNotes } = await import("@/lib/ai");
          analysisData = await analyzeSessionNotes(noteContent);
        } catch (aiError) {
          console.log("AI analysis skipped for note:", aiError);
          // Continue saving note even if AI analysis fails
        }
      }
      
      // Create a single note without duplicating content
      const newNote: InsertInsightCard = {
        type: "note",
        title: finalTitle,
        content: noteContent, // Store rich text content directly
        tags: analysisData ? 
          ["reflection", "personal-note", "ai-analyzed", ...analysisData.themes.slice(0, 3)] : 
          ["reflection", "personal-note"],
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
        title: analysisData ? "Note analyzed and saved" : "Note saved",
        description: analysisData ? 
          "Your reflection has been analyzed and added to your insights for growth tracking." :
          "Your reflection has been added to your insights.",
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
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Search Bar & Smart Spaces - Always visible when typing */}
      <div className={`bg-gray-50 dark:bg-gray-900 p-4 pt-1 flex-shrink-0 transition-transform duration-300 ${(showBottomNav || searchQuery.trim()) ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="space-y-4">
          {/* Main Search Bar with Action Buttons */}
          <div className="flex items-center gap-3 max-w-5xl">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              
              {/* Action Icons Next to Search Icon */}
              {searchQuery.trim() && !isProcessingSmartSearch && (
                <div className="absolute left-12 top-1/2 transform -translate-y-1/2 flex items-center">
                  {/* Create Insight Card */}
                  <button
                    onClick={() => handleCreateInsightCard(searchQuery)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Save as insight card"
                  >
                    <Plus className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                  </button>
                  
                  {/* Scrape URL */}
                  {searchQuery.match(/^https?:\/\//) && (
                    <button
                      onClick={() => handleScrapeUrl(searchQuery)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Save URL"
                    >
                      <Globe className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                    </button>
                  )}
                  
                  {/* AI Analysis */}
                  <button
                    onClick={() => handleAIAnalysis(searchQuery)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Analyze with AI"
                  >
                    <Sparkles className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                  </button>
                </div>
              )}
              
              <Input
                placeholder="Type to search or use action buttons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Default to search/filter when Enter is pressed
                    e.preventDefault();
                  }
                }}
                disabled={isProcessingSmartSearch}
                className={`${searchQuery.trim() && !isProcessingSmartSearch ? 'pl-36' : 'pl-12'} pr-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-full h-12 text-base transition-all`}
              />
              
              {isProcessingSmartSearch && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button 
              className="w-8 h-8 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200/30 dark:border-gray-700/30 flex items-center justify-center hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={() => setShowSmartSpaces(!showSmartSpaces)}
            >
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button 
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-colors"
              onClick={() => setShowResourceWidget(true)}
            >
              <Plus className="h-4 w-4" />
            </button>
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
                  onClick={() => {
                    setSelectedSmartSpace("all");
                    setShowSmartSpaces(false);
                  }}
                >
                  All Sessions
                </Button>
                <Button
                  variant={selectedSmartSpace === "ai-insights" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => {
                    setSelectedSmartSpace("ai-insights");
                    setShowSmartSpaces(false);
                  }}
                >
                  AI Insights History
                </Button>
                <Button
                  variant={selectedSmartSpace === "anxiety-treatment" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => {
                    setSelectedSmartSpace("anxiety-treatment");
                    setShowSmartSpaces(false);
                  }}
                >
                  Anxiety Treatment
                </Button>
                <Button
                  variant={selectedSmartSpace === "trauma-work" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => {
                    setSelectedSmartSpace("trauma-work");
                    setShowSmartSpaces(false);
                  }}
                >
                  Trauma Work
                </Button>
                <Button
                  variant={selectedSmartSpace === "cbt-sessions" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => {
                    setSelectedSmartSpace("cbt-sessions");
                    setShowSmartSpaces(false);
                  }}
                >
                  CBT Sessions
                </Button>
                <Button
                  variant={selectedSmartSpace === "crisis-intervention" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => {
                    setSelectedSmartSpace("crisis-intervention");
                    setShowSmartSpaces(false);
                  }}
                >
                  Crisis Intervention
                </Button>
                <Button
                  variant={selectedSmartSpace === "supervision-prep" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => {
                    setSelectedSmartSpace("supervision-prep");
                    setShowSmartSpaces(false);
                  }}
                >
                  Supervision Prep
                </Button>
                <Button
                  variant={selectedSmartSpace === "challenging-cases" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => {
                    setSelectedSmartSpace("challenging-cases");
                    setShowSmartSpaces(false);
                  }}
                >
                  Challenging Cases
                </Button>
              </div>
              
              {/* Export/Email buttons for AI Insights History */}
              {selectedSmartSpace === "ai-insights" && historicalInsights.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExportInsights}
                      className="text-xs flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Export CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEmailInsights}
                      className="text-xs flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      Email Report
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Masonry Grid Layout - MyMind Style for Maximum Cards */}
      <div 
        ref={scrollContainerRef}
        className={`flex-1 px-4 pb-20 overflow-y-auto scrollbar-hide ${showBottomNav ? 'pt-0' : '-mt-16 pt-16'}`}
      >
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
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white dark:bg-gray-800 border-0 rounded-2xl overflow-hidden h-fit shadow-sm"
                onClick={() => onItemClick(item)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Date and Duration - Minimal */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 tracking-wide">
                        {format(new Date(item.dateOfContact), "MMM d")}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {item.clientContactHours}h
                      </span>
                    </div>

                    {/* Notes Content - Premium Typography */}
                    <div 
                      className="text-gray-800 dark:text-gray-200 leading-relaxed"
                      style={{ 
                        fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                        fontSize: '0.9rem',
                        lineHeight: '1.6',
                        letterSpacing: '0.01em'
                      }}
                    >
                      {(() => {
                        // Create a temporary div to strip HTML tags properly
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = item.notes || '';
                        const plainText = tempDiv.textContent || tempDiv.innerText || '';
                        const cleanedText = plainText.trim();
                        return cleanedText.length > 100 ? `${cleanedText.substring(0, 100)}...` : cleanedText;
                      })()}
                    </div>

                    {/* Elegant Insights Preview */}
                    {item.analysis && (
                      <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        {/* Primary Themes - Clean and Minimal */}
                        {item.analysis.themes && Array.isArray(item.analysis.themes) && item.analysis.themes.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.analysis.themes.slice(0, 2).map((theme: string, index: number) => (
                              <span 
                                key={index} 
                                className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                              >
                                {theme}
                              </span>
                            ))}
                            {item.analysis.themes.length > 2 && (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
                                +{item.analysis.themes.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Key Learning Indicator */}
                        {item.analysis.keyLearnings && Array.isArray(item.analysis.keyLearnings) && item.analysis.keyLearnings.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                            <span className="font-medium">{item.analysis.keyLearnings.length} insight{item.analysis.keyLearnings.length !== 1 ? 's' : ''}</span>
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

      {/* Compact Bottom Navigation Panel - Replit Style */}
      <div className={`fixed bottom-0 left-0 right-0 z-30 transition-all duration-300 ${showBottomNav ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="bg-gradient-to-t from-gray-50/90 to-transparent dark:from-gray-900/90 dark:to-transparent pt-2 pb-2">
          <div className="max-w-xs mx-auto px-3">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full border border-gray-200/30 dark:border-gray-700/30 shadow-lg px-3 py-1">
              <div className="flex items-center justify-center gap-0">
                {/* Add Note Button */}
                <button
                  onClick={() => {
                    setShowNoteEditor(true);
                    setNoteContent("");
                    setNoteTitle("");
                    setIsHeaderVisible(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center group-hover:bg-blue-500/20 dark:group-hover:bg-blue-400/20 transition-colors">
                    <Plus className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Add Note</span>
                </button>

                {/* AI Coach Button */}
                <button
                  onClick={() => setShowAIAgent(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center group-hover:bg-emerald-500/20 dark:group-hover:bg-emerald-400/20 transition-colors">
                    <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">AI Coach</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Coach Interface - Enhanced Elegant Design */}
      <Dialog open={showAIAgent} onOpenChange={setShowAIAgent}>
        <DialogContent className="max-w-none w-full h-full p-0 gap-0 bg-[#FEFEFE] dark:bg-[#0D0D0D] [&>button]:hidden" aria-describedby="ai-coach-description">
          <DialogTitle className="sr-only">AI Coach Conversation</DialogTitle>
          <div className="flex flex-col h-full">
            
            {/* Ultra Minimal Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-2 bg-[#FEFEFE] dark:bg-[#0D0D0D]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowThreads(true)}
                className="flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-0.5">
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                </div>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIAgent(false)}
                className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </div>

            {/* Modern Chat Interface - Fixed Height with Proper Scrolling */}
            <div 
              ref={chatContainerRef}
              className="overflow-y-auto relative" 
              style={{ 
                scrollBehavior: 'smooth',
                height: 'calc(100vh - 45px - 90px)', // Optimized for more chat space
                maxHeight: 'calc(100vh - 45px - 90px)'
              }} 
              id="chat-container"
              onScroll={handleScroll}
            >
              <div className="max-w-4xl mx-auto px-4 md:px-8 pb-8">
                
                {/* ChatGPT Style Welcome State */}
                {aiMessages.length === 0 && !isAiLoading && (
                  <div className="text-center space-y-6 py-16 min-h-[60vh] flex flex-col justify-center">
                    <div className="mb-20">
                      <h1 className="text-4xl font-normal text-gray-900 dark:text-white">
                        Ready when you are.
                      </h1>
                    </div>
                  </div>
                )}

                {/* Conversation Messages */}
                <div>
                  {aiMessages.length > 0 && (
                    <div className="space-y-8 py-8">
                      {aiMessages.map((message, index) => (
                        <div key={message.id} className="space-y-1">
                          {message.isUser ? (
                            /* User Message - Clean, no bubble */
                            <div className="flex justify-end mb-6">
                              <div className="max-w-3xl">
                                <div 
                                  className="text-gray-900 dark:text-gray-100"
                                  style={{ 
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                    fontSize: '1rem',
                                    lineHeight: '1.6',
                                    letterSpacing: '0.005em'
                                  }}
                                >
                                  {message.content}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* AI Response - Full width, enhanced readability */
                            <div className="w-full mb-8">
                              <div 
                                className="text-gray-800 dark:text-gray-200 max-w-none"
                                style={{ 
                                  fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                                  fontSize: '1.125rem',
                                  lineHeight: '1.9',
                                  letterSpacing: '0.015em',
                                  fontWeight: '400'
                                }}
                                dangerouslySetInnerHTML={{
                                  __html: message.content
                                    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong>$1</strong>')
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                    .split('\n\n')
                                    .map((paragraph: string) => paragraph.trim())
                                    .filter((paragraph: string) => paragraph.length > 0)
                                    .map((paragraph: string) => `<p style="margin-bottom: 1.5rem;">${paragraph}</p>`)
                                    .join('')
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Dynamic Thinking Indicator */}
                  {isAiLoading && (
                    <div className="py-8">
                      <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span 
                          className="text-sm italic transition-opacity duration-300"
                          style={{ 
                            fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                          }}
                        >
                          {(() => {
                            const messages = [
                              "Dinger is thinking...",
                              "Processing your question...",
                              "Considering the best response...",
                              "Gathering insights...",
                              "Almost ready..."
                            ];
                            return messages[Math.floor(Date.now() / 2000) % messages.length];
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div ref={aiMessagesEndRef} className="h-px" />
              </div>

              {/* Scroll to Bottom Button - Compact Design */}
              {showScrollToBottom && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-16 right-4 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center z-40 border border-white/20 dark:border-gray-800/20"
                  title="Scroll to bottom"
                  aria-label="Scroll to latest message"
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              )}
            </div>

            {/* Dynamic Input Box - Enhanced with all requested features */}
            <DynamicInputBox
              onSubmit={(message) => {
                const userMessage = {
                  id: Date.now().toString(),
                  content: message.trim(),
                  isUser: true,
                  timestamp: new Date()
                };

                setThreads(prev => ({
                  ...prev,
                  [currentThreadId]: [...(prev[currentThreadId] || []), userMessage]
                }));
                setIsAiLoading(true);

                // AI response handling
                fetch('/api/ai/coaching-chat', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    message: userMessage.content,
                    userId: user?.uid,
                    conversationHistory: aiMessages.slice(-10)
                  }),
                })
                .then(response => response.json())
                .then(data => {
                  const aiResponse = {
                    id: Date.now().toString() + '_ai',
                    content: data.response || "I'm here to help with your counseling journey!",
                    isUser: false,
                    timestamp: new Date()
                  };
                  
                  setThreads(prev => ({
                    ...prev,
                    [currentThreadId]: [...(prev[currentThreadId] || []), aiResponse]
                  }));
                })
                .catch(error => {
                  console.error('AI response error:', error);
                  const errorResponse = {
                    id: Date.now().toString() + '_error',
                    content: "I'm having trouble connecting right now. Please try again.",
                    isUser: false,
                    timestamp: new Date()
                  };
                  
                  setThreads(prev => ({
                    ...prev,
                    [currentThreadId]: [...(prev[currentThreadId] || []), errorResponse]
                  }));
                })
                .finally(() => {
                  setIsAiLoading(false);
                });
              }}
              placeholder="Ask about counseling theories, DSM, clinical practice, or business guidance..."
              isConversationActive={aiMessages.length > 0}
              className="bg-[#FEFEFE] dark:bg-[#0D0D0D]"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Threads Panel - Enhanced Elegant Design */}
      <Dialog open={showThreads} onOpenChange={setShowThreads}>
        <DialogContent className="max-w-none w-full h-full p-0 gap-0 bg-[#FEFEFE] dark:bg-[#0D0D0D]">
          <DialogTitle className="sr-only">Conversation Threads</DialogTitle>
          <div className="flex flex-col h-full">
            
            {/* Refined Threads Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100/50 dark:border-gray-800/50">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowThreads(false)}
                  className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
                <h2 
                  className="text-2xl font-light text-gray-900 dark:text-gray-100"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    letterSpacing: '-0.01em'
                  }}
                >
                  Conversations
                </h2>
              </div>
              
              <Button
                onClick={createNewThread}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 hover:from-indigo-600 hover:via-purple-600 hover:to-blue-700 text-white rounded-xl text-sm shadow-sm transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                New Conversation
              </Button>
            </div>

            {/* Enhanced Threads List */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="space-y-4 max-w-2xl mx-auto">
                {Object.entries(threads).map(([threadId, messages]) => {
                  const lastMessage = messages[messages.length - 1];
                  const threadTitle = threadTitles[threadId] || 'Conversation';
                  const isActive = threadId === currentThreadId;
                  
                  return (
                    <div
                      key={threadId}
                      onClick={() => {
                        setCurrentThreadId(threadId);
                        setShowThreads(false);
                      }}
                      className={`p-6 rounded-2xl cursor-pointer transition-all duration-200 border ${
                        isActive 
                          ? 'bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700' 
                          : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="font-medium text-gray-900 dark:text-gray-100 truncate mb-2"
                            style={{ 
                              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                              fontSize: '1rem',
                              letterSpacing: '-0.005em'
                            }}
                          >
                            {threadTitle}
                          </h3>
                          <p 
                            className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-3"
                            style={{ 
                              fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                              fontSize: '0.875rem',
                              lineHeight: '1.5'
                            }}
                          >
                            {lastMessage?.content || 'No messages yet'}
                          </p>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {lastMessage?.timestamp ? new Date(lastMessage.timestamp).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            }) : ''}
                          </div>
                        </div>
                        
                        {isActive && (
                          <div className="w-2.5 h-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex-shrink-0 ml-4 mt-1" />
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {Object.keys(threads).length === 0 && (
                  <div className="text-center py-16">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No conversations yet</p>
                    <p className="text-sm text-gray-400 mt-1">Start a new thread to begin chatting with Dinger</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Focus Mode Note Editor - MyMind Style */}
      <Dialog open={showNoteEditor} onOpenChange={setShowNoteEditor}>
        <DialogContent className="max-w-none w-full h-full p-0 gap-0 bg-white dark:bg-gray-900" aria-describedby="note-editor-description">
          <DialogTitle className="sr-only">Create New Note</DialogTitle>
          <div className="flex flex-col h-full">
            {/* Content Area */}
            <div 
              className="flex-1 p-12 overflow-y-auto"
              onScroll={(e) => {
                const scrollTop = e.currentTarget.scrollTop;
                setIsHeaderVisible(scrollTop < 50);
              }}
            >
              <div className="max-w-2xl mx-auto pt-20">
                {/* Note Title - Borderless and Free */}
                <input
                  ref={(el) => {
                    if (el && !noteTitle && !noteContent) {
                      setTimeout(() => el.focus(), 100);
                    }
                  }}
                  type="text"
                  placeholder="Type your headline here."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const textarea = e.currentTarget.parentElement?.querySelector('textarea');
                      if (textarea) {
                        textarea.focus();
                        textarea.setSelectionRange(0, 0);
                      }
                    }
                  }}
                  className="w-full text-4xl font-light bg-transparent border-none outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-gray-900 dark:text-gray-100 mb-4"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontWeight: '300',
                    lineHeight: '1.2',
                    letterSpacing: '-0.02em'
                  }}
                />
                
                {/* Content Editor - Premium Writing Experience */}
                <div className="flex-1 min-h-[500px] relative">
                  <CustomRichEditor
                    content={noteContent}
                    onChange={setNoteContent}
                    placeholder="Start writing right here...

💡PRO TIP: Use the formatting toolbar below to style your text. Write naturally and let your thoughts flow."
                    className="h-full min-h-[500px] border-none shadow-none bg-transparent"
                    minHeight="500px"
                    onEditorReady={setEditorInstance}
                  />
                </div>
              </div>
            </div>

            {/* Vertically Expandable Floating Toolbar */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className={`bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 ${
                isToolbarExpanded 
                  ? 'rounded-2xl px-4 py-4 flex flex-col gap-3' 
                  : 'rounded-full px-6 py-3 flex flex-row gap-2'
              }`}>
                
                {/* Core Tools Row - Always Visible */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                    onClick={() => {
                      if (editorInstance) {
                        editorInstance.chain().focus().toggleBold().run();
                      }
                    }}
                    title="Bold"
                  >
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">B</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                    onClick={() => {
                      if (editorInstance) {
                        editorInstance.chain().focus().toggleItalic().run();
                      }
                    }}
                    title="Italic"
                  >
                    <span className="text-sm italic text-gray-700 dark:text-gray-300">I</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                    onClick={() => {
                      if (editorInstance) {
                        editorInstance.chain().focus().toggleUnderline().run();
                      }
                    }}
                    title="Underline"
                  >
                    <span className="text-sm underline text-gray-700 dark:text-gray-300">U</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                    onClick={() => {
                      if (editorInstance) {
                        editorInstance.chain().focus().toggleBulletList().run();
                      }
                    }}
                    title="List"
                  >
                    <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                    </svg>
                  </Button>
                  
                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-600"></div>
                  
                  {/* Expand/Collapse Button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                    onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
                    title={isToolbarExpanded ? "Collapse Tools" : "More Tools"}
                  >
                    <svg 
                      className={`w-4 h-4 text-gray-700 dark:text-gray-300 transition-transform duration-200 ${
                        isToolbarExpanded ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                  
                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-600"></div>
                  
                  {/* Save Button - Always Visible */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 h-auto text-green-600 hover:text-green-700 disabled:opacity-50 w-8 h-8 rounded-full flex items-center justify-center"
                    onClick={handleSaveNote}
                    disabled={isSaving || !noteContent.trim()}
                    title="Save Note"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </Button>
                </div>

                {/* Expanded Tools - Show when expanded */}
                {isToolbarExpanded && (
                  <>
                    {/* Divider */}
                    <div className="h-px bg-gray-200 dark:bg-gray-600"></div>
                    
                    {/* Headings Row */}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                        onClick={() => {
                          if (editorInstance) {
                            editorInstance.chain().focus().toggleHeading({ level: 1 }).run();
                          }
                        }}
                        title="Heading 1"
                      >
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">H1</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                        onClick={() => {
                          if (editorInstance) {
                            editorInstance.chain().focus().toggleHeading({ level: 2 }).run();
                          }
                        }}
                        title="Heading 2"
                      >
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">H2</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                        onClick={() => {
                          if (editorInstance) {
                            editorInstance.chain().focus().toggleHeading({ level: 3 }).run();
                          }
                        }}
                        title="Heading 3"
                      >
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">H3</span>
                      </Button>
                    </div>
                    
                    {/* Lists and Formatting Row */}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                        onClick={() => {
                          if (editorInstance) {
                            editorInstance.chain().focus().toggleHighlight().run();
                          }
                        }}
                        title="Highlight"
                      >
                        <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                        onClick={() => {
                          if (editorInstance) {
                            editorInstance.chain().focus().toggleOrderedList().run();
                          }
                        }}
                        title="Numbered List"
                      >
                        <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 8h18M3 12h18m-9 4h9" />
                        </svg>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                        onClick={() => {
                          if (editorInstance) {
                            editorInstance.chain().focus().toggleBlockquote().run();
                          }
                        }}
                        title="Quote"
                      >
                        <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7" />
                        </svg>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                        onClick={() => {
                          if (editorInstance) {
                            editorInstance.chain().focus().setHorizontalRule().run();
                          }
                        }}
                        title="Divider"
                      >
                        <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </Button>
                    </div>
                  </>
                )}
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


    </div>
  );
}