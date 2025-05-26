import { SettingsView } from "@/components/settings/SettingsView";

export default function SettingsPage() {
  return (
    <div className="ive-spacing-lg">
      <div className="ive-fade-in space-y-3">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground/80 text-lg leading-relaxed">
          Manage your goals, preferences, and account settings to customize your ClarityLog experience.
        </p>
      </div>
      
      <div className="ive-fade-in">
        <SettingsView />
      </div>
    </div>
  );
}
