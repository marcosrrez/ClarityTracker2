import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface Supervisor {
  id: string;
  name: string;
  title: string;
  email?: string;
  phone?: string;
  specialties: string[];
  supervisionType: 'individual' | 'group' | 'both';
  sessionFrequency: 'weekly' | 'biweekly' | 'monthly' | 'asNeeded';
  sessionDuration: string;
  notes?: string;
  isActive: boolean;
  userId: string;
  totalHours: number;
  createdAt: string;
}

const specialtyOptions = [
  'Anxiety Disorders',
  'Depression',
  'Trauma/PTSD',
  'Addiction/Substance Abuse',
  'Family Therapy',
  'Couples Therapy',
  'Child/Adolescent',
  'Grief/Loss',
  'Eating Disorders',
  'Personality Disorders',
  'LGBTQ+ Issues',
  'Cultural/Diversity',
  'Crisis Intervention'
];

export function SupervisorProfileManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    supervisionType: 'individual' as 'individual' | 'group' | 'both',
    sessionFrequency: 'weekly' as 'weekly' | 'biweekly' | 'monthly' | 'asNeeded',
    sessionDuration: '1',
    notes: ''
  });

  useEffect(() => {
    if (user?.uid) {
      loadSupervisors();
    }
  }, [user?.uid]);

  const loadSupervisors = async () => {
    try {
      const response = await fetch(`/api/supervisors/${user?.uid}`);
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) ? prev.filter(s => s !== specialty) : [...prev, specialty]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      email: '',
      phone: '',
      supervisionType: 'individual',
      sessionFrequency: 'weekly',
      sessionDuration: '1',
      notes: ''
    });
    setSelectedSpecialties([]);
    setEditingSupervisor(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name and Title are required.',
        variant: 'destructive'
      });
      return;
    }

    if (selectedSpecialties.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one specialty.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        specialties: selectedSpecialties,
        isActive: true,
        userId: user?.uid,
        totalHours: editingSupervisor?.totalHours || 0
      };

      const url = editingSupervisor 
        ? `/api/supervisors/${editingSupervisor.id}`
        : '/api/supervisors';
      
      const method = editingSupervisor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Supervisor ${editingSupervisor ? 'updated' : 'added'} successfully.`
        });
        setIsDialogOpen(false);
        resetForm();
        loadSupervisors();
      } else {
        throw new Error('Failed to save supervisor');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save supervisor. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (supervisor: Supervisor) => {
    setEditingSupervisor(supervisor);
    setFormData({
      name: supervisor.name,
      title: supervisor.title,
      email: supervisor.email || '',
      phone: supervisor.phone || '',
      supervisionType: supervisor.supervisionType,
      sessionFrequency: supervisor.sessionFrequency,
      sessionDuration: supervisor.sessionDuration,
      notes: supervisor.notes || ''
    });
    setSelectedSpecialties(supervisor.specialties);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Supervisors</h2>
        <button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
        >
          <Plus size={20} />
          Add Supervisor
        </button>
      </div>

      {/* Supervisors List */}
      <div className="grid gap-4">
        {supervisors.map((supervisor) => (
          <div key={supervisor.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {supervisor.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{supervisor.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {supervisor.specialties.slice(0, 3).map((specialty) => (
                    <span key={specialty} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
                      {specialty}
                    </span>
                  ))}
                  {supervisor.specialties.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-xs">
                      +{supervisor.specialties.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(supervisor)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(supervisor.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile-Optimized Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsDialogOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editingSupervisor ? 'Edit Supervisor' : 'Add Supervisor'}
                </h3>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-4 space-y-4">
              {/* Basic Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Dr. Jane Smith"
                  className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title/Credentials *
                </label>
                <input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="LPC, PhD"
                  className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Specialties * (Select at least one)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {specialtyOptions.map((specialty) => (
                    <label key={specialty} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <input
                        type="checkbox"
                        checked={selectedSpecialties.includes(specialty)}
                        onChange={() => toggleSpecialty(specialty)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Session Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.supervisionType}
                    onChange={(e) => handleInputChange('supervisionType', e.target.value)}
                    className="w-full h-12 px-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full h-12 px-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="asNeeded">As Needed</option>
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Duration (hours)
                </label>
                <input
                  value={formData.sessionDuration}
                  onChange={(e) => handleInputChange('sessionDuration', e.target.value)}
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="4"
                  placeholder="1.0"
                  className="w-full h-12 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
                  className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (editingSupervisor ? 'Update' : 'Add')} Supervisor
              </button>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="w-full h-12 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}