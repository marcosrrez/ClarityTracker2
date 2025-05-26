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

  const watchedDateOfContact = watch("dateOfContact");
  const watchedSupervisionDate = watch("supervisionDate");
  const watchedSupervisionType = watch("supervisionType");

  const onSubmit = async (data: InsertLogEntry) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      await createLogEntry(user.uid, data);
      toast({
        title: "Entry saved successfully",
        description: "Your session has been logged.",
      });
      reset();
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
    <div className="max-w-2xl mx-auto">
      {/* Notion-style clean white form */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Entry</h1>
            <p className="text-gray-500 font-medium">
              Log your client contact hours, supervision, and session notes.
            </p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Date of Contact */}
            <div className="space-y-2">
              <Label htmlFor="dateOfContact" className="text-gray-700 font-medium">Date of Contact *</Label>
              <Popover open={dateCalendarOpen} onOpenChange={setDateCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-xl border-gray-200 hover:border-gray-300",
                      !watchedDateOfContact && "text-gray-500"
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
                className="rounded-xl border-gray-200 focus:border-blue-500"
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

            {/* Supervision Section */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-2xl">
              <h3 className="font-semibold text-gray-900">Supervision Details</h3>
              
              {/* Supervision Hours */}
              <div className="space-y-2">
                <Label htmlFor="supervisionHours" className="text-gray-700 font-medium">Supervision Hours</Label>
                <Input
                  {...register("supervisionHours", { valueAsNumber: true })}
                  type="number"
                  step="0.25"
                  min="0"
                  className="rounded-xl border-gray-200 focus:border-blue-500"
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
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-700 font-medium">Session Notes</Label>
              <Textarea
                {...register("notes")}
                rows={4}
                placeholder="Describe the session, interventions used, client progress, challenges, insights..."
                className="rounded-xl border-gray-200 focus:border-blue-500 resize-none"
              />
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
        </div>
      </div>
    </div>
  );
};