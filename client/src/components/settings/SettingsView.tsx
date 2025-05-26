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
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("File appears to be empty or has no data rows");
      }

      // Skip header row and process data
      const dataLines = lines.slice(1);
      let importedCount = 0;
      let errorCount = 0;

      for (const line of dataLines) {
        try {
          const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
          
          if (columns.length < 3) continue; // Skip malformed rows

          const entryData: InsertLogEntry = {
            dateOfContact: new Date(columns[0]),
            clientContactHours: parseFloat(columns[1]) || 0,
            indirectHours: columns[2]?.toLowerCase() === 'yes' || columns[2]?.toLowerCase() === 'true',
            supervisionHours: parseFloat(columns[3]) || 0,
            supervisionType: (columns[4] as any) || "none",
            techAssistedSupervision: columns[5]?.toLowerCase() === 'yes' || columns[5]?.toLowerCase() === 'true',
            notes: columns[6] || "",
          };

          if (user?.uid && !isNaN(entryData.dateOfContact.getTime())) {
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
        description: `Successfully imported ${importedCount} entries${errorCount > 0 ? ` (${errorCount} errors)` : ''}.`,
      });

      // Clear the file input
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
              <h4 className="font-medium mb-2">Import from Excel/CSV</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file with your existing data. Expected columns: Date, Client Contact Hours, 
                Indirect Hours, Supervision Hours, Supervision Type, Tech Assisted, Notes.
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
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose CSV File
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
                  <p>• Supported formats: CSV (.csv)</p>
                  <p>• First row should contain headers</p>
                  <p>• Dates should be in MM/DD/YYYY format</p>
                  <p>• Hours should be decimal numbers (e.g., 1.5)</p>
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
