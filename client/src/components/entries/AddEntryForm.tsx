import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, Lightbulb, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { insertLogEntrySchema } from "@shared/schema";
import type { InsertLogEntry } from "@shared/schema";
import { createLogEntry, createAiAnalysis } from "@/lib/firestore";
import { analyzeSessionNotes } from "@/lib/ai";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useAccountType } from "@/hooks/use-account-type";

export const AddEntryForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isSupervisor, isIndividual } = useAccountType();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateCalendarOpen, setDateCalendarOpen] = useState(false);
  const [supervisionCalendarOpen, setSupervisionCalendarOpen] = useState(false);
  const [notesContent, setNotesContent] = useState("");
  const [selectedSupervisee, setSelectedSupervisee] = useState("");
  const [smartSuggestions, setSmartSuggestions] = useState<Array<{
    field: string;
    value: any;
    reason: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
  const watchedSupervisionType = watch("supervisionType");
  const watchedClientHours = watch("clientContactHours");

  // Smart suggestions based on user patterns
  useEffect(() => {
    const generateSuggestions = () => {
      const suggestions = [];
      const currentHour = new Date().getHours();
      const dayOfWeek = new Date().getDay();
      
      // Time-based suggestions
      if (currentHour >= 9 && currentHour <= 17) {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          suggestions.push({
            field: 'clientContactHours',
            value: 1.5,
            reason: 'Typical weekday session duration'
          });
        }
      }
      
      // Pattern-based suggestions for common session types
      if (!isSupervisor && !watchedClientHours) {
        suggestions.push({
          field: 'clientContactHours',
          value: 1,
          reason: 'Standard therapy session'
        });
      }

      // Professional development suggestions
      if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
        suggestions.push({
          field: 'professionalDevelopmentHours',
          value: 2,
          reason: 'Weekend workshop/training'
        });
      }
      
      setSmartSuggestions(suggestions);
    };

    generateSuggestions();
  }, [watchedClientHours, isSupervisor]);

  const applySuggestion = (suggestion: any) => {
    setValue(suggestion.field, suggestion.value);
    setShowSuggestions(false);
  };

  const onSubmit = async (data: InsertLogEntry) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Create the log entry with notes content
      const finalData = { ...data, notes: notesContent };
      const entryId = await createLogEntry(user.uid, finalData);
      
      // If there are notes, automatically generate AI analysis
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
            title: "Entry saved with AI analysis",
            description: "Your session has been logged and analyzed for insights.",
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
          description: "Your session has been logged.",
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
    <div className="space-y-6">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-black dark:text-white tracking-tight leading-tight">
          {isSupervisor ? "Track your supervision" : "Log your progress"}
        </h1>
        <p className="text-xl font-light text-gray-600 dark:text-gray-400 max-w-2xl">
          {isSupervisor 
            ? "Document meaningful supervision sessions and guide your supervisees toward success."
            : "Capture your professional growth journey with detailed session tracking."
          }
        </p>
      </div>
      
      <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-white/20 shadow-xl rounded-3xl">
        <CardContent className="p-8">
          
          {/* Smart Suggestions Panel */}
          {smartSuggestions.length > 0 && !showSuggestions && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Smart suggestions available
                  </span>
                </div>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowSuggestions(true)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Show
                </Button>
              </div>
            </div>
          )}

          {/* Expanded Suggestions */}
          {showSuggestions && smartSuggestions.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-blue-800 dark:text-blue-200">Quick Fill Options</h3>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowSuggestions(false)}
                  className="text-blue-600 dark:text-blue-400"
                >
                  ×
                </Button>
              </div>
              <div className="space-y-2">
                {smartSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applySuggestion(suggestion)}
                    className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {suggestion.field === 'clientContactHours' ? `${suggestion.value} hour session` : suggestion.value}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {suggestion.reason}
                        </div>
                      </div>
                      <Clock className="w-4 h-4 text-blue-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Date of Contact */}
            <div className="space-y-2">
              <Label htmlFor="dateOfContact" className="text-gray-700 font-medium">Date of Contact *</Label>
              <Popover open={dateCalendarOpen} onOpenChange={setDateCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-xl border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500 dark:bg-gray-800",
                      !watchedDateOfContact && "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedDateOfContact ? (
                      format(watchedDateOfContact, "PPP")
                    ) : (
                      "Pick a date"
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
                <p className="text-sm text-red-500">{errors.dateOfContact.message}</p>
              )}
            </div>

            {/* Client Contact Hours */}
            <div className="space-y-2">
              <Label htmlFor="clientContactHours" className="text-gray-700 font-medium">Client Contact Hours *</Label>
              <Input
                {...register("clientContactHours", { valueAsNumber: true })}
                type="number"
                step="0.25"
                min="0"
                className="rounded-3xl border-gray-200 focus:border-blue-500"
              />
              {errors.clientContactHours && (
                <p className="text-sm text-red-500">{errors.clientContactHours.message}</p>
              )}
            </div>

            {/* Indirect Hours Checkbox */}
            <div className="flex items-center space-x-3">
              <Checkbox
                {...register("indirectHours")}
                id="indirectHours"
                className="rounded border-gray-300"
              />
              <Label htmlFor="indirectHours" className="text-gray-700 font-medium">
                Indirect client contact hours
              </Label>
            </div>

            {/* Professional Development Section */}
            <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
              <h3 className="font-semibold text-gray-900 dark:text-white">Professional Development</h3>
              
              {/* Professional Development Hours */}
              <div className="space-y-2">
                <Label htmlFor="professionalDevelopmentHours" className="text-gray-700 dark:text-gray-300 font-medium">Professional Development Hours</Label>
                <Input
                  {...register("professionalDevelopmentHours", { valueAsNumber: true })}
                  type="number"
                  step="0.25"
                  min="0"
                  className="rounded-3xl border-gray-200 focus:border-green-500"
                />
                {errors.professionalDevelopmentHours && (
                  <p className="text-sm text-red-500">{errors.professionalDevelopmentHours.message}</p>
                )}
              </div>

              {/* Professional Development Type */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Development Type</Label>
                <Select onValueChange={(value) => setValue("professionalDevelopmentType", value as any)}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Select development type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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

            {/* Supervision Section */}
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <h3 className="font-semibold text-gray-900 dark:text-white">Supervision Details</h3>
              
              {/* Supervision Hours */}
              <div className="space-y-2">
                <Label htmlFor="supervisionHours" className="text-gray-700 dark:text-gray-300 font-medium">Supervision Hours</Label>
                <Input
                  {...register("supervisionHours", { valueAsNumber: true })}
                  type="number"
                  step="0.25"
                  min="0"
                  className="rounded-3xl border-gray-200 focus:border-blue-500"
                />
                {errors.supervisionHours && (
                  <p className="text-sm text-red-500">{errors.supervisionHours.message}</p>
                )}
              </div>

              {/* Supervision Type */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Supervision Type</Label>
                <Select onValueChange={(value) => setValue("supervisionType", value as any)}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Select supervision type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="dyadic">Dyadic (Two Supervisees)</SelectItem>
                    <SelectItem value="group">Group (3+ Supervisees)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Supervision Date */}
              {watch("supervisionHours") > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Supervision Date</Label>
                  <Popover open={supervisionCalendarOpen} onOpenChange={setSupervisionCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-xl border-gray-200 hover:border-gray-300",
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

              {/* Tech Assisted Supervision */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  {...register("techAssistedSupervision")}
                  id="techAssistedSupervision"
                  className="rounded border-gray-300"
                />
                <Label htmlFor="techAssistedSupervision" className="text-gray-700 font-medium">
                  Technology-assisted supervision
                </Label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium text-lg">Session Notes</Label>
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <RichTextEditor
                  content={notesContent}
                  onChange={setNotesContent}
                  placeholder="Describe the session, interventions used, client progress, challenges, insights, and your reflections..."
                  minHeight="250px"
                  maxLength={10000}
                  showCharacterCount={true}
                />
              </div>
              <p className="text-sm text-gray-500">
                Use this rich text editor to write detailed session notes. Your notes will be automatically analyzed for professional insights.
              </p>
              {errors.notes && (
                <p className="text-sm text-red-500">{errors.notes.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-base font-medium"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Entry
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};