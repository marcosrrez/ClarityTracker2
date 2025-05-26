import { SettingsView } from "@/components/settings/SettingsView";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 text-lg leading-relaxed font-medium">
          Manage your goals, preferences, and account settings to customize your ClarityLog experience.
        </p>
      </div>
      
      <div>
        <SettingsView />
      </div>
    </div>
  );
}
