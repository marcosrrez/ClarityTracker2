import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Clock, Zap, FileText, Calendar, ArrowRight, Plus, Lightbulb } from "lucide-react";

type EntryMode = "quick" | "detailed";

export default function LogSession() {
  const [quickMode, setQuickMode] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [smartSuggestions, setSmartSuggestions] = useState<Array<{
    field: string;
    value: any;
    reason: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const form = useForm<InsertLogEntry>({
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

  const watchedClientHours = form.watch("clientContactHours");
  const watchedSupervisionType = form.watch("supervisionType");

  // Smart prefill suggestions for quick mode
  useEffect(() => {
    if (quickMode) {
      const generateSuggestions = () => {
        const suggestions = [];
        const currentHour = new Date().getHours();
        const dayOfWeek = new Date().getDay();
        
        // Time-based intelligent suggestions
        if (currentHour >= 9 && currentHour <= 17 && dayOfWeek >= 1 && dayOfWeek <= 5) {
          if (!watchedClientHours) {
            suggestions.push({
              field: 'clientContactHours',
              value: 1,
              reason: 'Standard therapy session duration'
            });
          }
        }
        
        // Evening sessions might be shorter
        if (currentHour >= 18 || currentHour <= 8) {
          if (!watchedClientHours) {
            suggestions.push({
              field: 'clientContactHours',
              value: 0.75,
              reason: 'Evening session duration'
            });
          }
        }
        
        setSmartSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      };

      generateSuggestions();
    } else {
      setShowSuggestions(false);
    }
  }, [quickMode, watchedClientHours]);

  const applySuggestion = (suggestion: any) => {
    form.setValue(suggestion.field, suggestion.value);
    setShowSuggestions(false);
    toast({
      title: "Applied suggestion",
      description: `Set ${suggestion.field} to ${suggestion.value} hours`,
    });
  };

  const createEntryMutation = useMutation({
    mutationFn: async (data: InsertLogEntry) => {
      const response = await fetch("/api/log-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create entry");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/log-entries"] });
      toast({
        title: "Session logged successfully",
        description: "Your session has been recorded and your progress updated.",
      });
      form.reset({
        dateOfContact: new Date(),
        clientContactHours: 0,
        indirectHours: false,
        supervisionHours: 0,
        supervisionType: "none",
        techAssistedSupervision: false,
        notes: "",
      });
    },
    onError: () => {
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
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Quick Mode</span>
            <Switch
              checked={!quickMode}
              onCheckedChange={(checked) => setQuickMode(!checked)}
            />
            <span className="text-sm font-medium">Detailed</span>
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Session Entry Form
          </CardTitle>
          <CardDescription>
            {quickMode 
              ? "Quick entry - just the essentials"
              : "Detailed entry - comprehensive documentation"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Essential Fields - Always Visible */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        Client Contact Hours
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
                    </FormItem>
                  )}
                />
              </div>

              {/* Smart Suggestions - Only in Quick Mode */}
              {quickMode && showSuggestions && smartSuggestions.length > 0 && (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        <strong>Smart suggestion:</strong> {smartSuggestions[0].reason}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion(smartSuggestions[0])}
                        className="ml-4"
                      >
                        Apply {smartSuggestions[0].value}h
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={quickMode 
                          ? "Brief notes about the session..." 
                          : "Detailed notes including interventions used, client progress, and supervision topics..."}
                        className={`bg-white dark:bg-gray-700 ${quickMode ? "min-h-[80px]" : "min-h-[120px]"}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Detailed Fields - Only in Detailed Mode */}
              {!quickMode && (
                <div className="space-y-6 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comprehensive Documentation</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Additional details for supervision preparation and professional development</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="supervisionHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supervision Hours</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.25"
                              min="0"
                              max="8"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="bg-white dark:bg-gray-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              <SelectItem value="none">No Supervision</SelectItem>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="dyadic">Dyadic</SelectItem>
                              <SelectItem value="group">Group</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Supervision Date - Only when supervision type is not "none" */}
                  {watchedSupervisionType !== "none" && (
                    <FormField
                      control={form.control}
                      name="supervisionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supervision Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                              className="bg-white dark:bg-gray-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex items-center space-x-6">
                    <FormField
                      control={form.control}
                      name="indirectHours"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Indirect Hours</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="techAssistedSupervision"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Tech-Assisted Supervision</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Professional Development Context</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      These additional details help prepare for supervision sessions and track competency development across your therapeutic practice.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Quick Mode:</span> Essential information only
                      </div>
                      <div>
                        <span className="font-medium">Detailed Mode:</span> Comprehensive documentation
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-6">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {quickMode ? "Quick mode - essential information only" : "Detailed mode - comprehensive documentation"}
                </p>
                
                <Button
                  type="submit"
                  disabled={createEntryMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  {createEntryMutation.isPending ? "Logging Session..." : "Log Session"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}