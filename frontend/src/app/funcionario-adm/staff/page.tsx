import Header from '@/components/Header';
import { StaffManagementPanel } from '@/components/dashboard/funcionario-adm/StaffManagementPanel';

export default function StaffPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <StaffManagementPanel />
      </main>
    </div>
  );
}
