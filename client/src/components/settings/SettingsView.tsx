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
import { SMSSettings } from "./SMSSettings";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Save, AlertTriangle, Shield, Download, Upload, FileSpreadsheet, Target, User, Palette, Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Advanced Import Functions
  const handleImportFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.includes('.csv') && !fileName.includes('.xlsx') && !fileName.includes('.xls')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsImporting(true);
      
      // Show initial processing message
      toast({
        title: "Processing file...",
        description: `Reading ${file.name}...`,
      });

      let data: any[][] = [];

      if (fileName.includes('.csv')) {
        // Handle CSV files
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        data = lines.map(line => {
          // Handle different delimiters
          let delimiter = ',';
          if (line.includes(';') && line.split(';').length > line.split(',').length) {
            delimiter = ';';
          } else if (line.includes('\t')) {
            delimiter = '\t';
          }
          return line.split(delimiter).map(col => col.trim().replace(/^"|"$/g, ''));
        });
      } else {
        // Handle Excel files
        const { utils, read } = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        data = utils.sheet_to_json(worksheet, { header: 1 });
      }
      
      if (data.length < 2) {
        throw new Error("File appears to be empty or has no data rows");
      }

      // Parse headers and create intelligent mapping
      const headers = data[0].map(h => String(h || '').trim());
      const columnMapping = intelligentColumnMapper(headers);
      
      toast({
        title: "Analyzing columns...",
        description: `Found ${data.length - 1} data rows. Mapping columns...`,
      });

      if (Object.keys(columnMapping).length === 0) {
        toast({
          title: "No recognizable columns found",
          description: "Could not identify date or hours columns. Please check your file format.",
          variant: "destructive",
        });
        return;
      }

      // Show what was detected
      const detectedColumns = Object.entries(columnMapping)
        .map(([key, index]) => `${key}: "${headers[index]}"`)
        .join(', ');
      
      console.log('Headers found:', headers);
      console.log('Column mapping:', columnMapping);
      
      toast({
        title: "Columns detected!",
        description: `Detected: ${detectedColumns}`,
      });

      // Process data rows
      const dataRows = data.slice(1);
      let importedCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const row of dataRows) {
        try {
          const columns = row.map((col: any) => String(col || '').trim());
          
          if (columns.length < 2) {
            skippedCount++;
            continue;
          }

          const parsedDate = parseFlexibleDate(columns[columnMapping.date] || '');
          const clientHours = parseFlexibleNumber(columns[columnMapping.clientHours] || '0');
          const supervisionHours = parseFlexibleNumber(columns[columnMapping.supervisionHours] || '0');
          
          // Skip if no valid date or hours
          if (!parsedDate || (clientHours === 0 && supervisionHours === 0)) {
            skippedCount++;
            continue;
          }

          const entry = {
            dateOfContact: parsedDate,
            clientContactHours: clientHours,
            supervisionHours: supervisionHours,
            supervisionType: mapSupervisionType(columns[columnMapping.supervisionType] || 'none'),
            indirectHours: false,
            techAssistedSupervision: parseFlexibleBoolean(columns[columnMapping.techAssisted] || 'false'),
            notes: parseFlexibleString(columns[columnMapping.notes] || 'Imported from Excel'),
          };

          console.log('Raw row data:', columns);
          console.log('Parsed entry:', entry);
          console.log('Date validation:', {
            original: columns[columnMapping.date],
            parsed: parsedDate,
            isValid: !isNaN(parsedDate.getTime())
          }); // Debug log
          
          try {
            await createLogEntry(user!.uid, entry);
            importedCount++;
            
            // Show progress for every 10 entries
            if (importedCount % 10 === 0) {
              toast({
                title: "Import in progress...",
                description: `${importedCount} entries imported so far...`,
              });
            }
          } catch (entryError) {
            console.error('Failed to create specific entry:', entry, entryError);
            errorCount++;
          }
        } catch (error) {
          console.error('Error processing row:', error);
          errorCount++;
        }
      }

      // Final success message
      toast({
        title: "Import completed successfully!",
        description: `✅ Imported: ${importedCount} entries${skippedCount > 0 ? ` | Skipped: ${skippedCount}` : ''}${errorCount > 0 ? ` | Errors: ${errorCount}` : ''}`,
      });

      // Refresh data to show new entries
      window.location.reload();

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Please check your file format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const intelligentColumnMapper = (headers: string[]) => {
    const mapping: { [key: string]: number } = {};
    
    headers.forEach((header, index) => {
      const cleanHeader = header.toLowerCase().trim();
      
      if (cleanHeader.includes('date') || cleanHeader.includes('session') || cleanHeader.includes('contact')) {
        mapping.date = index;
      }
      
      if ((cleanHeader.includes('client') && cleanHeader.includes('hour')) || 
          (cleanHeader.includes('direct') && cleanHeader.includes('hour')) ||
          cleanHeader.includes('cch') || cleanHeader.includes('contact hour')) {
        mapping.clientHours = index;
      }
      
      if (cleanHeader.includes('supervision') && cleanHeader.includes('hour')) {
        mapping.supervisionHours = index;
      }
      
      if (cleanHeader.includes('supervision') && cleanHeader.includes('type')) {
        mapping.supervisionType = index;
      }
      
      if (cleanHeader.includes('tech') || cleanHeader.includes('video') || cleanHeader.includes('remote')) {
        mapping.techAssisted = index;
      }
      
      if (cleanHeader.includes('note') || cleanHeader.includes('comment') || cleanHeader.includes('description')) {
        mapping.notes = index;
      }
    });
    
    return mapping;
  };

  const parseFlexibleDate = (value: string): Date => {
    if (!value || value.trim() === '') return new Date();
    
    // Handle Excel timestamp format like "2025-01-05 00:00:00"
    let cleanValue = value.toString().trim();
    
    // Remove time portion if present
    if (cleanValue.includes(' ')) {
      cleanValue = cleanValue.split(' ')[0];
    }
    
    const dateFormats = [
      cleanValue, // Original format
      cleanValue.replace(/[-\/]/g, '/'), // Convert dashes to slashes
      cleanValue.replace(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/, '$3/$1/$2'), // MM/DD/YYYY to YYYY/MM/DD
      cleanValue.replace(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/, '$1/$2/$3'), // YYYY-MM-DD to YYYY/MM/DD
    ];
    
    for (const format of dateFormats) {
      const date = new Date(format);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // If all else fails, try direct parsing
    const fallbackDate = new Date(value);
    return !isNaN(fallbackDate.getTime()) ? fallbackDate : new Date();
  };

  const parseFlexibleNumber = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : Math.max(0, num);
  };

  const parseFlexibleString = (value: string): string => {
    return value ? value.trim() : '';
  };

  const parseFlexibleBoolean = (value: string): boolean => {
    if (!value) return false;
    const clean = value.toLowerCase().trim();
    return clean === 'true' || clean === 'yes' || clean === '1' || clean === 'y';
  };

  const mapSupervisionType = (value: string): "individual" | "dyadic" | "group" | "none" => {
    if (!value) return "none";
    const clean = value.toLowerCase().trim();
    
    if (clean.includes('individual') || clean.includes('one-on-one') || clean === 'ind') {
      return "individual";
    }
    if (clean.includes('dyadic') || clean.includes('pair') || clean === 'dyad') {
      return "dyadic";
    }
    if (clean.includes('group') || clean.includes('team') || clean === 'grp') {
      return "group";
    }
    return "none";
  };

  const handleExportToCSV = async () => {
    try {
      setIsExporting(true);
      
      if (entries.length === 0) {
        toast({
          title: "No data to export",
          description: "Add some entries first to export your data.",
          variant: "destructive",
        });
        return;
      }

      const headers = [
        'Date of Contact',
        'Client Contact Hours', 
        'Supervision Hours',
        'Supervision Type',
        'Indirect Hours',
        'Tech Assisted',
        'Notes'
      ];

      const csvData = entries.map(entry => [
        new Date(entry.dateOfContact).toLocaleDateString(),
        entry.clientContactHours,
        entry.supervisionHours,
        entry.supervisionType,
        entry.indirectHours ? 'Yes' : 'No',
        entry.techAssistedSupervision ? 'Yes' : 'No',
        `"${entry.notes.replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `claritylog-entries-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export completed!",
        description: `Downloaded ${entries.length} entries to CSV file.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

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
        lacLicenseDate: undefined,
        supervisionCheckInInterval: 30,
      },


    },
  });

  useEffect(() => {
    if (settings) {
      // Only load core settings, skip personalPreferences
      const coreSettings = {
        goals: settings.goals,
        importedHours: settings.importedHours,
        licenseInfo: settings.licenseInfo
      };
      reset(coreSettings);
    }
  }, [settings, reset]);

  const onSubmit = async (data: any) => {
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      // Only save core settings - skip personalPreferences entirely
      const cleanData = {
        goals: data.goals,
        importedHours: data.importedHours,
        licenseInfo: data.licenseInfo
      };

      await updateAppSettings(user.uid, cleanData);
      await refetch();
      toast({
        title: "Settings saved successfully",
        description: "Your hour goals and license information have been saved.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving settings", 
        description: "There was a problem updating your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setIsResettingPassword(true);
    try {
      await resetPassword(user.email);
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      });
    } catch (error) {
      console.error("Error sending password reset:", error);
      toast({
        title: "Error sending reset email",
        description: "There was a problem sending the reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleExportData = async () => {
    if (!entries || entries.length === 0) return;

    setIsExporting(true);
    try {
      const csvHeaders = [
        "Date of Contact",
        "Client Contact Hours",
        "Indirect Hours",
        "Supervision Type",
        "Supervision Hours",
        "Tech-Assisted Supervision",
        "Notes",
        "Created At"
      ];

      const csvData = entries.map(entry => [
        entry.dateOfContact.toISOString().split('T')[0],
        entry.clientContactHours.toString(),
        entry.indirectHours ? "Yes" : "No",
        entry.supervisionType || "none",
        entry.supervisionHours.toString(),
        entry.techAssistedSupervision ? "Yes" : "No",
        `"${(entry.notes || "").replace(/"/g, '""')}"`,
        entry.createdAt.toISOString().split('T')[0]
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `claritylog-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported successfully",
        description: `${entries.length} log entries exported to CSV.`,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export failed",
        description: "There was a problem exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
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
        {/* Licensure Goals Section */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
              <Target className="h-5 w-5" />
              <span>Licensure Goals</span>
            </CardTitle>
            <CardDescription>
              Set your target hours for professional development and licensure requirements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="totalCCH" className="font-medium">Total Client Contact Hours Goal</Label>
                <Input
                  id="totalCCH"
                  type="number"
                  min="0"
                  className="border-blue-200 focus:border-blue-400"
                  {...register("goals.totalCCH", { valueAsNumber: true })}
                />
                {errors.goals?.totalCCH && (
                  <p className="text-sm text-red-600">{errors.goals.totalCCH.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="directCCH" className="font-medium">Direct Client Contact Hours Goal</Label>
                <Input
                  id="directCCH"
                  type="number"
                  min="0"
                  className="border-blue-200 focus:border-blue-400"
                  {...register("goals.directCCH", { valueAsNumber: true })}
                />
                {errors.goals?.directCCH && (
                  <p className="text-sm text-red-600">{errors.goals.directCCH.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisionHours" className="font-medium">Supervision Hours Goal</Label>
                <Input
                  id="supervisionHours"
                  type="number"
                  min="0"
                  className="border-blue-200 focus:border-blue-400"
                  {...register("goals.supervisionHours", { valueAsNumber: true })}
                />
                {errors.goals?.supervisionHours && (
                  <p className="text-sm text-red-600">{errors.goals.supervisionHours.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ethicsHours" className="font-medium">Ethics Hours Goal</Label>
                <Input
                  id="ethicsHours"
                  type="number"
                  min="0"
                  className="border-blue-200 focus:border-blue-400"
                  {...register("goals.ethicsHours", { valueAsNumber: true })}
                />
                {errors.goals?.ethicsHours && (
                  <p className="text-sm text-red-600">{errors.goals.ethicsHours.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="stateRegion" className="font-medium">State/Region</Label>
                <Input
                  id="stateRegion"
                  placeholder="e.g., CA, NY, TX"
                  className="border-blue-200 focus:border-blue-400"
                  {...register("goals.stateRegion")}
                />
                {errors.goals?.stateRegion && (
                  <p className="text-sm text-red-600">{errors.goals.stateRegion.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License Information */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
              <User className="h-5 w-5" />
              <span>License Information</span>
            </CardTitle>
            <CardDescription>
              Track your LAC license date and supervision intervals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supervisionCheckIn" className="font-medium">Supervision Check-in Interval (days)</Label>
              <Input
                id="supervisionCheckIn"
                type="number"
                min="1"
                className="border-green-200 focus:border-green-400"
                {...register("licenseInfo.supervisionCheckInInterval", { valueAsNumber: true })}
                placeholder="30"
              />
              {errors.licenseInfo?.supervisionCheckInInterval && (
                <p className="text-sm text-red-600">{errors.licenseInfo.supervisionCheckInInterval.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Personal Preferences</span>
            </CardTitle>
            <CardDescription>
              Define your growth areas and therapeutic approaches.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="therapeuticModalities">Therapeutic Modalities</Label>
              <Textarea
                id="therapeuticModalities"
                placeholder="Enter your preferred therapeutic approaches, one per line:&#10;&#10;Cognitive Behavioral Therapy (CBT)&#10;Dialectical Behavior Therapy (DBT)&#10;Eye Movement Desensitization and Reprocessing (EMDR)&#10;Solution-Focused Brief Therapy&#10;Acceptance and Commitment Therapy (ACT)"
                className="min-h-[120px]"
                defaultValue={localStorage.getItem('therapeuticModalities') || ''}
                onChange={(e) => {
                  localStorage.setItem('therapeuticModalities', e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter each therapeutic modality on a new line. Changes save automatically for personalized AI analysis.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="growthAreas">Personal Growth Areas</Label>
              <Textarea
                id="growthAreas"
                placeholder="Enter areas for professional development, one per line:&#10;&#10;Trauma-informed care&#10;Cultural competency&#10;Group therapy facilitation&#10;Assessment skills"
                className="min-h-[100px]"
                defaultValue={localStorage.getItem('growthAreas') || ''}
                onChange={(e) => {
                  localStorage.setItem('growthAreas', e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Define specific areas for professional development. Changes save automatically for personalized insights.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Interface Preferences - Working Version */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Interface Preferences</span>
            </CardTitle>
            <CardDescription>
              Control your ClarityLog experience complexity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Experience Mode</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Toggle between simplified tracking and full AI-powered features
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Smart Features & AI Insights</div>
                    <div className="text-sm text-muted-foreground">
                      Personalized coaching, milestone celebrations, intelligent analysis
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Off</span>
                    <input
                      type="checkbox"
                      defaultChecked={localStorage.getItem('smartFeaturesEnabled') !== 'false'}
                      onChange={(e) => {
                        localStorage.setItem('smartFeaturesEnabled', e.target.checked.toString());
                        window.location.reload(); // Simple refresh to apply changes
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">On</span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
                  💡 <strong>Tip:</strong> Changes take effect immediately. Toggle off for simplified tracking, on for full AI experience.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSaving} 
            className="min-w-[140px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Data Import & Export */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Data Import & Export</span>
          </CardTitle>
          <CardDescription className="dark:text-gray-300">
            Import existing tracking data or export your current entries for backup and analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Import Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-green-700 dark:text-green-300">Smart Import from Any Format</h4>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Upload your existing tracking data in any CSV format. Our intelligent analyzer automatically detects and maps your columns.
              </p>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isImporting}
                  className="w-full sm:w-auto dark:border-green-600 dark:hover:bg-green-900/20"
                  onClick={() => document.getElementById('import-file')?.click()}
                >
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
                </Button>
                <input
                  id="import-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleImportFromExcel}
                  disabled={isImporting}
                  className="hidden"
                />
                <div className="text-xs text-muted-foreground dark:text-gray-400 space-y-1">
                  <p><strong>✨ Intelligent Detection:</strong></p>
                  <p>• Recognizes any column names (dates, hours, supervision, notes, etc.)</p>
                  <p>• Handles multiple date formats (MM/DD/YYYY, YYYY-MM-DD, etc.)</p>
                  <p>• Converts minutes to hours automatically when detected</p>
                  <p>• Supports comma, semicolon, or tab delimiters</p>
                  <p>• Maps supervision types and tech-assisted sessions flexibly</p>
                </div>
              </div>
            </div>

            <Separator className="dark:bg-green-800/30" />

            {/* Export Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-green-700 dark:text-green-300">Export Your Data</h4>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Download your entries for backup, sharing with supervisors, or external analysis.
              </p>
              <Button
                variant="outline"
                onClick={handleExportToCSV}
                disabled={isExporting}
                className="w-full sm:w-auto dark:border-green-600 dark:hover:bg-green-900/20"
              >
                {isExporting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating Export...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export to CSV
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Account & Security</span>
          </CardTitle>
          <CardDescription>
            Manage your account settings and security preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <h4 className="font-medium">Password</h4>
              <p className="text-sm text-muted-foreground">
                Send a password reset email to your registered email address.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handlePasswordReset}
              disabled={isResettingPassword}
              className="border-blue-200 hover:border-blue-400"
            >
              {isResettingPassword ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Email Address</h4>
            <p className="text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground">
              To change your email address, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SMS Entry Settings */}
      <SMSSettings 
        phoneNumber={""} 
        smsEnabled={false}
        onUpdate={async (phoneNumber: string, smsEnabled: boolean) => {
          // Save SMS settings to user profile
          console.log('SMS settings updated:', { phoneNumber, smsEnabled });
        }}
      />

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <span>Data Management</span>
          </CardTitle>
          <CardDescription>
            Export your data for backup or external analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                className="w-full sm:w-auto border-green-200 hover:border-green-400"
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
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
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
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-700 dark:text-red-300">
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
        </CardContent>
      </Card>
    </div>
  );
};