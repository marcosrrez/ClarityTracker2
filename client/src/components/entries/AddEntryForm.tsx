import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, Lightbulb, Clock, Zap, ChevronDown, ChevronUp, GraduationCap, Users, Heart, BookOpen, Bold, Italic, List, Quote, Maximize2, Minimize2, Type, Palette, Link2, Code, AlignLeft, AlignCenter, AlignRight, Brain, Sparkles } from "lucide-react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { insertLogEntrySchema } from "@shared/schema";
import type { InsertLogEntry } from "@shared/schema";
import { createLogEntry, createAiAnalysis } from "@/lib/firestore";
import { analyzeSessionNotes } from "@/lib/ai";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export const AddEntryForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateCalendarOpen, setDateCalendarOpen] = useState(false);
  const [supervisionCalendarOpen, setSupervisionCalendarOpen] = useState(false);
  const [notesContent, setNotesContent] = useState("");
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Rich text editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      TextStyle,
      Color,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setNotesContent(editor.getHTML());
    },
  });
  
  // Collapsible sections - Default to client session
  const [showDirectClient, setShowDirectClient] = useState(true);
  const [showSupervision, setShowSupervision] = useState(false);
  const [showProfDev, setShowProfDev] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<InsertLogEntry>({
    resolver: zodResolver(insertLogEntrySchema),
    defaultValues: {
      dateOfContact: new Date(),
      clientContactHours: 1,
      indirectHours: false,
      supervisionHours: 0,
      supervisionType: "none",
      techAssistedSupervision: false,
      professionalDevelopmentHours: 0,
      professionalDevelopmentType: "none",
      notes: "",
    },
  });

  const watchedDateOfContact = watch("dateOfContact");
  const watchedSupervisionDate = watch("supervisionDate");
  const watchedSupervisionHours = watch("supervisionHours");

  const handleAiAnalysis = async () => {
    const noteText = editor?.getText() || "";
    if (!noteText.trim()) {
      toast({
        title: "No notes to analyze",
        description: "Please add some notes before requesting AI analysis.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use AI analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeSessionNotes(noteText);
      setAiAnalysis(analysis);
      
      // Save the analysis to the gallery and dashboard data
      const logEntry = {
        dateOfContact: new Date(),
        clientContactHours: 0,
        indirectHours: false,
        supervisionHours: 0,
        supervisionType: "none" as const,
        techAssistedSupervision: false,
        professionalDevelopmentHours: 0,
        professionalDevelopmentType: "none" as const,
        notes: noteText
      };

      const logEntryId = await createLogEntry(user.uid, logEntry);

      // Save the AI analysis linked to the log entry
      const aiAnalysisData = {
        logEntryId: logEntryId,
        summary: analysis.summary,
        themes: analysis.themes,
        potentialBlindSpots: analysis.potentialBlindSpots || [],
        reflectivePrompts: analysis.reflectivePrompts,
        keyLearnings: analysis.keyLearnings || [],
        ccsrCategory: analysis.ccsrCategory || "General",
        originalNotesSnapshot: noteText
      };

      await createAiAnalysis(user.uid, aiAnalysisData);
      
      toast({
        title: "Analysis Complete",
        description: "Your insights have been saved to your gallery and will appear in your dashboard.",
      });
    } catch (error) {
      console.error("AI analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "Unable to analyze your notes. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyTemplate = (template: 'client' | 'supervision' | 'development') => {
    // Reset all values first
    setValue("clientContactHours", 0);
    setValue("indirectHours", false);
    setValue("supervisionHours", 0);
    setValue("professionalDevelopmentHours", 0);
    setValue("supervisionType", "none");
    setValue("professionalDevelopmentType", "none");
    setValue("techAssistedSupervision", false);
    
    // Close all sections
    setShowDirectClient(false);
    setShowSupervision(false);
    setShowProfDev(false);
    
    // Apply template and open relevant section
    switch (template) {
      case 'client':
        setValue("clientContactHours", 1);
        setShowDirectClient(true);
        break;
      case 'supervision':
        setValue("supervisionHours", 1);
        setValue("supervisionType", "individual");
        setShowSupervision(true);
        break;
      case 'development':
        setValue("professionalDevelopmentHours", 2);
        setValue("professionalDevelopmentType", "workshop");
        setShowProfDev(true);
        break;
    }
  };

  const onSubmit = async (data: InsertLogEntry) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const finalData = { ...data, notes: notesContent };
      const entryId = await createLogEntry(user.uid, finalData);
      
      if (notesContent && notesContent.trim().length > 0) {
        try {
          const analysis = await analyzeSessionNotes(notesContent);
          await createAiAnalysis(user.uid, {
            logEntryId: entryId,
            originalNotesSnapshot: notesContent,
            summary: analysis.summary,
            themes: analysis.themes,
            potentialBlindSpots: analysis.potentialBlindSpots,
            reflectivePrompts: analysis.reflectivePrompts,
            keyLearnings: analysis.keyLearnings,
            ccsrCategory: analysis.ccsrCategory,
          });
          
          toast({
            title: "Entry saved with AI insights",
            description: "Your session has been logged and analyzed for professional growth patterns.",
          });
        } catch (aiError) {
          console.error("AI analysis failed:", aiError);
          toast({
            title: "Entry saved successfully",
            description: "Your session has been logged. AI analysis will be available once configured.",
          });
        }
      } else {
        toast({
          title: "Entry saved successfully",
          description: "Your professional activity has been logged.",
        });
      }
      
      reset();
      setNotesContent("");
      editor?.commands.clearContent();
    } catch (error) {
      console.error("Error creating entry:", error);
      toast({
        title: "Error saving entry",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Beautiful Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-black dark:text-white tracking-tight leading-tight">
          Document your journey
        </h1>
        <p className="text-xl font-light text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Every session, supervision meeting, and learning experience brings you closer to licensure. 
          <span className="text-blue-600 dark:text-blue-400 font-medium"> AI insights included.</span>
        </p>
      </div>
      
      <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border border-white/20 shadow-2xl rounded-3xl max-w-4xl mx-auto">
        <CardContent className="p-8">
          
          {/* Quick Templates - Icon-like Cards */}
          <div className="mb-10">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Quick Start</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose your activity type to get started</p>
            </div>
            
            <div className="flex items-center justify-center gap-6">
              
              {/* Client Session Icon - Premium & Intuitive */}
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => applyTemplate('client')}
                  className={cn(
                    "w-20 h-20 rounded-2xl transition-all duration-400 ease-out hover:scale-105 focus:outline-none focus:ring-3 focus:ring-blue-200 dark:focus:ring-blue-700 flex items-center justify-center relative backdrop-blur-sm",
                    showDirectClient
                      ? "bg-blue-600/95 shadow-xl shadow-blue-500/30 ring-2 ring-blue-300 dark:ring-blue-600"
                      : "bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 shadow-lg hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600"
                  )}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <Heart className={cn(
                      "w-7 h-7 transition-all duration-200",
                      showDirectClient 
                        ? "text-white" 
                        : "text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                    )} />
                    <span className={cn(
                      "text-xs font-medium transition-colors duration-200",
                      showDirectClient 
                        ? "text-white/90" 
                        : "text-gray-600 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                    )}>
                      Client
                    </span>
                  </div>
                  {showDirectClient && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full border-3 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
                
                {/* Hover Tooltip */}
                <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 w-56 backdrop-blur-sm">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Client Session</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Individual, group, couples, family therapy</p>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Default • Direct contact</div>
                  </div>
                </div>
              </div>
              
              {/* Supervision Icon - Premium & Intuitive */}
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => applyTemplate('supervision')}
                  className={cn(
                    "w-20 h-20 rounded-2xl transition-all duration-400 ease-out hover:scale-105 focus:outline-none focus:ring-3 focus:ring-purple-200 dark:focus:ring-purple-700 flex items-center justify-center relative backdrop-blur-sm",
                    showSupervision
                      ? "bg-purple-600/95 shadow-xl shadow-purple-500/30 ring-2 ring-purple-300 dark:ring-purple-600"
                      : "bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 shadow-lg hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-600"
                  )}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <Users className={cn(
                      "w-7 h-7 transition-all duration-200",
                      showSupervision 
                        ? "text-white" 
                        : "text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300"
                    )} />
                    <span className={cn(
                      "text-xs font-medium transition-colors duration-200",
                      showSupervision 
                        ? "text-white/90" 
                        : "text-gray-600 dark:text-gray-400 group-hover:text-purple-700 dark:group-hover:text-purple-300"
                    )}>
                      Supervision
                    </span>
                  </div>
                  {showSupervision && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full border-3 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
                
                {/* Hover Tooltip */}
                <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 w-56 backdrop-blur-sm">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Supervision</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Individual, dyadic, or group supervision</p>
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Required for licensure</div>
                  </div>
                </div>
              </div>
              
              {/* Professional Development Icon - Premium & Intuitive */}
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => applyTemplate('development')}
                  className={cn(
                    "w-20 h-20 rounded-2xl transition-all duration-400 ease-out hover:scale-105 focus:outline-none focus:ring-3 focus:ring-emerald-200 dark:focus:ring-emerald-700 flex items-center justify-center relative backdrop-blur-sm",
                    showProfDev
                      ? "bg-emerald-600/95 shadow-xl shadow-emerald-500/30 ring-2 ring-emerald-300 dark:ring-emerald-600"
                      : "bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 shadow-lg hover:shadow-xl hover:border-emerald-300 dark:hover:border-emerald-600"
                  )}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <GraduationCap className={cn(
                      "w-7 h-7 transition-all duration-200",
                      showProfDev 
                        ? "text-white" 
                        : "text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300"
                    )} />
                    <span className={cn(
                      "text-xs font-medium transition-colors duration-200",
                      showProfDev 
                        ? "text-white/90" 
                        : "text-gray-600 dark:text-gray-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300"
                    )}>
                      Learning
                    </span>
                  </div>
                  {showProfDev && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full border-3 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
                
                {/* Hover Tooltip */}
                <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 w-56 backdrop-blur-sm">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Learning & Growth</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Training, workshops, conferences, ethics</p>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Professional development</div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Essential Date Field - Always Visible */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl">
              <Label htmlFor="dateOfContact" className="text-lg font-semibold text-gray-800 dark:text-white mb-3 block">
                Date of Activity
              </Label>
              <Popover open={dateCalendarOpen} onOpenChange={setDateCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-base h-12 rounded-xl border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500 dark:bg-gray-800",
                      !watchedDateOfContact && "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5" />
                    {watchedDateOfContact ? (
                      format(watchedDateOfContact, "EEEE, MMMM do, yyyy")
                    ) : (
                      "Select the date of your activity"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watchedDateOfContact}
                    onSelect={(date) => {
                      setValue("dateOfContact", date || new Date());
                      setDateCalendarOpen(false);
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dateOfContact && (
                <p className="text-sm text-red-500 mt-2">{errors.dateOfContact.message}</p>
              )}
            </div>

            {/* Client Contact Section - Collapsible */}
            {showDirectClient && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl overflow-hidden border border-blue-200 dark:border-blue-800">
                <button
                  type="button"
                  onClick={() => setShowDirectClient(!showDirectClient)}
                  className="w-full p-4 flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Client Contact Details</h3>
                  </div>
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                </button>
                
                <div className="p-6 pt-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientContactHours" className="text-gray-700 dark:text-gray-300 font-medium">Hours</Label>
                      <Input
                        {...register("clientContactHours", { valueAsNumber: true })}
                        type="number"
                        step="0.25"
                        min="0"
                        max="24"
                        className="rounded-xl border-gray-200 focus:border-blue-500 h-12"
                      />
                      {errors.clientContactHours && (
                        <p className="text-sm text-red-500">{errors.clientContactHours.message}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 pt-8">
                      <Checkbox
                        {...register("indirectHours")}
                        id="indirectHours"
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="indirectHours" className="text-gray-700 dark:text-gray-300 font-medium">
                        Includes indirect hours (notes, prep, coordination)
                      </Label>
                    </div>
                  </div>
                  
                  {/* Quick hour buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setValue("clientContactHours", 0.5)}
                      className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      30 min
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("clientContactHours", 1)}
                      className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      1 hour
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("clientContactHours", 1.5)}
                      className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      90 min
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("techAssistedSupervision", !watch("techAssistedSupervision"))}
                      className={cn(
                        "px-3 py-1 text-sm rounded-full transition-colors",
                        watch("techAssistedSupervision")
                          ? "bg-blue-600 text-white"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                      )}
                    >
                      Telehealth
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Supervision Section - Collapsible */}
            {showSupervision && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl overflow-hidden border border-purple-200 dark:border-purple-800">
                <button
                  type="button"
                  onClick={() => setShowSupervision(!showSupervision)}
                  className="w-full p-4 flex items-center justify-between hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Supervision Details</h3>
                  </div>
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                </button>
                
                <div className="p-6 pt-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supervisionHours" className="text-gray-700 dark:text-gray-300 font-medium">Hours</Label>
                      <Input
                        {...register("supervisionHours", { valueAsNumber: true })}
                        type="number"
                        step="0.25"
                        min="0"
                        max="8"
                        className="rounded-xl border-gray-200 focus:border-purple-500 h-12"
                      />
                      {errors.supervisionHours && (
                        <p className="text-sm text-red-500">{errors.supervisionHours.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300 font-medium">Type</Label>
                      <Select onValueChange={(value) => setValue("supervisionType", value as any)}>
                        <SelectTrigger className="rounded-xl border-gray-200 h-12">
                          <SelectValue placeholder="Select supervision type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="dyadic">Dyadic (Two supervisees)</SelectItem>
                          <SelectItem value="group">Group (3+ supervisees)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {watchedSupervisionHours > 0 && (
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300 font-medium">Supervision Date</Label>
                      <Popover open={supervisionCalendarOpen} onOpenChange={setSupervisionCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal rounded-xl border-gray-200 hover:border-gray-300 h-12",
                              !watchedSupervisionDate && "text-gray-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {watchedSupervisionDate ? (
                              format(watchedSupervisionDate, "PPP")
                            ) : (
                              "Pick supervision date"
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={watchedSupervisionDate}
                            onSelect={(date) => {
                              setValue("supervisionDate", date);
                              setSupervisionCalendarOpen(false);
                            }}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      {...register("techAssistedSupervision")}
                      id="techAssistedSupervision"
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="techAssistedSupervision" className="text-gray-700 dark:text-gray-300 font-medium">
                      Technology-assisted supervision (video, phone)
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Professional Development Section - Collapsible */}
            {showProfDev && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl overflow-hidden border border-green-200 dark:border-green-800">
                <button
                  type="button"
                  onClick={() => setShowProfDev(!showProfDev)}
                  className="w-full p-4 flex items-center justify-between hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Professional Development</h3>
                  </div>
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                </button>
                
                <div className="p-6 pt-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="professionalDevelopmentHours" className="text-gray-700 dark:text-gray-300 font-medium">Hours</Label>
                      <Input
                        {...register("professionalDevelopmentHours", { valueAsNumber: true })}
                        type="number"
                        step="0.25"
                        min="0"
                        className="rounded-xl border-gray-200 focus:border-green-500 h-12"
                      />
                      {errors.professionalDevelopmentHours && (
                        <p className="text-sm text-red-500">{errors.professionalDevelopmentHours.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300 font-medium">Type</Label>
                      <Select onValueChange={(value) => setValue("professionalDevelopmentType", value as any)}>
                        <SelectTrigger className="rounded-xl border-gray-200 h-12">
                          <SelectValue placeholder="Select development type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ethics">Ethics Training</SelectItem>
                          <SelectItem value="workshop">Workshop/Seminar</SelectItem>
                          <SelectItem value="conference">Conference</SelectItem>
                          <SelectItem value="webinar">Webinar</SelectItem>
                          <SelectItem value="reading">Professional Reading</SelectItem>
                          <SelectItem value="research">Research Activity</SelectItem>
                          <SelectItem value="consultation">Peer Consultation</SelectItem>
                          <SelectItem value="training">Specialized Training</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Luxurious Expandable Notes Section */}
            <div className={cn(
              "bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-500 ease-out",
              isNotesExpanded ? "fixed inset-4 z-50 shadow-2xl" : "p-8"
            )}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <Label className="text-xl font-medium text-gray-900 dark:text-white">
                    Session Notes & Reflections
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 group"
                  title={isNotesExpanded ? "Minimize notes" : "Expand notes for full writing experience"}
                >
                  {isNotesExpanded ? (
                    <Minimize2 className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200" />
                  ) : (
                    <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200" />
                  )}
                </button>
              </div>

              <div className={cn("space-y-4", isNotesExpanded && "p-8 h-full overflow-y-auto")}>
                {/* Rich Text Editor Toolbar */}
                {editor && (
                  <div className="space-y-3">
                    {/* Basic Toolbar */}
                    <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={cn(
                          "p-3 rounded-xl transition-all duration-200",
                          editor.isActive('bold')
                            ? "bg-blue-500 text-white shadow-md"
                            : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                        )}
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={cn(
                          "p-3 rounded-xl transition-all duration-200",
                          editor.isActive('italic')
                            ? "bg-blue-500 text-white shadow-md"
                            : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                        )}
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={cn(
                          "p-3 rounded-xl transition-all duration-200",
                          editor.isActive('bulletList')
                            ? "bg-blue-500 text-white shadow-md"
                            : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                        )}
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        className={cn(
                          "p-3 rounded-xl transition-all duration-200",
                          editor.isActive('highlight')
                            ? "bg-yellow-500 text-white shadow-md"
                            : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                        )}
                        title="Highlight text"
                      >
                        <Lightbulb className="w-4 h-4" />
                      </button>

                      {/* AI Analysis Button */}
                      <div className="group relative ml-1">
                        <button
                          type="button"
                          onClick={handleAiAnalysis}
                          disabled={isAnalyzing || !editor?.getText().trim()}
                          className={cn(
                            "p-3 rounded-xl transition-all duration-200 relative",
                            isAnalyzing 
                              ? "bg-blue-500 text-white cursor-not-allowed"
                              : !editor?.getText().trim()
                              ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                              : "hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          )}
                        >
                          {isAnalyzing ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                          ) : (
                            <Zap className={cn(
                              "w-4 h-4",
                              editor?.getText().trim() && !isAnalyzing && "animate-pulse"
                            )} />
                          )}
                        </button>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                          <div className="bg-black text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                            {!editor?.getText().trim() 
                              ? "Add notes to enable AI analysis"
                              : isAnalyzing
                              ? "Analyzing your notes..."
                              : "Get AI insights from your notes"
                            }
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                          </div>
                        </div>
                      </div>

                      {/* Advanced Tools Toggle - Only in expanded mode */}
                      {isNotesExpanded && (
                        <>
                          <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2" />
                          <button
                            type="button"
                            onClick={() => setShowAdvancedTools(!showAdvancedTools)}
                            className="p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all duration-200"
                            title="More formatting options"
                          >
                            <Type className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Advanced Toolbar - Collapsible */}
                    {isNotesExpanded && showAdvancedTools && (
                      <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
                        <button
                          type="button"
                          onClick={() => editor.chain().focus().toggleOrderedList().run()}
                          className={cn(
                            "p-3 rounded-xl transition-all duration-200",
                            editor.isActive('orderedList')
                              ? "bg-blue-500 text-white shadow-md"
                              : "hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                          )}
                        >
                          <span className="text-sm font-mono">1.</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => editor.chain().focus().toggleBlockquote().run()}
                          className={cn(
                            "p-3 rounded-xl transition-all duration-200",
                            editor.isActive('blockquote')
                              ? "bg-blue-500 text-white shadow-md"
                              : "hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                          )}
                        >
                          <Quote className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                          className={cn(
                            "p-3 rounded-xl transition-all duration-200",
                            editor.isActive('codeBlock')
                              ? "bg-blue-500 text-white shadow-md"
                              : "hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                          )}
                        >
                          <Code className="w-4 h-4" />
                        </button>
                        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          Advanced Formatting
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Premium Writing Experience - Rich Text Editor */}
                <div className="relative">
                  <div className={cn(
                    "p-12 border-0 bg-white dark:bg-gray-900 transition-all duration-300",
                    isNotesExpanded ? "min-h-[calc(100vh-320px)]" : "min-h-[400px]"
                  )}>
                    <EditorContent 
                      editor={editor} 
                      className={cn(
                        "prose dark:prose-invert max-w-none focus:outline-none premium-writing",
                        isNotesExpanded ? "prose-xl" : "prose-lg",
                        "[&_.ProseMirror]:min-h-[300px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none"
                      )}
                    />
                    {!editor?.getText() && (
                      <div className="absolute top-12 left-12 text-gray-400 dark:text-gray-500 pointer-events-none leading-relaxed select-none" style={{
                        fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
                        fontSize: isNotesExpanded ? '1.125rem' : '1rem',
                        lineHeight: '1.75'
                      }}>
                        Describe what happened in this session, your interventions, client progress, challenges you faced, insights gained, and your professional reflections.
                        {isNotesExpanded && (
                          <div className="mt-6 text-base opacity-75">
                            Use this expanded space to capture detailed thoughts, therapeutic process notes, supervision insights, or learning reflections with full formatting support.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-6 right-6 text-xs text-gray-400 font-medium bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
                    {editor?.getText().length || 0} characters
                  </div>
                </div>

                {/* AI Analysis Results - Positioned directly below notes */}
                {aiAnalysis && (
                  <div className="mt-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">AI Analysis Results</h3>
                      <div className="ml-auto text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded-full">
                        Saved to Gallery
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {aiAnalysis.summary && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Summary</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{aiAnalysis.summary}</p>
                        </div>
                      )}
                      
                      {aiAnalysis.themes && aiAnalysis.themes.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Key Themes</h4>
                          <div className="flex flex-wrap gap-2">
                            {aiAnalysis.themes.map((theme: string, index: number) => (
                              <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                {theme}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {aiAnalysis.reflectivePrompts && aiAnalysis.reflectivePrompts.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Reflective Questions</h4>
                          <ul className="space-y-2">
                            {aiAnalysis.reflectivePrompts.map((prompt: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                                <span className="text-blue-500 mt-0.5 font-medium">?</span>
                                {prompt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiAnalysis.keyLearnings && aiAnalysis.keyLearnings.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Key Learnings</h4>
                          <ul className="space-y-1">
                            {aiAnalysis.keyLearnings.map((learning: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                <span className="text-emerald-500 mt-1">→</span>
                                {learning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="mr-3 h-5 w-5" />
                    Saving your progress...
                  </>
                ) : (
                  <>
                    <Check className="mr-3 h-5 w-5" />
                    Save & Generate AI Insights
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};