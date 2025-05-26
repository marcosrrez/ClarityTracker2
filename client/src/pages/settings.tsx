import { SettingsView } from "@/components/settings/SettingsView";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your goals, preferences, and account settings to customize your ClarityLog experience.
        </p>
      </div>
      
      <SettingsView />
    </div>
  );
}
