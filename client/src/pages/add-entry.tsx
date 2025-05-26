import { AddEntryForm } from "@/components/entries/AddEntryForm";

export default function AddEntryPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Add New Entry</h1>
        <p className="text-muted-foreground">
          Log your client contact hours, supervision sessions, and session notes to track your professional development progress.
        </p>
      </div>
      
      <AddEntryForm />
    </div>
  );
}
