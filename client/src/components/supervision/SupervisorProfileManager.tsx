import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Mail, Phone, Users, Calendar, Clock, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
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
  startDate?: string;
  lastSession?: string;
  nextSessionDue?: string;
  complianceStatus?: 'on_track' | 'behind' | 'overdue';
  supervisionRatio?: number; // Client hours requiring supervision
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
  const [expandedSupervisors, setExpandedSupervisors] = useState<Set<string>>(new Set());
  
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
        // Enhance supervisors with compliance data
        const enhancedSupervisors = data.map((supervisor: Supervisor) => ({
          ...supervisor,
          ...calculateSupervisionCompliance(supervisor)
        }));
        setSupervisors(enhancedSupervisors);
      }
    } catch (error) {
      console.error('Error loading supervisors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate supervision compliance
  const calculateSupervisionCompliance = (supervisor: Supervisor) => {
    const now = new Date();
    const startDate = supervisor.startDate ? new Date(supervisor.startDate) : new Date(supervisor.createdAt);
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Mock client hours for demonstration (would come from log entries in real app)
    const clientHours = Math.floor(daysSinceStart * 0.5); // Assume 0.5 hours per day average
    const requiredSupervisionHours = Math.ceil(clientHours / 10); // 1:10 ratio
    const actualSupervisionHours = supervisor.totalHours;
    
    let complianceStatus: 'on_track' | 'behind' | 'overdue' = 'on_track';
    let nextSessionDue = '';
    
    if (actualSupervisionHours < requiredSupervisionHours) {
      const hoursDeficit = requiredSupervisionHours - actualSupervisionHours;
      if (hoursDeficit >= 2) {
        complianceStatus = 'overdue';
      } else {
        complianceStatus = 'behind';
      }
      
      // Calculate next session due date based on frequency
      const frequencyDays = {
        'weekly': 7,
        'biweekly': 14,
        'monthly': 30,
        'asNeeded': 14
      };
      
      const lastSessionDate = supervisor.lastSession ? new Date(supervisor.lastSession) : startDate;
      const nextDue = new Date(lastSessionDate.getTime() + frequencyDays[supervisor.sessionFrequency] * 24 * 60 * 60 * 1000);
      nextSessionDue = nextDue.toLocaleDateString();
    }

    return {
      startDate: startDate.toLocaleDateString(),
      complianceStatus,
      supervisionRatio: clientHours,
      nextSessionDue,
      lastSession: supervisor.lastSession || 'No sessions yet'
    };
  };

  const toggleSupervisorExpansion = (supervisorId: string) => {
    const newExpanded = new Set(expandedSupervisors);
    if (newExpanded.has(supervisorId)) {
      newExpanded.delete(supervisorId);
    } else {
      newExpanded.add(supervisorId);
    }
    setExpandedSupervisors(newExpanded);
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
        {supervisors.map((supervisor) => {
          const isExpanded = expandedSupervisors.has(supervisor.id);
          const complianceIcon = supervisor.complianceStatus === 'on_track' ? CheckCircle : 
                                supervisor.complianceStatus === 'behind' ? AlertTriangle : XCircle;
          const complianceColor = supervisor.complianceStatus === 'on_track' ? 'text-green-600' : 
                                 supervisor.complianceStatus === 'behind' ? 'text-yellow-600' : 'text-red-600';
          const ComplianceIcon = complianceIcon;

          return (
            <div key={supervisor.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200">
              {/* Compact Header - Always Visible */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {supervisor.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {supervisor.name}
                        </h3>
                        <ComplianceIcon size={16} className={complianceColor} />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{supervisor.title}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          {supervisor.totalHours}h completed
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {supervisor.sessionFrequency} • {supervisor.sessionDuration}h sessions
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(supervisor)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(supervisor.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => toggleSupervisorExpansion(supervisor.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Compliance Alert - Compact */}
                {supervisor.complianceStatus !== 'on_track' && (
                  <div className={`mt-3 p-3 rounded-lg ${supervisor.complianceStatus === 'behind' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                    <div className="flex items-center gap-2">
                      <ComplianceIcon size={14} className={complianceColor} />
                      <span className={`text-sm font-medium ${supervisor.complianceStatus === 'behind' ? 'text-yellow-800 dark:text-yellow-200' : 'text-red-800 dark:text-red-200'}`}>
                        {supervisor.complianceStatus === 'behind' ? 'Supervision Due Soon' : 'Supervision Overdue'}
                      </span>
                    </div>
                    {supervisor.nextSessionDue && (
                      <p className={`text-xs mt-1 ${supervisor.complianceStatus === 'behind' ? 'text-yellow-700 dark:text-yellow-300' : 'text-red-700 dark:text-red-300'}`}>
                        Next session due: {supervisor.nextSessionDue}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Expanded Content - Detailed Information */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6 space-y-6">
                  {/* Supervision Timeline & Compliance */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Timeline Information */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Calendar size={16} />
                        Supervision Timeline
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Started</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{supervisor.startDate}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Last Session</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{supervisor.lastSession}</span>
                        </div>
                        {supervisor.nextSessionDue && (
                          <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <span className="text-sm text-blue-600 dark:text-blue-400">Next Due</span>
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{supervisor.nextSessionDue}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Compliance Tracking */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <ComplianceIcon size={16} className={complianceColor} />
                        Compliance Status
                      </h4>
                      <div className="space-y-3">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Client Hours Logged</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{supervisor.supervisionRatio || 0}h</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Supervision Required</span>
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{Math.ceil((supervisor.supervisionRatio || 0) / 10)}h</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Supervision Completed</span>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">{supervisor.totalHours}h</span>
                          </div>
                          <div className="mt-3 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, ((supervisor.totalHours || 0) / Math.max(1, Math.ceil((supervisor.supervisionRatio || 0) / 10))) * 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            1:10 ratio requirement (1 supervision hour per 10 client hours)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>

                  {/* Specialties */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {supervisor.specialties.map((specialty) => (
                        <span key={specialty} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Supervision Configuration */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Supervision Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                      Schedule Session
                    </button>
                    <button className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors">
                      Session History
                    </button>
                    <button className="flex-1 px-4 py-3 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-xl font-medium transition-colors">
                      Progress Report
                    </button>
                  </div>

                  {/* Notes Section */}
                  {supervisor.notes && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border-l-4 border-amber-400">
                      <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Notes</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300">{supervisor.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
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