import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { createLogEntry } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export const AddEntryForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateCalendarOpen, setDateCalendarOpen] = useState(false);
  const [supervisionCalendarOpen, setSupervisionCalendarOpen] = useState(false);

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
      notes: "",
    },
  });

  const watchedSupervisionType = watch("supervisionType");
  const watchedSupervisionHours = watch("supervisionHours");
  const watchedIndirectHours = watch("indirectHours");
  const watchedTechAssisted = watch("techAssistedSupervision");
  const watchedDateOfContact = watch("dateOfContact");
  const watchedSupervisionDate = watch("supervisionDate");

  const onSubmit = async (data: InsertLogEntry) => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      await createLogEntry(user.uid, data);
      
      toast({
        title: "Entry saved successfully",
        description: "Your log entry has been recorded.",
      });
      
      reset(); // Reset form after successful submission
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Error saving entry",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Entry</CardTitle>
          <CardDescription>
            Log your client contact hours, supervision, and session notes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Date of Contact */}
            <div className="space-y-2">
              <Label htmlFor="dateOfContact">Date of Contact *</Label>
              <Popover open={dateCalendarOpen} onOpenChange={setDateCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watchedDateOfContact && "text-muted-foreground"
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
                <p className="text-sm text-destructive">{errors.dateOfContact.message}</p>
              )}
            </div>

            {/* Client Contact Hours */}
            <div className="space-y-2">
              <Label htmlFor="clientContactHours">Client Contact Hours *</Label>
              <Input
                id="clientContactHours"
                type="number"
                step="0.25"
                min="0"
                max="24"
                placeholder="8.0"
                {...register("clientContactHours", { valueAsNumber: true })}
              />
              {errors.clientContactHours && (
                <p className="text-sm text-destructive">{errors.clientContactHours.message}</p>
              )}
            </div>

            {/* Indirect Hours Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="indirectHours"
                checked={watchedIndirectHours}
                onCheckedChange={(checked) => setValue("indirectHours", !!checked)}
              />
              <Label
                htmlFor="indirectHours"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                These are indirect hours (documentation, treatment planning, etc.)
              </Label>
            </div>

            {/* Supervision Date */}
            <div className="space-y-2">
              <Label htmlFor="supervisionDate">Supervision Date (Optional)</Label>
              <Popover open={supervisionCalendarOpen} onOpenChange={setSupervisionCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watchedSupervisionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedSupervisionDate ? (
                      format(watchedSupervisionDate, "PPP")
                    ) : (
                      "Pick a date"
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
              {errors.supervisionDate && (
                <p className="text-sm text-destructive">{errors.supervisionDate.message}</p>
              )}
            </div>

            {/* Supervision Hours */}
            <div className="space-y-2">
              <Label htmlFor="supervisionHours">Supervision Hours</Label>
              <Input
                id="supervisionHours"
                type="number"
                step="0.25"
                min="0"
                max="8"
                placeholder="1.0"
                {...register("supervisionHours", { valueAsNumber: true })}
              />
              {errors.supervisionHours && (
                <p className="text-sm text-destructive">{errors.supervisionHours.message}</p>
              )}
            </div>

            {/* Supervision Type */}
            <div className="space-y-2">
              <Label htmlFor="supervisionType">Supervision Type</Label>
              <Select
                value={watchedSupervisionType}
                onValueChange={(value) => setValue("supervisionType", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supervision type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="dyadic">Dyadic</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
              {errors.supervisionType && (
                <p className="text-sm text-destructive">{errors.supervisionType.message}</p>
              )}
            </div>

            {/* Tech-Assisted Supervision */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="techAssistedSupervision"
                checked={watchedTechAssisted}
                onCheckedChange={(checked) => setValue("techAssistedSupervision", !!checked)}
              />
              <Label
                htmlFor="techAssistedSupervision"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Technology-assisted supervision
              </Label>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Session Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter your session notes here... (Remember to anonymize any client information)"
                className="min-h-[120px]"
                {...register("notes")}
              />
              <p className="text-xs text-muted-foreground">
                Important: Ensure all client information is anonymized to protect confidentiality.
              </p>
              {errors.notes && (
                <p className="text-sm text-destructive">{errors.notes.message}</p>
              )}
            </div>

            {/* Validation Summary */}
            {(watchedSupervisionHours > 0 && watchedSupervisionType === "none") && (
              <Alert>
                <AlertDescription>
                  You've entered supervision hours but selected "None" for supervision type. 
                  Please select the appropriate supervision type.
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
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
