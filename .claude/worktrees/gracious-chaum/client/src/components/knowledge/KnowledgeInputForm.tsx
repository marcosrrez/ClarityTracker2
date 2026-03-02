import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeInputFormProps {
  userId: string;
  onSuccess?: () => void;
}

const KnowledgeInputForm: React.FC<KnowledgeInputFormProps> = ({ userId, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceType, setSourceType] = useState<'CE' | 'Book'>('CE');
  const [sourceTitle, setSourceTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !sourceTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create knowledge entry
      const response = await fetch('/api/knowledge-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title,
          content,
          sourceType,
          sourceTitle,
          tags
        })
      });

      if (!response.ok) throw new Error('Failed to create knowledge entry');
      
      const knowledgeEntry = await response.json();
      
      toast({
        title: "Knowledge Entry Created",
        description: "Your notes have been saved successfully."
      });

      // Generate prompts
      setIsGenerating(true);
      const promptResponse = await fetch(`/api/knowledge-entries/${knowledgeEntry.id}/generate-prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!promptResponse.ok) throw new Error('Failed to generate prompts');
      
      const { prompts } = await promptResponse.json();
      
      toast({
        title: "Study Prompts Generated",
        description: `Created ${prompts.length} study prompts for spaced repetition.`
      });

      // Reset form
      setTitle('');
      setContent('');
      setSourceTitle('');
      setTags([]);
      
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to save knowledge entry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black font-bold">
          {sourceType === 'CE' ? <GraduationCap className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
          Add Knowledge Entry
        </CardTitle>
        <CardDescription>
          Input notes from CE courses or books to generate study prompts for spaced repetition learning.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-black">Source Type</label>
              <Select value={sourceType} onValueChange={(value: 'CE' | 'Book') => setSourceType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CE">CE Course</SelectItem>
                  <SelectItem value="Book">Book</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-black">Source Title *</label>
              <Input
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                placeholder="e.g., 'The Body Keeps the Score' or 'CBT Fundamentals'"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-black">Entry Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title for this knowledge entry"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-black">Notes/Content *</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your notes here. Example: 'Trauma can disrupt the brain's stress response, leading to hyperarousal and difficulty with emotional regulation...'"
              rows={6}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-black">Tags (Optional)</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tags like 'CBT', 'trauma', 'ethics'"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            disabled={isLoading || isGenerating}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Entry...
              </>
            ) : isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Study Prompts...
              </>
            ) : (
              'Create Entry & Generate Prompts'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default KnowledgeInputForm;