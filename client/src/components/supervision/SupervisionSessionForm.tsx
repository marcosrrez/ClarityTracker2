import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface SupervisionSessionData {
  superviseeId: string;
  sessionDate: Date;
  durationMinutes: number;
  sessionType: string;
  topics: string;
  notes: string;
  actionItems: string;
}

export const SupervisionSessionForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateCalendarOpen, setDateCalendarOpen] = useState(false);
  const [notesContent, setNotesContent] = useState("");

  // Fetch supervisees for this supervisor
  const { data: supervisees = [], isLoading: loadingSupervisees } = useQuery({
    queryKey: ['/api/supervisees'],
    enabled: !!user,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<SupervisionSessionData>({
    defaultValues: {
      sessionDate: new Date(),
      durationMinutes: 60,
      sessionType: "individual",
      topics: "",
      notes: "",
      actionItems: "",
    },
  });

  const watchedDate = watch("sessionDate");
  const watchedSuperviseeId = watch("superviseeId");

  const onSubmit = async (data: SupervisionSessionData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const sessionData = {
        ...data,
        supervisorId: user.uid,
        notes: notesContent,
      };

      const response = await fetch('/api/supervision/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error('Failed to save supervision session');
      }

      toast({
        title: "Supervision session logged",
        description: "Session has been saved successfully.",
      });

      reset();
      setNotesContent("");
    } catch (error) {
      console.error("Error saving supervision session:", error);
      toast({
        title: "Error saving session",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingSupervisees) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Log Supervision Session</h1>
        <p className="text-muted-foreground">
          Document supervision sessions with your supervisees and track their professional development.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Supervision Session Details
          </CardTitle>
          <CardDescription>
            Record the details of your supervision session for compliance and tracking purposes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Supervisee Selection */}
            <div className="space-y-2">
              <Label>Supervisee *</Label>
              <Select onValueChange={(value) => setValue("superviseeId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supervisee" />
                </SelectTrigger>
                <SelectContent>
                  {supervisees.map((supervisee: any) => (
                    <SelectItem key={supervisee.id} value={supervisee.id}>
                      {supervisee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.superviseeId && (
                <p className="text-sm text-destructive">{errors.superviseeId.message}</p>
              )}
            </div>

            {/* Session Date */}
            <div className="space-y-2">
              <Label>Session Date *</Label>
              <Popover open={dateCalendarOpen} onOpenChange={setDateCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watchedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedDate ? format(watchedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watchedDate}
                    onSelect={(date) => {
                      setValue("sessionDate", date || new Date());
                      setDateCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.sessionDate && (
                <p className="text-sm text-destructive">{errors.sessionDate.message}</p>
              )}
            </div>

            {/* Duration and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (minutes) *</Label>
                <Input
                  type="number"
                  {...register("durationMinutes", { valueAsNumber: true })}
                  placeholder="60"
                />
                {errors.durationMinutes && (
                  <p className="text-sm text-destructive">{errors.durationMinutes.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Session Type *</Label>
                <Select onValueChange={(value) => setValue("sessionType", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Supervision</SelectItem>
                    <SelectItem value="group">Group Supervision</SelectItem>
                    <SelectItem value="case_consultation">Case Consultation</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                  </SelectContent>
                </Select>
                {errors.sessionType && (
                  <p className="text-sm text-destructive">{errors.sessionType.message}</p>
                )}
              </div>
            </div>

            {/* Topics Discussed */}
            <div className="space-y-2">
              <Label>Topics Discussed</Label>
              <Textarea
                placeholder="Key areas discussed in this session (e.g., case conceptualization, therapeutic techniques, ethical considerations)"
                {...register("topics")}
                className="min-h-[80px]"
              />
            </div>

            {/* Session Notes */}
            <div className="space-y-2">
              <Label>Session Notes</Label>
              <RichTextEditor
                content={notesContent}
                onChange={setNotesContent}
                placeholder="Document session highlights, supervisee progress, challenges discussed, and insights gained..."
                className="min-h-[200px]"
              />
            </div>

            {/* Action Items */}
            <div className="space-y-2">
              <Label>Action Items & Next Steps</Label>
              <Textarea
                placeholder="Specific action items for supervisee, goals for next session, resources to review..."
                {...register("actionItems")}
                className="min-h-[100px]"
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Saving Session...
                </>
              ) : (
                "Save Supervision Session"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};