import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Mail, Phone, Users, Calendar, Clock } from 'lucide-react';
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
      <div className="grid gap-6">
        {supervisors.map((supervisor) => (
          <div key={supervisor.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {supervisor.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {supervisor.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">{supervisor.title}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(supervisor)}
                  className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(supervisor.id)}
                  className="p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {supervisor.email && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Mail size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{supervisor.email}</p>
                  </div>
                </div>
              )}
              {supervisor.phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Phone size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phone</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{supervisor.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Specialties */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Specialties</p>
              <div className="flex flex-wrap gap-2">
                {supervisor.specialties.map((specialty) => (
                  <span key={specialty} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            {/* Supervision Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={16} className="text-purple-600 dark:text-purple-400" />
                  <p className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wide font-semibold">Type</p>
                </div>
                <p className="text-sm font-bold text-purple-900 dark:text-purple-100 capitalize">{supervisor.supervisionType}</p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={16} className="text-orange-600 dark:text-orange-400" />
                  <p className="text-xs text-orange-600 dark:text-orange-400 uppercase tracking-wide font-semibold">Frequency</p>
                </div>
                <p className="text-sm font-bold text-orange-900 dark:text-orange-100 capitalize">{supervisor.sessionFrequency}</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className="text-green-600 dark:text-green-400" />
                  <p className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide font-semibold">Duration</p>
                </div>
                <p className="text-sm font-bold text-green-900 dark:text-green-100">{supervisor.sessionDuration} hour{supervisor.sessionDuration !== '1' ? 's' : ''}</p>
              </div>
            </div>

            {/* Progress & Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{supervisor.totalHours}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Hours</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Active</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-medium transition-colors">
                  Schedule Session
                </button>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors">
                  View Details
                </button>
              </div>
            </div>

            {/* Notes Section */}
            {supervisor.notes && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border-l-4 border-amber-400">
                <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide font-semibold mb-1">Notes</p>
                <p className="text-sm text-amber-800 dark:text-amber-200">{supervisor.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile-Optimized Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsDialogOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {editingSupervisor ? 'Edit Supervisor' : 'Add Supervisor'}
                </h3>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Full Name *
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Dr. Jane Smith"
                    className="w-full h-14 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Title/Credentials *
                  </label>
                  <input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="LPC, PhD"
                    className="w-full h-14 px-4 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Specialties * (Select at least one)
                </label>
                <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  {specialtyOptions.map((specialty) => (
                    <label key={specialty} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSpecialties.includes(specialty)}
                        onChange={() => toggleSpecialty(specialty)}
                        className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{specialty}</span>
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
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 space-y-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? 'Saving...' : (editingSupervisor ? 'Update' : 'Add')} Supervisor
              </button>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="w-full h-14 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold rounded-xl transition-all duration-200"
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