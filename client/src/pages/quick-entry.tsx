import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Send, Clock, Calendar, User, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createLogEntry } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";

interface ParsedEntry {
  date?: string;
  hours?: number;
  type?: string;
  notes?: string;
  confidence?: number;
}

export default function QuickEntryPage() {
  const [isListening, setIsListening] = useState(false);
  const [entryText, setEntryText] = useState("");
  const [parsedEntry, setParsedEntry] = useState<ParsedEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Voice recognition setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
    }
  }, []);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Voice not supported",
        description: "Please type your entry manually.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setEntryText(transcript);
      parseEntry(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Voice recognition error",
        description: "Please try again or type manually.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
  };

  // Parse entry text using intelligent parsing
  const parseEntry = (text: string) => {
    try {
      const parsed: ParsedEntry = {};
      let confidence = 0;

      // Parse date
      const dateMatch = text.match(/(today|yesterday|(\d{1,2}\/\d{1,2}\/\d{4})|((january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}))/i);
      if (dateMatch) {
        if (dateMatch[1]?.toLowerCase() === 'today') {
          parsed.date = new Date().toLocaleDateString();
        } else if (dateMatch[1]?.toLowerCase() === 'yesterday') {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          parsed.date = yesterday.toLocaleDateString();
        } else {
          parsed.date = dateMatch[1];
        }
        confidence += 0.3;
      } else {
        parsed.date = new Date().toLocaleDateString(); // Default to today
        confidence += 0.1;
      }

      // Parse hours
      const hourMatch = text.match(/(\d+\.?\d*)\s*(hours?|h\b|direct|supervision)/i);
      if (hourMatch) {
        parsed.hours = parseFloat(hourMatch[1]);
        confidence += 0.4;
      }

      // Parse type
      const typeKeywords = {
        'individual': ['individual', 'one-on-one', 'single client'],
        'group': ['group', 'group therapy'],
        'family': ['family', 'couples', 'marriage'],
        'supervision': ['supervision', 'supervisory'],
        'assessment': ['assessment', 'evaluation', 'testing']
      };

      for (const [type, keywords] of Object.entries(typeKeywords)) {
        if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
          parsed.type = type;
          confidence += 0.2;
          break;
        }
      }

      // Extract notes (clean version)
      let notes = text;
      if (dateMatch) notes = notes.replace(dateMatch[0], '');
      if (hourMatch) notes = notes.replace(hourMatch[0], '');
      if (parsed.type) notes = notes.replace(new RegExp(parsed.type, 'gi'), '');
      
      parsed.notes = notes.replace(/\s+/g, ' ').trim() || 'Quick entry via mobile';
      if (parsed.notes.length > 10) confidence += 0.1;

      parsed.confidence = Math.min(confidence, 1);
      setParsedEntry(parsed);
    } catch (error) {
      console.error('Parsing error:', error);
      setParsedEntry(null);
    }
  };

  // Handle text change and parse
  const handleTextChange = (value: string) => {
    setEntryText(value);
    if (value.length > 10) {
      parseEntry(value);
    } else {
      setParsedEntry(null);
    }
  };

  // Submit entry
  const handleSubmit = async () => {
    if (!user?.uid || !parsedEntry?.hours) {
      toast({
        title: "Invalid entry",
        description: "Please ensure you've entered valid hours.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const entry = {
        dateOfContact: new Date(parsedEntry.date || new Date()),
        clientContactHours: parsedEntry.hours,
        supervisionHours: parsedEntry.type === 'supervision' ? parsedEntry.hours : 0,
        supervisionType: parsedEntry.type === 'supervision' ? 'individual' : 'none',
        techAssistedSupervision: false,
        notes: parsedEntry.notes || 'Quick entry via mobile',
      };

      // Adjust for supervision entries
      if (parsedEntry.type === 'supervision') {
        entry.clientContactHours = 0;
      }

      await createLogEntry(user.uid, entry as any);
      
      toast({
        title: "Entry saved!",
        description: `${parsedEntry.hours} hours logged successfully.`,
      });

      // Reset form
      setEntryText("");
      setParsedEntry(null);
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error saving entry",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
        <p className="text-muted-foreground mb-4">
          Please sign in to log your hours.
        </p>
        <Button onClick={() => window.location.href = '/auth'}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary">Quick Entry</h1>
        <p className="text-muted-foreground">
          Log your hours with voice or text
        </p>
      </div>

      {/* Voice/Text Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Describe Your Session</CardTitle>
          <CardDescription>
            Say or type something like: "Today, 3 hours, individual therapy CBT session"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder="Today, 3 hours, individual therapy..."
              value={entryText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="min-h-[100px] pr-12"
            />
            <Button
              variant={isListening ? "destructive" : "outline"}
              size="sm"
              className="absolute top-2 right-2"
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parsed Preview */}
      {parsedEntry && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Parsed Entry
              <Badge variant="secondary">
                {Math.round((parsedEntry.confidence || 0) * 100)}% confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm">{parsedEntry.date}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-green-500" />
                <span className="text-sm">{parsedEntry.hours}h</span>
              </div>
            </div>
            
            {parsedEntry.type && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-purple-500" />
                <span className="text-sm capitalize">{parsedEntry.type}</span>
              </div>
            )}
            
            {parsedEntry.notes && (
              <div className="flex items-start space-x-2">
                <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                <span className="text-sm">{parsedEntry.notes}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!parsedEntry?.hours || isSubmitting}
        className="w-full h-12 text-lg"
        size="lg"
      >
        {isSubmitting ? (
          "Saving..."
        ) : (
          <>
            <Send className="h-5 w-5 mr-2" />
            Log {parsedEntry?.hours || 0} Hours
          </>
        )}
      </Button>

      {/* Examples */}
      <Card className="bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-3">Example entries:</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• "Today, 3 hours, individual therapy CBT session"</p>
            <p>• "Yesterday, 2.5h, group therapy anxiety focus"</p>
            <p>• "May 28, 2025, 1.5 supervision hours"</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}