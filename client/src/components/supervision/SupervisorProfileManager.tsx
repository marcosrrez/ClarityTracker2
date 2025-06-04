import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Users, Mail, Phone, Clock, Award, Star, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUser } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const supervisorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  title: z.string().min(2, 'Title is required'),
  licenseNumber: z.string().optional(),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  phone: z.string().optional(),
  specialties: z.array(z.string()).min(1, 'At least one specialty required'),
  supervisionType: z.enum(['individual', 'group', 'both']),
  sessionFrequency: z.enum(['weekly', 'biweekly', 'monthly', 'asNeeded']),
  sessionDuration: z.string(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true)
});

type SupervisorProfile = z.infer<typeof supervisorSchema> & {
  id: string;
  createdAt: Date;
  totalHours: number;
};

const specialtyOptions = [
  'Anxiety Disorders', 'Depression & Mood Disorders', 'Trauma & PTSD', 'Substance Abuse',
  'Family Therapy', 'Couples Therapy', 'Adolescent Therapy', 'Child Therapy', 'Group Therapy',
  'Cognitive Behavioral Therapy', 'Dialectical Behavior Therapy', 'EMDR', 'Play Therapy',
  'Art Therapy', 'Eating Disorders', 'Grief & Loss', 'LGBTQ+ Issues', 'Cultural Competency',
  'Crisis Intervention'
];

