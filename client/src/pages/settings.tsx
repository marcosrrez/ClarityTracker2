import { SettingsView } from "@/components/settings/SettingsView";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Manage your goals, preferences, and account settings to customize your ClarityLog experience and track your path to licensure.
        </p>
      </div>
      
      <SettingsView />
    </div>
  );
}
