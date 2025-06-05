import { ClientPortal } from '@/components/client-portal/ClientPortal';

export default function ClientDashboard() {
  const clientId = "client-demo-id"; // In a real app, this would come from auth/routing
  
  return (
    <ClientPortal clientId={clientId} />
  );
}