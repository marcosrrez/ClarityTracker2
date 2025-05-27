import { SettingsView } from "@/components/settings/SettingsView";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your goals, preferences, and account settings to customize your ClarityLog experience and track your path to licensure.
        </p>
      </div>
      
      <SettingsView />
    </div>
  );
}
