import { V2Sidebar } from "./V2Sidebar";

interface V2LayoutProps {
  children: React.ReactNode;
}

export function V2Layout({ children }: V2LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <V2Sidebar />
      <main className="lg:pl-80">
        {children}
      </main>
    </div>
  );
}