'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, UserCheck, UserX, UserPlus, RefreshCw, Mail, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  fetchStaff,
  assignFuncionarioRole,
  revokeFuncionarioRole,
  inviteFuncionario,
  removeFuncionario,
  type StaffMember,
} from '@/services/staff.service';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-primary">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active
          ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
          : 'bg-red-100 text-red-600 ring-1 ring-red-300'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StaffManagementPanel() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Invite state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Remove state
  const [memberToRemove, setMemberToRemove] = useState<StaffMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStaff();
      setStaff(data);
    } catch (err) {
      console.error('Error cargando staff:', err);
      setError('No se pudo cargar la lista de funcionarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleToggle = async (member: StaffMember) => {
    setActionLoading(member.id);
    try {
      if (member.role_active) {
        await revokeFuncionarioRole(member.id);
      } else {
        await assignFuncionarioRole(member.id);
      }
      await loadStaff();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      setError('No se pudo actualizar el estado del funcionario.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      await inviteFuncionario(inviteEmail.trim());
      setInviteOpen(false);
      setInviteEmail('');
      await loadStaff();
    } catch (err: unknown) {
      console.error('Error al invitar:', err);
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setInviteError(detail || 'Ocurrió un error al intentar invitar al usuario.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!memberToRemove) return;
    setRemoveLoading(true);
    try {
      await removeFuncionario(memberToRemove.id);
      setMemberToRemove(null);
      await loadStaff();
    } catch (err) {
      console.error('Error al remover funcionario:', err);
      setError('No se pudo eliminar al funcionario de la empresa.');
    } finally {
      setRemoveLoading(false);
    }
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const total = staff.length;
  const activos = staff.filter((m) => m.role_active).length;
  const inactivos = total - activos;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <section id="staff-management" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-primary">
            Gestión de funcionarios
          </h2>
          <p className="text-sm text-muted-foreground">
            Administra los permisos de tu equipo de trabajo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStaff}
            disabled={loading}
            id="staff-refresh-btn"
          >
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          {/* Botón invitar */}
          <Button size="sm" id="staff-invite-btn" onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Invitar funcionario
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Funcionarios activos"
          value={activos}
          icon={<UserCheck className="h-5 w-5 text-green-600" />}
          colorClass="bg-green-100"
        />
        <SummaryCard
          label="Funcionarios inactivos"
          value={inactivos}
          icon={<UserX className="h-5 w-5 text-red-500" />}
          colorClass="bg-red-100"
        />
        <SummaryCard
          label="Total de funcionarios"
          value={total}
          icon={<Users className="h-5 w-5 text-violet-600" />}
          colorClass="bg-violet-100"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Cargando funcionarios…</span>
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No hay funcionarios registrados en tu empresa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Nombre</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Asignado el
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Estado</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staff.map((member) => (
                  <tr
                    key={member.id}
                    className="transition-colors hover:bg-muted/20"
                  >
                    <td className="px-5 py-4 font-medium text-primary">
                      {member.first_name} {member.last_name}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        {member.email}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {member.assigned_at ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {new Date(member.assigned_at).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge active={member.role_active} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant={member.role_active ? 'outline' : 'default'}
                          disabled={actionLoading === member.id || removeLoading}
                          onClick={() => handleToggle(member)}
                          id={`staff-toggle-${member.id}`}
                          className={
                            member.role_active
                              ? 'border-red-300 text-red-600 hover:bg-red-50'
                              : ''
                          }
                        >
                          {actionLoading === member.id ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : member.role_active ? (
                            'Desactivar'
                          ) : (
                            'Activar'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:bg-red-100 hover:text-red-600"
                          disabled={actionLoading === member.id || removeLoading}
                          onClick={() => setMemberToRemove(member)}
                          title="Quitar de la empresa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleInvite}>
            <DialogHeader>
              <DialogTitle>Invitar a un nuevo funcionario</DialogTitle>
              <DialogDescription>
                Ingresa el correo electrónico del usuario. Debe estar registrado en LukArt y no pertenecer a otra empresa.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {inviteError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {inviteError}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviteLoading}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
                disabled={inviteLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={inviteLoading || !inviteEmail.trim()}>
                {inviteLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Invitar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar funcionario?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a{' '}
              <span className="font-semibold text-foreground">
                {memberToRemove?.first_name} {memberToRemove?.last_name}
              </span>{' '}
              de la empresa? Esta acción le quitará todos los accesos inmediatamente. No eliminará su cuenta de usuario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRemove();
              }}
              disabled={removeLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Quitar funcionario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
