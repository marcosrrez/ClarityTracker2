import { AddEntryForm } from "@/components/entries/AddEntryForm";

export default function AddEntryPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Add New Entry
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Log your client contact hours, supervision sessions, and session notes to track your professional development progress toward licensure.
        </p>
      </div>
      
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
        <AddEntryForm />
      </div>
    </div>
  );
}
