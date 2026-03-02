import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Mail } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const scheduleSessionSchema = z.object({
  superviseeId: z.string().min(1, "Please select a supervisee"),
  sessionDate: z.date({
    required_error: "Session date is required",
  }),
  sessionTime: z.string().min(1, "Session time is required"),
  durationMinutes: z.number().min(15, "Minimum 15 minutes").max(480, "Maximum 8 hours"),
  sessionType: z.enum(["individual", "group", "case_consultation"]),
  sessionFormat: z.enum(["in_person", "video", "phone"]),
  agenda: z.string().optional(),
  sendReminders: z.boolean().default(true),
  reminderDays: z.number().min(1).max(7).default(1),
});

type ScheduleSessionForm = z.infer<typeof scheduleSessionSchema>;

interface ScheduleSessionDialogProps {
  open: boolean;
  onClose: () => void;
  supervisees: any[];
  selectedSuperviseeId?: string;
}

export function ScheduleSessionDialog({ 
  open, 
  onClose, 
  supervisees, 
  selectedSuperviseeId 
}: ScheduleSessionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ScheduleSessionForm>({
    resolver: zodResolver(scheduleSessionSchema),
    defaultValues: {
      superviseeId: selectedSuperviseeId || "",
      durationMinutes: 60,
      sessionType: "individual",
      sessionFormat: "in_person",
      sendReminders: true,
      reminderDays: 1,
    },
  });

  const onSubmit = async (data: ScheduleSessionForm) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Combine date and time
      const [hours, minutes] = data.sessionTime.split(':');
      const sessionDateTime = new Date(data.sessionDate);
      sessionDateTime.setHours(parseInt(hours), parseInt(minutes));

      const sessionData = {
        supervisorId: user.uid,
        superviseeId: data.superviseeId,
        sessionDate: sessionDateTime.toISOString(),
        durationMinutes: data.durationMinutes,
        sessionType: data.sessionType,
        sessionFormat: data.sessionFormat,
        agenda: data.agenda || null,
        isCompleted: false,
        sendReminders: data.sendReminders,
        reminderDays: data.reminderDays,
      };

      const response = await fetch('/api/supervision/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule session');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/supervision/sessions'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/compliance/alerts'] });

      toast({
        title: "Session scheduled",
        description: `Supervision session scheduled for ${format(sessionDateTime, 'PPP p')}${data.sendReminders ? '. Email reminders will be sent.' : ''}`,
      });

      onClose();
      form.reset();
    } catch (error) {
      console.error('Error scheduling session:', error);
      toast({
        title: "Error",
        description: "Failed to schedule supervision session.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSupervisee = supervisees.find(s => s.id === form.watch('superviseeId'));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Supervision Session</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="superviseeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supervisee</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supervisee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {supervisees.map((supervisee) => (
                          <SelectItem key={supervisee.id} value={supervisee.id}>
                            {supervisee.superviseeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sessionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="case_consultation">Case Consultation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="sessionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sessionTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={15}
                        max={480}
                        step={15}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sessionFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Format</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in_person">In Person</SelectItem>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agenda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Agenda (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Topics to discuss, competencies to review, etc."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <FormField
                control={form.control}
                name="sendReminders"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Reminders
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Send automatic email reminders to both supervisor and supervisee
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('sendReminders') && (
                <FormField
                  control={form.control}
                  name="reminderDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Send reminder how many days before?</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          max={7}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Show supervision ratio info if supervisee is selected */}
            {selectedSupervisee && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Supervision Ratio Status
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selectedSupervisee.superviseeName} requires {selectedSupervisee.supervisionFrequency} supervision.
                  Current client hours: {selectedSupervisee.completedHours || 0} / {selectedSupervisee.requiredHours || 4000}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 1 hour of supervision per 10 client contact hours
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Scheduling..." : "Schedule Session"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}