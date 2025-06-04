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
    
    try {
      const payload = { ...data, specialties: selectedSpecialties, userId: user.uid };
      const url = editingSupervisor ? `/api/supervisors/${editingSupervisor.id}` : '/api/supervisors';
      const method = editingSupervisor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: editingSupervisor ? 'Supervisor Updated' : 'Supervisor Added',
          description: `${data.name} has been ${editingSupervisor ? 'updated' : 'added'} successfully.`
        });
        
        setIsDialogOpen(false);
        setEditingSupervisor(null);
        setSelectedSpecialties([]);
        form.reset();
        loadSupervisors();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save supervisor profile.',
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

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) ? prev.filter(s => s !== specialty) : [...prev, specialty]
    );
  };

  const SupervisorForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl><Input placeholder="Dr. Jane Smith" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Title/Credentials</FormLabel>
              <FormControl><Input placeholder="LPC, PhD" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl><Input type="email" placeholder="supervisor@clinic.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (Optional)</FormLabel>
              <FormControl><Input placeholder="(555) 123-4567" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div>
          <FormLabel>Specialties</FormLabel>
          <div className="grid grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto border rounded p-2">
            {specialtyOptions.map(specialty => (
              <label key={specialty} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedSpecialties.includes(specialty)}
                  onChange={() => toggleSpecialty(specialty)}
                  className="rounded"
                />
                <span>{specialty}</span>
              </label>
            ))}
          </div>
          {selectedSpecialties.length === 0 && (
            <p className="text-sm text-red-500 mt-1">Select at least one specialty</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="supervisionType" render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="sessionFrequency" render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="asNeeded">As Needed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="sessionDuration" render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (hours)</FormLabel>
              <FormControl><Input type="number" step="0.5" min="0.5" max="4" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Notes (Optional)</FormLabel>
            <FormControl><Textarea placeholder="Additional notes..." className="resize-none" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={selectedSpecialties.length === 0}>
            {editingSupervisor ? 'Update' : 'Add'} Supervisor
          </Button>
        </div>
      </form>
    </Form>
  );

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
                
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingSupervisor ? 'Edit Supervisor' : 'Add New Supervisor'}</DialogTitle>
                    <DialogDescription>
                      {editingSupervisor 
                        ? 'Update supervisor details, specialties, and session preferences.'
                        : 'Add supervisor contact information and session preferences to track supervision relationships.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <SupervisorForm />
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