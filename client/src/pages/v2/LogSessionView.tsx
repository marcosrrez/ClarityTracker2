import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Save,
  RefreshCw,
  MessageCircle,
  Clock,
  User,
  Calendar,
  Tag
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SessionEntry {
  dateOfContact: string;
  clientContactHours: number;
  supervisionType: string;
  notes: string;
  tags: string[];
  reflectionPrompt?: string;
}

const commonTags = [
  "Ethical Dilemma",
  "Diagnostic Uncertainty", 
  "Client Breakthrough",
  "Cultural Considerations",
  "Treatment Planning",
  "Crisis Intervention",
  "Family Dynamics",
  "Trauma Work",
  "Substance Use",
  "Adolescent Issues"
];

export default function LogSessionView() {
  const [isBasicOpen, setIsBasicOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [session, setSession] = useState<SessionEntry>({
    dateOfContact: new Date().toISOString().split('T')[0],
    clientContactHours: 1,
    supervisionType: 'individual',
    notes: '',
    tags: [],
    reflectionPrompt: ''
  });

  const handleSave = async () => {
    if (!session.notes.trim()) {
      toast({
        title: "Notes required",
        description: "Please add session notes before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await apiRequest('/api/log-entries', {
        method: 'POST',
        body: JSON.stringify({
          ...session,
          userId: 'demo-user',
          dateOfContact: new Date(session.dateOfContact),
        }),
      });

      if (session.notes.trim()) {
        await apiRequest('/api/ai/generate-insight', {
          method: 'POST',
          body: JSON.stringify({
            userId: 'demo-user',
            sessionLog: {
              notes: session.notes,
              clientContactHours: session.clientContactHours,
              dateOfContact: new Date(session.dateOfContact),
              supervisionType: session.supervisionType
            }
          }),
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/log-entries'] });
      
      toast({
        title: "Session logged successfully",
        description: "Your session has been saved and insights generated.",
      });

      setSession({
        dateOfContact: new Date().toISOString().split('T')[0],
        clientContactHours: 1,
        supervisionType: 'individual',
        notes: '',
        tags: [],
        reflectionPrompt: ''
      });

      if (session.notes.length > 100) {
        setShowReflection(true);
      }

    } catch (error) {
      toast({
        title: "Error saving session",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = (tag: string) => {
    if (!session.tags.includes(tag)) {
      setSession(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSession(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const generateReflectionPrompt = () => {
    const prompts = [
      "What challenged you most in this session?",
      "What intervention felt most effective today?",
      "How did you handle any ethical considerations?",
      "What would you do differently next time?",
      "What growth did you notice in yourself or your client?",
      "How did cultural factors influence this session?"
    ];
    
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    setSession(prev => ({ ...prev, reflectionPrompt: randomPrompt }));
    setShowReflection(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-80">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-black">Log Session</h1>
          <p className="text-gray-600">Record your client contact hours and session notes</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">127</p>
              <p className="text-sm text-gray-600">Total Hours</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <User className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">23</p>
              <p className="text-sm text-gray-600">This Month</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">5</p>
              <p className="text-sm text-gray-600">This Week</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <MessageCircle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-black">89%</p>
              <p className="text-sm text-gray-600">Goal Progress</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black font-bold">
              <Plus className="h-5 w-5 text-blue-600" />
              New Session Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <Collapsible open={isBasicOpen} onOpenChange={setIsBasicOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-blue-50 rounded-lg">
                <span className="font-semibold text-black">Basic Information</span>
                {isBasicOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Date of Contact
                    </label>
                    <Input
                      type="date"
                      value={session.dateOfContact}
                      onChange={(e) => setSession(prev => ({
                        ...prev,
                        dateOfContact: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Contact Hours
                    </label>
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      value={session.clientContactHours}
                      onChange={(e) => setSession(prev => ({
                        ...prev,
                        clientContactHours: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Supervision Type
                    </label>
                    <Select
                      value={session.supervisionType}
                      onValueChange={(value) => setSession(prev => ({
                        ...prev,
                        supervisionType: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="triadic">Triadic</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-green-50 rounded-lg">
                <span className="font-semibold text-black">Session Notes</span>
                {isNotesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <Textarea
                  placeholder="Describe your session, interventions used, client progress, and any observations..."
                  value={session.notes}
                  onChange={(e) => setSession(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  rows={6}
                  className="resize-none"
                />
                
                <Button
                  variant="outline"
                  onClick={generateReflectionPrompt}
                  className="w-full"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Generate Reflection Prompt
                </Button>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={isTagsOpen} onOpenChange={setIsTagsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-purple-50 rounded-lg">
                <span className="font-semibold text-black">Tags & Themes</span>
                {isTagsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Quick Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {commonTags.map((tag) => (
                      <Button
                        key={tag}
                        variant={session.tags.includes(tag) ? "default" : "outline"}
                        size="sm"
                        onClick={() => session.tags.includes(tag) ? removeTag(tag) : addTag(tag)}
                        className="text-xs"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {session.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Selected Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {session.tags.map((tag) => (
                        <Badge 
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Session
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {showReflection && (
          <Card className="border-l-4 border-l-blue-600 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-black font-bold">
                Reflection Opportunity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                {session.reflectionPrompt || "Would you like to reflect on this session?"}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    window.location.href = '/v2/journey?reflect=true';
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Reflection
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReflection(false)}
                >
                  Maybe Later
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}