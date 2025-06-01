import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar, Sparkles, Search, Plus, Bold, Italic, Type, Paperclip, Edit3, Check } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
}

export function MyMindLayout({ galleryItems, onItemClick }: MyMindLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const { toast } = useToast();

  // Filter items based on search
  const filteredItems = galleryItems.filter(item => 
    item.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
    format(new Date(item.dateOfContact), "MMM d, yyyy").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Search Bar - MyMind Style */}
      <div className="sticky top-0 z-40 bg-gray-50 dark:bg-gray-900 p-6">
        <div className="flex items-center gap-4 max-w-2xl">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search my mind..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-full h-14 text-lg"
            />
          </div>
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-14 h-14 p-0 shadow-lg"
            onClick={() => {
              toast({
                title: "Article Scraping",
                description: "Web scraping feature coming soon!",
              });
            }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Masonry Grid Layout - MyMind Style */}
      <div className="px-6 pb-32">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-6 space-y-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="break-inside-avoid mb-6">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                onClick={() => onItemClick(item)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Date and Duration */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(item.dateOfContact), "MMM d, yyyy")}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.clientContactHours}h
                      </Badge>
                    </div>

                    {/* Notes Content */}
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {item.notes}
                    </div>

                    {/* AI Analysis Tags */}
                    {item.analysis && item.analysis.themes && Array.isArray(item.analysis.themes) && (
                      <div className="flex flex-wrap gap-1">
                        {item.analysis.themes.slice(0, 3).map((theme: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {theme}
                          </Badge>
                        ))}
                        {item.analysis.themes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.analysis.themes.length - 3}
                          </Badge>
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
            </div>
          ))}
        </div>
      </div>

      {/* Add Note Card - Fixed at Bottom MyMind Style */}
      <div className="fixed bottom-6 left-6 right-6 z-30">
        <div className="max-w-md mx-auto">
          <Card 
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500 transition-colors cursor-pointer bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
            onClick={() => {
              setShowNoteEditor(true);
              setNoteContent("");
              setNoteTitle("");
              setIsHeaderVisible(true);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  <Plus className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-orange-600 dark:text-orange-400">ADD A NEW NOTE</h3>
                  <p className="text-muted-foreground text-sm">
                    Start typing here...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Note Editor Modal - MyMind Style */}
      <Dialog open={showNoteEditor} onOpenChange={setShowNoteEditor}>
        <DialogContent className="max-w-none w-full h-full p-0 gap-0 bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col h-full">
            {/* Header - hides on scroll */}
            <div className={`transition-all duration-300 ${isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full absolute'}`}>
              <div className="bg-gray-200 dark:bg-gray-800 px-6 py-4 text-center">
                <h2 className="text-lg font-medium text-gray-600 dark:text-gray-300">Create a new note</h2>
              </div>
            </div>

            {/* Content Area */}
            <div 
              className="flex-1 p-8 overflow-y-auto"
              onScroll={(e) => {
                const scrollTop = e.currentTarget.scrollTop;
                setIsHeaderVisible(scrollTop < 50);
              }}
            >
              <div className="max-w-4xl mx-auto">
                {/* Note Header */}
                <div className="mb-8">
                  <p className="text-sm font-medium text-orange-500 dark:text-orange-400 mb-2">ADD A NEW NOTE</p>
                  <Input
                    placeholder="Start typing here..."
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="text-lg font-medium border-none bg-transparent p-0 focus-visible:ring-0 placeholder:text-gray-400"
                    autoFocus
                  />
                </div>

                {/* Note Content */}
                <div className="min-h-[500px]">
                  <Textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write your thoughts, insights, or reflections here..."
                    className="min-h-[500px] border-none bg-transparent resize-none focus-visible:ring-0 text-base leading-relaxed p-0"
                  />
                </div>
              </div>
            </div>

            {/* Floating Toolbar */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-full px-4 py-2 flex items-center gap-4 border border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" className="p-2 h-auto">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 h-auto">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 h-auto">
                  <Type className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 h-auto">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 h-auto">
                  <Edit3 className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-600"></div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 h-auto text-green-600 hover:text-green-700"
                  onClick={() => {
                    // TODO: Save note logic
                    toast({
                      title: "Note Saved",
                      description: "Your note has been saved successfully.",
                    });
                    setShowNoteEditor(false);
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
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
    </div>
  );
}