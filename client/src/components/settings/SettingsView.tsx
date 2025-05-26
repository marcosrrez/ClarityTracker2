import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Save, AlertTriangle, Shield, Download, Upload, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { useAppSettings, useLogEntries } from "@/hooks/use-firestore";
import { updateAppSettings, createLogEntry } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { insertAppSettingsSchema } from "@shared/schema";
import type { AppSettings, InsertAppSettings, InsertLogEntry } from "@shared/schema";

export const SettingsView = () => {
  const { user, resetPassword } = useAuth();
  const { settings, loading, refetch } = useAppSettings();
  const { entries } = useLogEntries();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [dateCalendarOpen, setDateCalendarOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<InsertAppSettings>({
    resolver: zodResolver(insertAppSettingsSchema),
    defaultValues: {
      goals: {
        totalCCH: 2000,
        directCCH: 1500,
        supervisionHours: 200,
        ethicsHours: 20,
        stateRegion: "",
      },
      importedHours: {
        totalCCH: 0,
        directCCH: 0,
        supervisionHours: 0,
        ethicsHours: 0,
      },
      licenseInfo: {
        supervisionCheckInInterval: 30,
      },
      personalPreferences: {
        userDefinedGrowthAreas: [],
        favoriteTherapeuticModalities: [],
      },
    },
  });

  const watchedLacDate = watch("licenseInfo.lacLicenseDate");

  // Load existing settings into form
  useEffect(() => {
    if (settings) {
      reset({
        goals: settings.goals,
        importedHours: settings.importedHours,
        licenseInfo: settings.licenseInfo,
        personalPreferences: settings.personalPreferences,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: InsertAppSettings) => {
    if (!user) return;

    try {
      setIsSaving(true);
      await updateAppSettings(user.uid, data);
      await refetch();
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving settings",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    try {
      setIsResettingPassword(true);
      await resetPassword(user.email);
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      });
    } catch (error) {
      console.error("Error sending password reset:", error);
      toast({
        title: "Error sending email",
        description: "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleExportData = async () => {
    if (!entries || entries.length === 0) {
      toast({
        title: "No data to export",
        description: "You don't have any log entries to export yet.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);
      
      // Create CSV content
      const headers = ["Date", "Client Contact Hours", "Indirect Hours", "Supervision Hours", "Supervision Type", "Tech Assisted", "Notes"];
      const csvContent = [
        headers.join(","),
        ...entries.map(entry => [
          new Date(entry.dateOfContact).toLocaleDateString(),
          entry.clientContactHours.toString(),
          entry.indirectHours ? "Yes" : "No",
          entry.supervisionHours.toString(),
          entry.supervisionType,
          entry.techAssistedSupervision ? "Yes" : "No",
          `"${entry.notes.replace(/"/g, '""')}"`
        ].join(","))
      ].join("\n");

      // Download CSV file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `claritylog-data-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Data exported successfully",
        description: "Your log entries have been downloaded as a CSV file.",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const intelligentColumnMapper = (headers: string[]) => {
    const mapping: { [key: string]: number } = {};
    
    headers.forEach((header, index) => {
      const cleanHeader = header.toLowerCase().trim();
      
      // Date mapping - flexible patterns
      if (cleanHeader.includes('date') || cleanHeader.includes('session') || cleanHeader.includes('contact') || cleanHeader.includes('visit') || cleanHeader.includes('appointment')) {
        mapping.date = index;
      }
      
      // Client contact hours - various patterns
      if ((cleanHeader.includes('client') && cleanHeader.includes('hour')) || 
          (cleanHeader.includes('direct') && cleanHeader.includes('hour')) ||
          cleanHeader.includes('cch') || cleanHeader.includes('contact hour') ||
          cleanHeader.includes('therapy hour') || cleanHeader.includes('session hour')) {
        mapping.clientHours = index;
      }
      
      // Supervision hours
      if (cleanHeader.includes('supervision') && cleanHeader.includes('hour')) {
        mapping.supervisionHours = index;
      }
      
      // Indirect hours
      if (cleanHeader.includes('indirect') || cleanHeader.includes('documentation') || 
          cleanHeader.includes('admin') || cleanHeader.includes('paperwork')) {
        mapping.indirectHours = index;
      }
      
      // Supervision type
      if ((cleanHeader.includes('supervision') && cleanHeader.includes('type')) ||
          (cleanHeader.includes('super') && cleanHeader.includes('format')) ||
          cleanHeader.includes('supervision format')) {
        mapping.supervisionType = index;
      }
      
      // Technology assisted
      if (cleanHeader.includes('tech') || cleanHeader.includes('video') || 
          cleanHeader.includes('remote') || cleanHeader.includes('virtual') ||
          cleanHeader.includes('telehealth') || cleanHeader.includes('online')) {
        mapping.techAssisted = index;
      }
      
      // Notes/comments
      if (cleanHeader.includes('note') || cleanHeader.includes('comment') || 
          cleanHeader.includes('description') || cleanHeader.includes('summary') ||
          cleanHeader.includes('reflection') || cleanHeader.includes('observation')) {
        mapping.notes = index;
      }
    });
    
    return mapping;
  };

  const parseFlexibleNumber = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    
    // Handle various number formats: "1.5", "1,5", "1 hour", "90 minutes", etc.
    const numberMatch = value.match(/(\d+(?:[.,]\d+)?)/);
    if (numberMatch) {
      const num = parseFloat(numberMatch[1].replace(',', '.'));
      // Convert minutes to hours if value seems like minutes (>10 and no decimal)
      if (num > 10 && !value.includes('.') && !value.includes(',')) {
        return num / 60; // Convert minutes to hours
      }
      return num;
    }
    return 0;
  };

  const parseFlexibleBoolean = (value: string): boolean => {
    if (!value || value.trim() === '') return false;
    const cleanValue = value.trim().toLowerCase();
    return ['yes', 'true', '1', 'y', 'x', '✓', 'indirect', 'tech', 'virtual', 'remote'].includes(cleanValue);
  };

  const parseFlexibleDate = (value: string): Date => {
    if (!value || value.trim() === '') return new Date();
    
    // Handle multiple date formats
    const dateFormats = [
      value, // Try as-is first
      value.replace(/[-\/]/g, '/'), // Normalize separators
      value.replace(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/, '$3/$1/$2'), // MM/DD/YYYY to YYYY/MM/DD
      value.replace(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/, '$1/$2/$3'), // YYYY-MM-DD format
    ];
    
    for (const format of dateFormats) {
      const date = new Date(format);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return new Date(); // Fallback to today
  };

  const parseFlexibleString = (value: string): string => {
    return value ? value.trim() : '';
  };

  const mapSupervisionType = (value: string): "individual" | "dyadic" | "group" | "none" => {
    if (!value) return "none";
    const clean = value.toLowerCase().trim();
    
    if (clean.includes('individual') || clean.includes('one-on-one') || clean.includes('1:1') || clean === 'ind') {
      return "individual";
    }
    if (clean.includes('dyadic') || clean.includes('pair') || clean.includes('two') || clean === 'dyad') {
      return "dyadic";
    }
    if (clean.includes('group') || clean.includes('team') || clean.includes('multiple') || clean === 'grp') {
      return "group";
    }
    return "none";
  };

  const handleImportFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().includes('.csv') && !file.name.toLowerCase().includes('.xlsx')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsImporting(true);
      const text = await file.text();
      
      // Handle different delimiters (comma, semicolon, tab)
      let delimiter = ',';
      if (text.includes(';') && text.split(';').length > text.split(',').length) {
        delimiter = ';';
      } else if (text.includes('\t')) {
        delimiter = '\t';
      }
      
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("File appears to be empty or has no data rows");
      }

      // Parse headers and create intelligent mapping
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
      const columnMapping = intelligentColumnMapper(headers);
      
      // Show user what was detected
      const mappedFields = Object.keys(columnMapping);
      console.log('Detected columns:', columnMapping);
      
      if (mappedFields.length === 0) {
        toast({
          title: "No recognizable columns found",
          description: "Could not identify date or hours columns. Please check your file format.",
          variant: "destructive",
        });
        return;
      }

      // Process data rows
      const dataLines = lines.slice(1);
      let importedCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const line of dataLines) {
        try {
          const columns = line.split(delimiter).map(col => col.trim().replace(/^"|"$/g, ''));
          
          if (columns.length < 2) {
            skippedCount++;
            continue;
          }

          // Extract data using intelligent mapping
          const date = columnMapping.date !== undefined ? 
            parseFlexibleDate(columns[columnMapping.date]) : new Date();
          
          const clientHours = columnMapping.clientHours !== undefined ? 
            parseFlexibleNumber(columns[columnMapping.clientHours]) : 0;
            
          const supervisionHours = columnMapping.supervisionHours !== undefined ? 
            parseFlexibleNumber(columns[columnMapping.supervisionHours]) : 0;
            
          const indirectHours = columnMapping.indirectHours !== undefined ? 
            parseFlexibleBoolean(columns[columnMapping.indirectHours]) : false;
            
          const supervisionTypeRaw = columnMapping.supervisionType !== undefined ? 
            columns[columnMapping.supervisionType] : "";
            
          const techAssisted = columnMapping.techAssisted !== undefined ? 
            parseFlexibleBoolean(columns[columnMapping.techAssisted]) : false;
            
          const notes = columnMapping.notes !== undefined ? 
            parseFlexibleString(columns[columnMapping.notes]) : "";

          // Validate required fields
          if (!date || isNaN(date.getTime()) || (clientHours === 0 && supervisionHours === 0)) {
            skippedCount++;
            continue;
          }

          const entryData: InsertLogEntry = {
            dateOfContact: date,
            clientContactHours: clientHours,
            indirectHours: indirectHours,
            supervisionHours: supervisionHours,
            supervisionType: mapSupervisionType(supervisionTypeRaw),
            techAssistedSupervision: techAssisted,
            notes: notes,
          };

          if (user?.uid) {
            await createLogEntry(user.uid, entryData);
            importedCount++;
          }
        } catch (rowError) {
          console.error("Error processing row:", rowError);
          errorCount++;
        }
      }

      toast({
        title: "Import completed",
        description: `Successfully imported ${importedCount} entries. ${skippedCount > 0 ? `Skipped ${skippedCount} invalid rows. ` : ''}${errorCount > 0 ? `${errorCount} errors occurred.` : ''}`,
      });

      // Clear the file input and refresh data
      event.target.value = '';
      
    } catch (error) {
      console.error("Error importing data:", error);
      toast({
        title: "Import failed",
        description: "Failed to import data. Please check your file format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDataReset = () => {
    if (confirm("Are you sure you want to reset your settings to default values? This cannot be undone.")) {
      reset();
      toast({
        title: "Settings reset",
        description: "Your settings have been reset to default values.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Goals Section */}
        <Card>
          <CardHeader>
            <CardTitle>Licensure Goals</CardTitle>
            <CardDescription>
              Set your target hours for professional development and licensure requirements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalCCH">Total Client Contact Hours Goal</Label>
                <Input
                  id="totalCCH"
                  type="number"
                  min="0"
                  {...register("goals.totalCCH", { valueAsNumber: true })}
                />
                {errors.goals?.totalCCH && (
                  <p className="text-sm text-destructive">{errors.goals.totalCCH.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="directCCH">Direct Client Contact Hours Goal</Label>
                <Input
                  id="directCCH"
                  type="number"
                  min="0"
                  {...register("goals.directCCH", { valueAsNumber: true })}
                />
                {errors.goals?.directCCH && (
                  <p className="text-sm text-destructive">{errors.goals.directCCH.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisionHours">Supervision Hours Goal</Label>
                <Input
                  id="supervisionHours"
                  type="number"
                  min="0"
                  {...register("goals.supervisionHours", { valueAsNumber: true })}
                />
                {errors.goals?.supervisionHours && (
                  <p className="text-sm text-destructive">{errors.goals.supervisionHours.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ethicsHours">Ethics Hours Goal</Label>
                <Input
                  id="ethicsHours"
                  type="number"
                  min="0"
                  {...register("goals.ethicsHours", { valueAsNumber: true })}
                />
                {errors.goals?.ethicsHours && (
                  <p className="text-sm text-destructive">{errors.goals.ethicsHours.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="stateRegion">State/Region</Label>
                <Input
                  id="stateRegion"
                  placeholder="e.g., Texas, California, Ontario"
                  {...register("goals.stateRegion")}
                />
                {errors.goals?.stateRegion && (
                  <p className="text-sm text-destructive">{errors.goals.stateRegion.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import Existing Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Import Existing Hours</CardTitle>
            <CardDescription>
              If you have existing hours from before using ClarityLog, enter them here to get accurate progress tracking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="importedTotalCCH">Total Client Contact Hours</Label>
                <Input
                  id="importedTotalCCH"
                  type="number"
                  min="0"
                  step="0.25"
                  {...register("importedHours.totalCCH", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="importedDirectCCH">Direct Client Contact Hours</Label>
                <Input
                  id="importedDirectCCH"
                  type="number"
                  min="0"
                  step="0.25"
                  {...register("importedHours.directCCH", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="importedSupervisionHours">Supervision Hours</Label>
                <Input
                  id="importedSupervisionHours"
                  type="number"
                  min="0"
                  step="0.25"
                  {...register("importedHours.supervisionHours", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="importedEthicsHours">Ethics Hours</Label>
                <Input
                  id="importedEthicsHours"
                  type="number"
                  min="0"
                  step="0.25"
                  {...register("importedHours.ethicsHours", { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License Information */}
        <Card>
          <CardHeader>
            <CardTitle>License Information</CardTitle>
            <CardDescription>
              Track important dates and supervision requirements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lacLicenseDate">LAC License Date (Optional)</Label>
                <Popover open={dateCalendarOpen} onOpenChange={setDateCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watchedLacDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watchedLacDate ? (
                        format(watchedLacDate, "PPP")
                      ) : (
                        "Pick a date"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchedLacDate}
                      onSelect={(date) => {
                        setValue("licenseInfo.lacLicenseDate", date);
                        setDateCalendarOpen(false);
                      }}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisionCheckInInterval">Supervision Check-in Interval (Days)</Label>
                <Input
                  id="supervisionCheckInInterval"
                  type="number"
                  min="1"
                  max="365"
                  {...register("licenseInfo.supervisionCheckInInterval", { valueAsNumber: true })}
                />
                {errors.licenseInfo?.supervisionCheckInInterval && (
                  <p className="text-sm text-destructive">{errors.licenseInfo.supervisionCheckInInterval.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Preferences</CardTitle>
            <CardDescription>
              Customize your experience with personal growth areas and therapeutic preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="growthAreas">User-Defined Growth Areas</Label>
              <Textarea
                id="growthAreas"
                placeholder="Enter one growth area per line, e.g.:
Trauma-informed care
Multicultural counseling
Group therapy facilitation"
                className="min-h-[100px]"
                {...register("personalPreferences.userDefinedGrowthAreas", {
                  setValueAs: (value: string) => typeof value === 'string' ? value.split('\n').filter(line => line.trim() !== '') : []
                })}
              />
              <p className="text-xs text-muted-foreground">
                Enter each growth area on a new line. These will be used for personalized AI insights.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="therapeuticModalities">Favorite Therapeutic Modalities</Label>
              <Textarea
                id="therapeuticModalities"
                placeholder="Enter one modality per line, e.g.:
Cognitive Behavioral Therapy (CBT)
Dialectical Behavior Therapy (DBT)
Eye Movement Desensitization and Reprocessing (EMDR)"
                className="min-h-[100px]"
                {...register("personalPreferences.favoriteTherapeuticModalities", {
                  setValueAs: (value: string) => typeof value === 'string' ? value.split('\n').filter(line => line.trim() !== '') : []
                })}
              />
              <p className="text-xs text-muted-foreground">
                Enter each therapeutic modality on a new line.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Card>
          <CardContent className="pt-6">
            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      <Separator />

      {/* Account Management */}
      <Card>
        <CardHeader>
          <CardTitle>Account Management</CardTitle>
          <CardDescription>
            Manage your account security and password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <h4 className="font-medium">Password Reset</h4>
              <p className="text-sm text-muted-foreground">
                Send a password reset email to your registered address.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handlePasswordReset}
              disabled={isResettingPassword}
            >
              {isResettingPassword ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending...
                </>
              ) : (
                "Send Reset Email"
              )}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">Email Address:</p>
            <p>{user?.email}</p>
            <p className="mt-2 text-xs">
              To change your email address, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-500" />
            <span>Data Management</span>
          </CardTitle>
          <CardDescription>
            Export your data for backup or import existing entries from Excel/CSV files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Section */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Export Your Data</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Download all your log entries as a CSV file for backup or external analysis.
              </p>
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={isExporting || !entries || entries.length === 0}
                className="w-full sm:w-auto"
              >
                {isExporting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data to CSV
                  </>
                )}
              </Button>
              {(!entries || entries.length === 0) && (
                <p className="text-xs text-muted-foreground mt-2">
                  No entries available to export. Add some log entries first.
                </p>
              )}
            </div>

            <Separator />

            {/* Import Section */}
            <div>
              <h4 className="font-medium mb-2">Smart Import from Any Format</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your existing tracking data in any CSV format. Our intelligent analyzer will automatically 
                detect and map your columns, no matter how they're named or organized.
              </p>
              <div className="space-y-2">
                <label htmlFor="import-file" className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isImporting}
                    className="w-full sm:w-auto"
                    asChild
                  >
                    <span>
                      {isImporting ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Analyzing & Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File to Analyze
                        </>
                      )}
                    </span>
                  </Button>
                </label>
                <input
                  id="import-file"
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleImportFromExcel}
                  disabled={isImporting}
                  className="hidden"
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>✨ Intelligent Detection:</strong></p>
                  <p>• Recognizes any column names (dates, hours, supervision, notes, etc.)</p>
                  <p>• Handles multiple date formats (MM/DD/YYYY, YYYY-MM-DD, etc.)</p>
                  <p>• Converts minutes to hours automatically when detected</p>
                  <p>• Supports comma, semicolon, or tab delimiters</p>
                  <p>• Maps supervision types and tech-assisted sessions flexibly</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Safety */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-500" />
            <span>Data Safety & Privacy</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Your data is secure:</strong> All information is encrypted and stored securely using Firebase. 
              Your personal information and client data (when properly anonymized) are protected with 
              industry-standard security measures.
            </AlertDescription>
          </Alert>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>HIPAA Compliance:</strong> You are responsible for ensuring all client information 
            is properly anonymized before entering into the system.</p>
            <p><strong>Data Backup:</strong> Your data is automatically backed up and synced across devices 
            when you're logged in.</p>
            <p><strong>Account Security:</strong> Use a strong password and enable two-factor authentication 
            in your browser for added security.</p>
          </div>
        </CardContent>
      </Card>

      {/* Browser Extension */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-purple-500" />
            <span>Browser Extension</span>
          </CardTitle>
          <CardDescription>
            Capture valuable content from any webpage directly into your knowledge base with one click.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">🚀 One-Click Content Capture</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Transform any webpage into professional development insights! Our extension adds a floating capture button 
                to every site, letting you save articles, research, and resources directly to ClarityLog with AI-powered analysis.
              </p>
              
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg mb-4">
                <h5 className="font-medium text-sm mb-2">✨ Extension Features:</h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Floating capture button on every webpage</li>
                  <li>• Right-click menu for quick text selection capture</li>
                  <li>• Smart content extraction from articles and blogs</li>
                  <li>• Automatic AI analysis and insight generation</li>
                  <li>• Direct integration with your ClarityLog knowledge base</li>
                </ul>
              </div>

              <div className="flex flex-col space-y-3">
                <Button
                  onClick={() => {
                    // Create and download extension files
                    const extensionFiles = {
                      'manifest.json': JSON.stringify({
                        "manifest_version": 3,
                        "name": "ClarityLog Content Capture",
                        "version": "1.0",
                        "description": "Capture valuable content for your professional development with AI-powered insights",
                        "permissions": ["activeTab", "storage", "contextMenus"],
                        "host_permissions": [
                          "http://localhost:5000/*",
                          "https://*.replit.app/*",
                          "https://*.replit.dev/*"
                        ],
                        "action": {
                          "default_popup": "popup.html",
                          "default_title": "Capture to ClarityLog"
                        },
                        "content_scripts": [{
                          "matches": ["<all_urls>"],
                          "js": ["content.js"],
                          "css": ["content.css"]
                        }],
                        "background": {
                          "service_worker": "background.js"
                        },
                        "icons": {
                          "16": "icons/icon16.png",
                          "48": "icons/icon48.png",
                          "128": "icons/icon128.png"
                        }
                      }, null, 2),
                      
                      'popup.html': \`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      width: 320px;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .logo {
      width: 24px;
      height: 24px;
      background: #3b82f6;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    }
    .title {
      font-weight: 600;
      color: #111827;
    }
    .subtitle {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 16px;
    }
    .capture-btn {
      width: 100%;
      padding: 12px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      margin-bottom: 8px;
    }
    .capture-btn:hover {
      background: #2563eb;
    }
    .selection-btn {
      width: 100%;
      padding: 10px;
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      margin-bottom: 12px;
    }
    .status {
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      text-align: center;
      margin-top: 8px;
    }
    .status.success {
      background: #dcfce7;
      color: #166534;
    }
    .status.error {
      background: #fef2f2;
      color: #dc2626;
    }
    .status.loading {
      background: #dbeafe;
      color: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">C</div>
    <div>
      <div class="title">ClarityLog</div>
    </div>
  </div>
  
  <div class="subtitle">Capture content for professional development</div>
  
  <button id="captureArticle" class="capture-btn">
    📄 Capture Full Article
  </button>
  
  <button id="captureSelection" class="selection-btn">
    ✂️ Capture Selected Text
  </button>
  
  <div id="status" class="status" style="display: none;"></div>

  <script src="popup.js"></script>
</body>
</html>\`,

                      'popup.js': \`document.addEventListener('DOMContentLoaded', function() {
  const captureArticleBtn = document.getElementById('captureArticle');
  const captureSelectionBtn = document.getElementById('captureSelection');
  const statusDiv = document.getElementById('status');

  function showStatus(message, type = 'loading') {
    statusDiv.textContent = message;
    statusDiv.className = \`status \${type}\`;
    statusDiv.style.display = 'block';
  }

  function hideStatus() {
    statusDiv.style.display = 'none';
  }

  async function getServerUrl() {
    const result = await chrome.storage.sync.get(['claritylogUrl']);
    return result.claritylogUrl || '${window.location.origin}';
  }

  captureArticleBtn.addEventListener('click', async function() {
    try {
      showStatus('Capturing article...', 'loading');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractArticleContent
      });
      
      const articleData = results[0].result;
      
      if (!articleData.content || articleData.content.length < 100) {
        showStatus('No substantial content found', 'error');
        return;
      }
      
      await sendToClarityLog(articleData);
      
      showStatus('✅ Added to ClarityLog!', 'success');
      setTimeout(() => window.close(), 1500);
      
    } catch (error) {
      console.error('Error capturing article:', error);
      showStatus('Failed to capture content', 'error');
    }
  });

  captureSelectionBtn.addEventListener('click', async function() {
    try {
      showStatus('Capturing selection...', 'loading');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getSelectedText
      });
      
      const selectionData = results[0].result;
      
      if (!selectionData.content || selectionData.content.length < 20) {
        showStatus('Please select some text first', 'error');
        return;
      }
      
      await sendToClarityLog(selectionData);
      
      showStatus('✅ Selection added!', 'success');
      setTimeout(() => window.close(), 1500);
      
    } catch (error) {
      console.error('Error capturing selection:', error);
      showStatus('Failed to capture selection', 'error');
    }
  });

  async function sendToClarityLog(contentData) {
    const serverUrl = await getServerUrl();
    
    const response = await fetch(\`\${serverUrl}/api/insight-cards\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'note',
        title: contentData.title,
        content: \`**Captured from:** \${contentData.url}\\n\\n\${contentData.content}\`,
        tags: ['web-capture', 'extension', 'professional-development'],
        originalUrl: contentData.url
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send to ClarityLog');
    }
  }
});

function extractArticleContent() {
  const unwantedSelectors = [
    'script', 'style', 'nav', 'header', 'footer', 
    '.advertisement', '.ad', '.sidebar', '.comments'
  ];
  
  unwantedSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  const contentSelectors = [
    'main', 'article', '[role="main"]',
    '.content', '.post', '.entry', '.article-body'
  ];
  
  let mainContent = null;
  for (const selector of contentSelectors) {
    mainContent = document.querySelector(selector);
    if (mainContent) break;
  }
  
  if (!mainContent) {
    mainContent = document.body;
  }
  
  const content = mainContent.textContent || mainContent.innerText || '';
  
  return {
    title: document.title,
    url: window.location.href,
    content: content.replace(/\\s+/g, ' ').trim(),
    timestamp: new Date().toISOString()
  };
}

function getSelectedText() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  return {
    title: \`Selection from \${document.title}\`,
    url: window.location.href,
    content: selectedText,
    timestamp: new Date().toISOString()
  };
}\`,

                      'content.js': \`(function() {
  'use strict';

  function createCaptureButton() {
    const button = document.createElement('div');
    button.id = 'claritylog-capture-btn';
    button.innerHTML = \`
      <div class="claritylog-btn-icon">📄</div>
      <div class="claritylog-btn-text">Add to ClarityLog</div>
    \`;
    
    button.addEventListener('click', handleCapture);
    document.body.appendChild(button);
    
    return button;
  }

  async function handleCapture() {
    try {
      const button = document.getElementById('claritylog-capture-btn');
      button.classList.add('capturing');
      button.innerHTML = \`
        <div class="claritylog-btn-icon">⏳</div>
        <div class="claritylog-btn-text">Capturing...</div>
      \`;
      
      const contentData = extractPageContent();
      
      chrome.runtime.sendMessage({
        action: 'captureContent',
        data: contentData
      }, (response) => {
        if (response.success) {
          showSuccessMessage();
        } else {
          showErrorMessage(response.error);
        }
        
        setTimeout(() => {
          button.classList.remove('capturing');
          button.innerHTML = \`
            <div class="claritylog-btn-icon">📄</div>
            <div class="claritylog-btn-text">Add to ClarityLog</div>
          \`;
        }, 2000);
      });
      
    } catch (error) {
      console.error('ClarityLog capture error:', error);
      showErrorMessage('Failed to capture content');
    }
  }

  function extractPageContent() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText.length > 20) {
      return {
        title: \`Selection from \${document.title}\`,
        url: window.location.href,
        content: selectedText,
        type: 'selection',
        timestamp: new Date().toISOString()
      };
    }
    
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 
      '.advertisement', '.ad', '.sidebar', '.comments',
      '#claritylog-capture-btn', '.claritylog-notification'
    ];
    
    const docClone = document.cloneNode(true);
    
    unwantedSelectors.forEach(selector => {
      docClone.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    const contentSelectors = [
      'main', 'article', '[role="main"]',
      '.content', '.post', '.entry', '.article-body',
      '.post-content', '.entry-content'
    ];
    
    let mainContent = null;
    for (const selector of contentSelectors) {
      mainContent = docClone.querySelector(selector);
      if (mainContent && mainContent.textContent.trim().length > 200) break;
    }
    
    if (!mainContent) {
      mainContent = docClone.body;
    }
    
    const content = mainContent.textContent || mainContent.innerText || '';
    const cleanContent = content.replace(/\\s+/g, ' ').trim();
    
    return {
      title: document.title,
      url: window.location.href,
      content: cleanContent,
      type: 'article',
      timestamp: new Date().toISOString()
    };
  }

  function showSuccessMessage() {
    const notification = document.createElement('div');
    notification.className = 'claritylog-notification success';
    notification.innerHTML = \`
      <div class="claritylog-notification-content">
        <div class="claritylog-notification-icon">✅</div>
        <div class="claritylog-notification-text">Added to ClarityLog!</div>
      </div>
    \`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function showErrorMessage(error) {
    const notification = document.createElement('div');
    notification.className = 'claritylog-notification error';
    notification.innerHTML = \`
      <div class="claritylog-notification-content">
        <div class="claritylog-notification-icon">❌</div>
        <div class="claritylog-notification-text">\${error || 'Capture failed'}</div>
      </div>
    \`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function init() {
    if (document.body && !document.getElementById('claritylog-capture-btn')) {
      const skipDomains = ['chrome-extension://', 'chrome://', 'moz-extension://'];
      if (skipDomains.some(domain => window.location.href.startsWith(domain))) {
        return;
      }
      
      createCaptureButton();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();\`,

                      'content.css': \`#claritylog-capture-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
}

#claritylog-capture-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

#claritylog-capture-btn.capturing {
  background: #6b7280;
  cursor: not-allowed;
  animation: pulse 1.5s infinite;
}

.claritylog-btn-icon {
  font-size: 16px;
  line-height: 1;
}

.claritylog-btn-text {
  white-space: nowrap;
}

.claritylog-notification {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 10001;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  min-width: 200px;
}

.claritylog-notification.show {
  transform: translateX(0);
}

.claritylog-notification.success {
  background: #10b981;
  color: white;
}

.claritylog-notification.error {
  background: #ef4444;
  color: white;
}

.claritylog-notification-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}\`,

                      'background.js': \`chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "captureToClarity",
    title: "Add to ClarityLog",
    contexts: ["selection", "page"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "captureToClarity") {
    try {
      const contentData = {
        title: info.selectionText ? \`Selection from \${tab.title}\` : tab.title,
        url: tab.url,
        content: info.selectionText || "",
        type: info.selectionText ? "selection" : "page",
        timestamp: new Date().toISOString()
      };

      await sendToClarityLog(contentData);
      
      chrome.tabs.sendMessage(tab.id, {
        action: "showNotification",
        type: "success",
        message: "Added to ClarityLog!"
      });
      
    } catch (error) {
      console.error("Context menu capture failed:", error);
      chrome.tabs.sendMessage(tab.id, {
        action: "showNotification", 
        type: "error",
        message: "Capture failed"
      });
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureContent") {
    handleContentCapture(request.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function sendToClarityLog(contentData) {
  try {
    const settings = await chrome.storage.sync.get(['claritylogUrl']);
    const serverUrl = settings.claritylogUrl || '${window.location.origin}';

    const response = await fetch(\`\${serverUrl}/api/insight-cards\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-Capture': 'true'
      },
      body: JSON.stringify({
        type: 'note',
        title: contentData.title,
        content: \`**Captured from:** \${contentData.url}\\n\\n\${contentData.content}\`,
        tags: ['web-capture', 'extension', 'professional-development'],
        originalUrl: contentData.url
      })
    });

    if (!response.ok) {
      throw new Error(\`Server responded with \${response.status}\`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('Failed to send to ClarityLog:', error);
    throw error;
  }
}

async function handleContentCapture(contentData) {
  try {
    if (!contentData.content || contentData.content.length < 20) {
      throw new Error('No content to capture');
    }

    await sendToClarityLog(contentData);
    
    return { success: true };
    
  } catch (error) {
    console.error('Content capture failed:', error);
    return { success: false, error: error.message };
  }
}\`,
                      
                      'README.txt': \`ClarityLog Browser Extension Installation

You should have 6 files total:
1. manifest.json - Extension configuration
2. popup.html - Extension popup interface  
3. popup.js - Popup functionality
4. content.js - Webpage integration script
5. content.css - Styling for capture button
6. background.js - Background service worker

INSTALLATION STEPS:
1. Create a folder called "claritylog-extension" 
2. Save all 6 files in this folder
3. Open Chrome and go to chrome://extensions/
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked" and select your extension folder
6. You should see ClarityLog extension appear in your toolbar!

USAGE:
- Visit any article or blog post
- Click the floating "Add to ClarityLog" button that appears
- Or right-click and select "Add to ClarityLog"
- Content automatically gets AI analysis in your ClarityLog app!

Current server URL: ${window.location.origin}

The extension will automatically use your current ClarityLog server. 
Once installed, you can capture content from any website directly 
into your professional development knowledge base.

Support: Contact us if you need help setting up the extension.\`
                    };

                    // Create download for each file
                    Object.entries(extensionFiles).forEach(([filename, content]) => {
                      const blob = new Blob([content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    });

                    toast({
                      title: "Extension files downloaded!",
                      description: "Check your Downloads folder for the extension files and README instructions.",
                    });
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Browser Extension Files
                </Button>

                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                  <p><strong>Installation:</strong> After downloading, extract files to a folder, go to chrome://extensions/, 
                  enable Developer mode, and click "Load unpacked" to select your extension folder.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>
            Irreversible actions that will affect your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <h4 className="font-medium">Reset Settings</h4>
              <p className="text-sm text-muted-foreground">
                Reset all settings to their default values. This will not affect your log entries.
              </p>
            </div>
            <Button variant="destructive" onClick={handleDataReset}>
              Reset Settings
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pt-4 border-t">
            <div>
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button variant="destructive" disabled>
              Delete Account
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Account deletion is not yet available. Please contact support if you need to delete your account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
