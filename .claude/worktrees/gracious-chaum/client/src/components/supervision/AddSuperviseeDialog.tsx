import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const addSuperviseeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  licenseLevel: z.string().min(1, "Please select a license level"),
  supervisionFrequency: z.string().min(1, "Please select supervision frequency"),
  startDate: z.string().min(1, "Please select a start date"),
  notes: z.string().optional(),
});

type AddSuperviseeData = z.infer<typeof addSuperviseeSchema>;

interface AddSuperviseeDialogProps {
  onSuperviseeAdded?: () => void;
}

export const AddSuperviseeDialog = ({ onSuperviseeAdded }: AddSuperviseeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<AddSuperviseeData>({
    resolver: zodResolver(addSuperviseeSchema),
  });

  const onSubmit = async (data: AddSuperviseeData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const superviseeData = {
        supervisorId: user.uid,
        superviseeId: data.email, // Use email as supervisee ID for now
        superviseeName: data.name,
        superviseeEmail: data.email,
        startDate: data.startDate, // Send as string, let server handle conversion
        endDate: null,
        supervisionType: 'direct' as const,
        supervisionFrequency: data.supervisionFrequency,
        requiredHours: 4000, // Default LPC requirement
        completedHours: 0,
        status: 'active' as const,
        contractSigned: false,
        backgroundCheckCompleted: false,
        licenseVerified: false,
        licenseLevel: data.licenseLevel,
        notes: data.notes || null,
      };

      const response = await fetch('/api/supervisees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(superviseeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add supervisee');
      }

      const newSupervisee = await response.json();

      toast({
        title: "Supervisee added successfully",
        description: `${data.name} has been added to your supervision roster.`,
      });

      // Invalidate and refetch supervisees data
      queryClient.invalidateQueries({ queryKey: ['/api/supervisees'] });
      
      reset();
      setOpen(false);
      onSuperviseeAdded?.();
    } catch (error) {
      console.error('Error adding supervisee:', error);
      toast({
        title: "Error adding supervisee",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Supervisee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Supervisee</DialogTitle>
          <DialogDescription>
            Add a new supervisee to your roster and set up their supervision requirements.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>License Level *</Label>
            <Select onValueChange={(value) => setValue("licenseLevel", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select license level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LAC">Licensed Associate Counselor (LAC)</SelectItem>
                <SelectItem value="LPCC">Licensed Professional Clinical Counselor (LPCC)</SelectItem>
                <SelectItem value="LMFT">Licensed Marriage and Family Therapist (LMFT)</SelectItem>
                <SelectItem value="LCSW">Licensed Clinical Social Worker (LCSW)</SelectItem>
                <SelectItem value="Graduate">Graduate Student</SelectItem>
                <SelectItem value="Intern">Intern</SelectItem>
              </SelectContent>
            </Select>
            {errors.licenseLevel && (
              <p className="text-sm text-destructive">{errors.licenseLevel.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Supervision Frequency *</Label>
            <Select onValueChange={(value) => setValue("supervisionFrequency", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            {errors.supervisionFrequency && (
              <p className="text-sm text-destructive">{errors.supervisionFrequency.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Supervision Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              {...register("startDate")}
            />
            {errors.startDate && (
              <p className="text-sm text-destructive">{errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this supervisee..."
              {...register("notes")}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Adding...
                </>
              ) : (
                "Add Supervisee"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};