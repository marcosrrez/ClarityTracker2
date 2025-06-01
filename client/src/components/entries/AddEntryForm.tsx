import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, Lightbulb, Clock, Zap, ChevronDown, ChevronUp, GraduationCap, Users, Heart, BookOpen } from "lucide-react";
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
  
  // Collapsible sections
  const [showQuickTemplates, setShowQuickTemplates] = useState(true);
  const [showDirectClient, setShowDirectClient] = useState(false);
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
      clientContactHours: 0,
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
          
          {/* Quick Templates - Collapsible */}
          <div className="mb-8">
            <button
              type="button"
              onClick={() => setShowQuickTemplates(!showQuickTemplates)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">Quick Start Templates</h3>
              </div>
              {showQuickTemplates ? (
                <ChevronUp className="w-5 h-5 text-blue-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-blue-500" />
              )}
            </button>
            
            {showQuickTemplates && (
              <div className="mt-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Client Session Template */}
                  <button
                    type="button"
                    onClick={() => applyTemplate('client')}
                    className="group p-6 bg-white dark:bg-gray-800 rounded-2xl border border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                        <Heart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Client Session</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Individual, group, couples, family therapy</p>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">1 hour • Direct contact</div>
                      </div>
                    </div>
                  </button>
                  
                  {/* Supervision Template */}
                  <button
                    type="button"
                    onClick={() => applyTemplate('supervision')}
                    className="group p-6 bg-white dark:bg-gray-800 rounded-2xl border border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                        <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Supervision</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Individual, dyadic, or group supervision</p>
                        <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">1 hour • Required for licensure</div>
                      </div>
                    </div>
                  </button>
                  
                  {/* Professional Development Template */}
                  <button
                    type="button"
                    onClick={() => applyTemplate('development')}
                    className="group p-6 bg-white dark:bg-gray-800 rounded-2xl border border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                        <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Learning & Growth</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Training, workshops, conferences, ethics</p>
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium">2 hours • Professional development</div>
                      </div>
                    </div>
                  </button>
                  
                </div>
              </div>
            )}
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

            {/* Notes Section - Always Visible and Prominent */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center space-x-3 mb-4">
                <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <Label className="text-lg font-semibold text-gray-800 dark:text-white">
                  Session Notes & Reflections
                </Label>
              </div>
              <div className="relative">
                <textarea
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  placeholder="Describe what happened in this session, your interventions, client progress, challenges you faced, insights gained, and your professional reflections. The more detail you provide, the better AI insights you'll receive about your growth patterns and areas for development."
                  rows={8}
                  className="w-full p-4 border border-amber-200 dark:border-amber-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {notesContent.length} characters
                </div>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-3 flex items-center space-x-2">
                <Lightbulb className="w-4 h-4" />
                <span>AI will analyze your notes to identify growth patterns and provide personalized insights.</span>
              </p>
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