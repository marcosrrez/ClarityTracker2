import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Sparkles, Search, Plus, Filter, Tags, Upload, Download, Mail, X, Send, MessageCircle } from "lucide-react";
import { GrokStyleCoach } from "../ai/GrokStyleCoach";
import { LoadingQuoteCompact } from "@/components/ui/loading-quote";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { createInsightCard } from "@/lib/firestore";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Placeholder from '@tiptap/extension-placeholder';
import { ResourceWidget } from "./ResourceWidget";
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

export function MyMindLayout({ galleryItems, onItemClick, onRefresh }: MyMindLayoutProps) {
  const [searchValue, setSearchValue] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showBottomNav, setShowBottomNav] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [showResourceWidget, setShowResourceWidget] = useState(false);

  const { toast } = useToast();

  // Filter gallery items based on search and filters
  const filteredItems = galleryItems.filter(item => {
    const matchesSearch = !searchValue || 
      item.notes.toLowerCase().includes(searchValue.toLowerCase()) ||
      (item.analysis?.themes && item.analysis.themes.some((theme: string) => 
        theme.toLowerCase().includes(searchValue.toLowerCase())
      ));
    
    const matchesFilter = !filterTag || 
      (item.analysis?.themes && item.analysis.themes.includes(filterTag));
    
    return matchesSearch && matchesFilter;
  });

  // Get all unique themes for filter options
  const allThemes = Array.from(new Set(
    galleryItems.flatMap(item => item.analysis?.themes || [])
  ));

  // Rich text editor setup
  const editorInstance = useEditor({
    extensions: [
      StarterKit,
      Underline,
      BulletList,
      ListItem,
      OrderedList,
      Placeholder.configure({
        placeholder: 'Start writing your note...'
      })
    ],
    content: noteContent,
    onUpdate: ({ editor }) => {
      setNoteContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4'
      }
    }
  });

  useEffect(() => {
    if (editorInstance && noteContent !== editorInstance.getHTML()) {
      editorInstance.commands.setContent(noteContent);
    }
  }, [noteContent, editorInstance]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBottomNav(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    
    setIsSaving(true);
    try {
      const newNote: InsertInsightCard = {
        userId: 'current-user',
        type: 'note',
        title: noteTitle || 'Untitled Note',
        content: noteContent,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await createInsightCard(newNote);
      
      toast({
        title: "Note saved",
        description: "Your note has been saved successfully.",
      });

      setShowNoteEditor(false);
      setNoteContent("");
      setNoteTitle("");
      onRefresh?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-900 dark:via-slate-800/50 dark:to-indigo-900/10">
      {/* Header */}
      <div className={`sticky top-0 z-20 transition-all duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Insights & Resources
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {filteredItems.length} insights
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(!showSearch)}
                  className="text-gray-600 dark:text-gray-400"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResourceWidget(true)}
                  className="text-gray-600 dark:text-gray-400"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            {showSearch && (
              <div className="mt-4 flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search insights..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={filterTag || ""}
                  onChange={(e) => setFilterTag(e.target.value || null)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800"
                >
                  <option value="">All themes</option>
                  {allThemes.map(theme => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 py-6 pb-24">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No insights found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchValue || filterTag ? "Try adjusting your search or filters" : "Start by adding your first note or session"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredItems.map((item) => (
              <Card 
                key={item.id} 
                className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50"
                onClick={() => onItemClick(item)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {format(item.dateOfContact, 'MMM d, yyyy')}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {item.clientContactHours}h
                      </span>
                    </div>

                    {/* Notes Content */}
                    <div className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      {(() => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = item.notes || '';
                        const plainText = tempDiv.textContent || tempDiv.innerText || '';
                        const cleanedText = plainText.trim();
                        return cleanedText.length > 100 ? `${cleanedText.substring(0, 100)}...` : cleanedText;
                      })()}
                    </div>

                    {/* Insights Preview */}
                    {item.analysis && (
                      <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
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
                        
                        {item.analysis.keyLearnings && Array.isArray(item.analysis.keyLearnings) && item.analysis.keyLearnings.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                            <span className="font-medium">{item.analysis.keyLearnings.length} insight{item.analysis.keyLearnings.length !== 1 ? 's' : ''}</span>
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

      {/* Bottom Navigation Panel */}
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

      {/* Grok-Style AI Coach Interface */}
      <GrokStyleCoach 
        isOpen={showAIAgent} 
        onClose={() => setShowAIAgent(false)} 
      />

      {/* Note Editor */}
      <Dialog open={showNoteEditor} onOpenChange={setShowNoteEditor}>
        <DialogContent className="max-w-none w-full h-full p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">Note Editor</DialogTitle>
          <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNoteEditor(false)}
                  className="text-gray-600 dark:text-gray-400"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Note title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="border-none bg-transparent text-lg font-semibold focus-visible:ring-0 px-0"
                />
              </div>
              <Button
                onClick={handleSaveNote}
                disabled={isSaving || !noteContent.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-hidden">
              <EditorContent 
                editor={editorInstance}
                className="h-full overflow-y-auto"
              />
            </div>
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