export function SupervisorProfileManager() {
  const { user } = useUser();
  const { toast } = useToast();
  const [supervisors, setSupervisors] = useState<SupervisorProfile[]>([]);
  const [editingSupervisor, setEditingSupervisor] = useState<SupervisorProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof supervisorSchema>>({
    resolver: zodResolver(supervisorSchema),
    defaultValues: {
      name: '', title: '', licenseNumber: '', email: '', phone: '',
      specialties: [], supervisionType: 'individual', sessionFrequency: 'weekly',
      sessionDuration: '1', notes: '', isActive: true
    }
  });

  useEffect(() => {
    loadSupervisors();
  }, [user]);

  const loadSupervisors = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/supervisors/${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setSupervisors(data);
      }
    } catch (error) {
      console.error('Error loading supervisors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: z.infer<typeof supervisorSchema>) => {
    if (!user) return;
    
    // Validate specialties selection
    if (selectedSpecialties.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one specialty.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const payload = { 
        ...data, 
        specialties: selectedSpecialties, 
        userId: user.uid,
        totalHours: 0 // Initialize with 0 total hours
      };
      
      console.log('Submitting supervisor data:', payload);
      
      const url = editingSupervisor ? `/api/supervisors/${editingSupervisor.id}` : '/api/supervisors';
      const method = editingSupervisor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Supervisor saved successfully:', result);
        
        toast({
          title: editingSupervisor ? 'Supervisor Updated' : 'Supervisor Added',
          description: `${data.name} has been ${editingSupervisor ? 'updated' : 'added'} successfully.`
        });
        
        setIsDialogOpen(false);
        setEditingSupervisor(null);
        setSelectedSpecialties([]);
        loadSupervisors();
      } else {
        const error = await response.text();
        console.error('Server error:', error);
        toast({
          title: 'Error',
          description: `Failed to save supervisor: ${error}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save supervisor profile. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (supervisor: SupervisorProfile) => {
    setEditingSupervisor(supervisor);
    setSelectedSpecialties(supervisor.specialties);
    form.reset({
      name: supervisor.name, title: supervisor.title, licenseNumber: supervisor.licenseNumber || '',
      email: supervisor.email || '', phone: supervisor.phone || '', specialties: supervisor.specialties,
      supervisionType: supervisor.supervisionType, sessionFrequency: supervisor.sessionFrequency,
      sessionDuration: supervisor.sessionDuration, notes: supervisor.notes || '', isActive: supervisor.isActive
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (supervisorId: string) => {
    if (!confirm('Are you sure you want to delete this supervisor profile?')) return;
    
    try {
      const response = await fetch(`/api/supervisors/${supervisorId}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Supervisor Deleted', description: 'Supervisor profile has been removed.' });
        loadSupervisors();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete supervisor profile.', variant: 'destructive' });
    }
  };

  // Form state moved to parent level to prevent reset on re-renders
  const [formData, setFormData] = useState({
    name: editingSupervisor?.name || '',
    title: editingSupervisor?.title || '',
    email: editingSupervisor?.email || '',
    phone: editingSupervisor?.phone || '',
    supervisionType: editingSupervisor?.supervisionType || 'individual',
    sessionFrequency: editingSupervisor?.sessionFrequency || 'weekly',
    sessionDuration: editingSupervisor?.sessionDuration || '1',
    notes: editingSupervisor?.notes || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleInputChange = (field: string, value: string) => {
    console.log(`Input changed - ${field}:`, value);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('Updated form data:', newData);
      return newData;
    });
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) ? prev.filter(s => s !== specialty) : [...prev, specialty]
    );
  };

  const SupervisorForm = () => {
    
    const handleFormSubmit = async () => {
      console.log('Direct submit triggered');
      
      if (selectedSpecialties.length === 0) {
        console.log('Validation failed: no specialties selected');
        toast({
          title: 'Validation Error',
          description: 'Please select at least one specialty.',
          variant: 'destructive'
        });
        return;
      }

      if (!formData.name.trim() || !formData.title.trim()) {
        console.log('Validation failed - form data:', formData);
        toast({
          title: 'Validation Error',
          description: 'Name and Title are required.',
          variant: 'destructive'
        });
        return;
      }

      setIsSubmitting(true);
      
      try {
        const data = {
          ...formData,
          specialties: selectedSpecialties,
          isActive: true
        };

        console.log('Form data to submit:', data);
        
        await handleSubmit(data);
        console.log('handleSubmit completed successfully');
        
        // Close dialog and refresh list
        setIsDialogOpen(false);
        setEditingSupervisor(null);
        loadSupervisors();
        
        toast({
          title: 'Success',
          description: `Supervisor ${editingSupervisor ? 'updated' : 'added'} successfully.`
        });
      } catch (error) {
        console.error('Error in handleSubmit:', error);
        toast({
          title: 'Error',
          description: 'Failed to save supervisor. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="p-4 sm:p-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Dr. Jane Smith"
                className="w-full h-11 px-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title/Credentials
              </label>
              <input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="LPC, PhD"
                className="w-full h-11 px-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email (Optional)
              </label>
              <input
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                type="email"
                placeholder="supervisor@clinic.com"
                className="w-full h-11 px-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone (Optional)
              </label>
              <input
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full h-11 px-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>
          </div>

          {/* Specialties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Specialties <span className="text-red-500">*</span>
            </label>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-300 dark:border-gray-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {specialtyOptions.map(specialty => (
                  <label 
                    key={specialty} 
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSpecialties.includes(specialty)}
                      onChange={() => toggleSpecialty(specialty)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>
            {selectedSpecialties.length === 0 && (
              <p className="text-sm text-red-500 mt-1">Please select at least one specialty</p>
            )}
            {selectedSpecialties.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedSpecialties.map(specialty => (
                  <span 
                    key={specialty}
                    className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md text-xs"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Session Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                value={formData.supervisionType}
                onChange={(e) => handleInputChange('supervisionType', e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base"
              >
                <option value="individual">Individual</option>
                <option value="group">Group</option>
                <option value="both">Both</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency
              </label>
              <select
                value={formData.sessionFrequency}
                onChange={(e) => handleInputChange('sessionFrequency', e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="asNeeded">As Needed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (hours)
              </label>
              <input
                value={formData.sessionDuration}
                onChange={(e) => handleInputChange('sessionDuration', e.target.value)}
                type="number"
                step="0.5"
                min="0.5"
                max="4"
                placeholder="1.0"
                className="w-full h-11 px-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-base"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="flex-1 h-11 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={selectedSpecialties.length === 0 || isSubmitting}
              className="flex-1 h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : (editingSupervisor ? 'Update' : 'Add')} Supervisor
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto py-8 px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Supervision Network
              </h1>
              <p className="text-muted-foreground mt-2">
                Build and manage your professional supervision relationships
              </p>
            </div>
            
            {supervisors.length > 0 && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
                    onClick={() => {
                      setEditingSupervisor(null);
                      setSelectedSpecialties([]);
                      form.reset();
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supervisor
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="w-full max-w-none sm:max-w-2xl fixed inset-0 sm:relative sm:inset-auto rounded-none sm:rounded-3xl border-0 bg-white dark:bg-gray-900 shadow-2xl p-0 gap-0">
                  <DialogHeader className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                    <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {editingSupervisor ? 'Edit Supervisor' : 'Add New Supervisor'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                      {editingSupervisor 
                        ? 'Update supervisor details and preferences.'
                        : 'Add supervisor contact information and preferences.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto">
                    <SupervisorForm />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Supervisors</p>
                    <p className="text-2xl font-bold">{supervisors.filter(s => s.isActive).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <Award className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours Logged</p>
                    <p className="text-2xl font-bold">{supervisors.reduce((sum, s) => sum + s.totalHours, 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <Star className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Specialties Coverage</p>
                    <p className="text-2xl font-bold">
                      {supervisors.length > 0 ? new Set(supervisors.flatMap(s => s.specialties)).size : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Supervisors List */}
        <div className="space-y-6">
          {supervisors.length === 0 ? (
            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border-0 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-4">
                  <Building className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Build Your Supervision Network</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Add your clinical supervisors to track relationships, log supervision hours, and organize professional development.
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
                      onClick={() => {
                        setEditingSupervisor(null);
                        setSelectedSpecialties([]);
                        form.reset();
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Supervisor
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Supervisor</DialogTitle>
                      <DialogDescription>
                        Add supervisor contact information and session preferences to track supervision relationships.
                      </DialogDescription>
                    </DialogHeader>
                    <SupervisorForm />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            supervisors.map(supervisor => (
              <Card key={supervisor.id} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-xl">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{supervisor.name}</span>
                          {!supervisor.isActive && <Badge variant="secondary">Inactive</Badge>}
                        </CardTitle>
                        <p className="text-muted-foreground">{supervisor.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(supervisor)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(supervisor.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      {supervisor.email && (
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{supervisor.email}</span>
                        </div>
                      )}
                      
                      {supervisor.phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{supervisor.phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{supervisor.sessionFrequency} • {supervisor.sessionDuration}h sessions</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{supervisor.totalHours} total hours logged</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {supervisor.specialties.map(specialty => (
                          <Badge key={specialty} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {supervisor.notes && (
                    <div className="mt-6 pt-4 border-t border-border/50">
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground">{supervisor.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}