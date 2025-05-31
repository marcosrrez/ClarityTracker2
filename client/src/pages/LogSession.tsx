import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertLogEntrySchema, type InsertLogEntry } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, Zap, FileText, Calendar, ArrowRight } from "lucide-react";

type EntryMode = "quick" | "detailed";

export default function LogSession() {
  const [mode, setMode] = useState<EntryMode>("quick");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertLogEntry>({
    resolver: zodResolver(insertLogEntrySchema.extend({
      dateOfContact: insertLogEntrySchema.shape.dateOfContact.refine(
        (date) => date <= new Date(),
        "Date cannot be in the future"
      ),
    })),
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

  const createEntryMutation = useMutation({
    mutationFn: (data: InsertLogEntry) => apiRequest("/api/log-entries", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/log-entries"] });
      toast({
        title: "Session logged successfully",
        description: "Your session has been recorded and your progress updated.",
      });
      form.reset({
        userId: user?.id || "",
        dateOfContact: new Date(),
        clientContactHours: 0,
        supervisionType: "direct",
        notes: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error logging session",
        description: "Please try again or contact support if the problem persists.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertLogEntry) => {
    createEntryMutation.mutate(data);
  };

  const toggleMode = () => {
    setMode(mode === "quick" ? "detailed" : "quick");
  };

  const isQuickMode = mode === "quick";
  const watchedHours = form.watch("clientContactHours");

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Log Session</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Record your therapy session and track progress toward licensure
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={isQuickMode ? "default" : "secondary"} className="flex items-center gap-2">
            {isQuickMode ? <Zap className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            {isQuickMode ? "Quick Entry" : "Detailed Entry"}
          </Badge>
          <Button
            variant="outline"
            onClick={toggleMode}
            className="flex items-center gap-2"
          >
            {isQuickMode ? "Switch to Detailed" : "Switch to Quick"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Session Details
          </CardTitle>
          <CardDescription>
            {isQuickMode 
              ? "Enter essential session information quickly"
              : "Comprehensive session documentation with detailed notes"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date and Hours - Always visible */}
                <FormField
                  control={form.control}
                  name="dateOfContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Session Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          className="bg-white dark:bg-gray-700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientContactHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Contact Hours
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          max="24"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="bg-white dark:bg-gray-700"
                        />
                      </FormControl>
                      <FormMessage />
                      {watchedHours > 0 && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {watchedHours} hours toward licensure requirements
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              {/* Supervision Type - Always visible but simplified in quick mode */}
              <FormField
                control={form.control}
                name="supervisionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supervision Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-gray-700">
                          <SelectValue placeholder="Select supervision type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="direct">Direct Supervision</SelectItem>
                        <SelectItem value="indirect">Indirect Supervision</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes - Different presentation based on mode */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {isQuickMode ? "Session Notes (Optional)" : "Detailed Session Notes"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={isQuickMode 
                          ? "Brief notes about the session..." 
                          : "Detailed notes including interventions used, client progress, supervision topics, competency areas addressed..."}
                        className={`bg-white dark:bg-gray-700 resize-none ${
                          isQuickMode ? "min-h-[80px]" : "min-h-[150px]"
                        }`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    {!isQuickMode && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Comprehensive notes help with supervision preparation and competency tracking
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* Detailed Mode Additional Fields */}
              {!isQuickMode && (
                <div className="space-y-6 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Additional Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Office, Telehealth, Community"
                              className="bg-white dark:bg-gray-700"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="clientDemographics"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Demographics</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Adult, Adolescent, Family"
                              className="bg-white dark:bg-gray-700"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="interventionsUsed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interventions & Techniques Used</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the therapeutic interventions and techniques used during this session..."
                            className="bg-white dark:bg-gray-700 min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-6">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {isQuickMode 
                    ? "Quick entry helps you log sessions efficiently"
                    : "Detailed entry supports comprehensive supervision preparation"
                  }
                </div>
                
                <Button
                  type="submit"
                  disabled={createEntryMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  {createEntryMutation.isPending ? "Logging..." : "Log Session"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}