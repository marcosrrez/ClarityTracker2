import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MessageSquareText, Phone, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface SMSSettingsProps {
  phoneNumber?: string;
  smsEnabled?: boolean;
  onUpdate: (phoneNumber: string, smsEnabled: boolean) => void;
}

export function SMSSettings({ phoneNumber = '', smsEnabled = false, onUpdate }: SMSSettingsProps) {
  const [phone, setPhone] = useState(phoneNumber);
  const [enabled, setEnabled] = useState(smsEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSave = async () => {
    if (enabled && !phone) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number to enable SMS entry.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(phone, enabled);
      toast({
        title: "SMS settings saved",
        description: enabled 
          ? `SMS entry enabled for ${phone}. You can now text your hours!`
          : "SMS entry disabled.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
          <MessageSquareText className="h-5 w-5" />
          <span>SMS Hour Entry</span>
        </CardTitle>
        <CardDescription className="dark:text-gray-300">
          Text your hours directly to ClarityLog for instant logging.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* SMS Toggle */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border">
          <div className="space-y-1">
            <Label className="text-base font-medium">Enable SMS Entry</Label>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Log hours by texting natural language messages
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {/* Phone Number Input */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={handlePhoneChange}
              className="pl-10"
              disabled={!enabled}
            />
          </div>
        </div>

        {/* Example Messages */}
        {enabled && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">
              Example Text Messages:
            </h4>
            <div className="space-y-1 text-sm text-green-600 dark:text-green-400">
              <p>• "Today, 3 hours, individual therapy CBT session"</p>
              <p>• "May 28, 2025, 2.5h, group therapy anxiety focus"</p>
              <p>• "Yesterday, 1.5 supervision hours with Dr. Smith"</p>
            </div>
            <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/20 rounded border border-green-300 dark:border-green-700">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Text to: {process.env.TWILIO_PHONE_NUMBER || '+1 (555) CLARITY'}
              </p>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="space-y-3">
          <h4 className="font-medium text-blue-700 dark:text-blue-300">How SMS Entry Works:</h4>
          <div className="space-y-2 text-sm text-muted-foreground dark:text-gray-400">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Text your hours in natural language after sessions</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>AI parses date, hours, type, and notes automatically</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Receive confirmation with parsed details</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Reply "CONFIRM" to save or "CANCEL" to discard</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Saving..." : "Save SMS Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}