'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, LogIn, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/components/ui/utils';
import { interactionService, type NotificationItem } from '@/services/interaction.service';

function formatRelativeDate(value: string) {
  const createdAt = new Date(value);
  const now = new Date();
  const diffMinutes = Math.max(1, Math.floor((now.getTime() - createdAt.getTime()) / 60000));

  if (diffMinutes < 60) {
    return `Hace ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Hace ${diffHours} h`;
  }

  return createdAt.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasToken, setHasToken] = useState(false);

  const [displayName, setDisplayName] = useState('Usuario');

  const parseMarketplaceProductId = (linkUrl?: string | null) => {
    if (!linkUrl) return null;
    const match = linkUrl.match(/\/marketplace\/(\d+)/);
    return match ? Number(match[1]) : null;
  };

  const refreshNotifications = async () => {
    const token = localStorage.getItem('token');
    setHasToken(Boolean(token));

    if (!token) {
      setItems([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const data = await interactionService.getNotifications();
      setItems((data.items || []).slice(0, 10));
      setUnreadCount(data.unreadCount);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshNotifications();
    setDisplayName(localStorage.getItem('user_name') || localStorage.getItem('name') || 'Usuario');

    const handleStorage = () => refreshNotifications();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleStorage);
    };
  }, []);

  const handleNotificationClick = async (item: NotificationItem) => {
    if (item.type === 'order-delivered-review') {
      const productId = parseMarketplaceProductId(item.linkUrl);

      if (!item.isRead) {
        try {
          await interactionService.markNotificationAsRead(item.id);
          setItems((prev) => prev.filter((notification) => notification.id !== item.id));
          setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {
          // Si falla el marcado, igual permitimos abrir el modal.
        }
      }

      setOpen(false);

      if (!productId) {
        toast.error('No se pudo abrir la valoración porque faltó el producto.');
        return;
      }

      window.dispatchEvent(
        new CustomEvent('open-review-modal', {
          detail: {
            productId,
            notificationId: item.id,
            linkUrl: item.linkUrl,
          },
        }),
      );
      return;
    }

    if (!item.isRead) {
      try {
        await interactionService.markNotificationAsRead(item.id);
        setItems((prev) => prev.filter((notification) => notification.id !== item.id));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Si falla el marcado, igual permitimos navegar.
      }
    }

    setOpen(false);

    if (item.linkUrl) {
      router.push(item.linkUrl);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      refreshNotifications();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
        aria-label="Abrir notificaciones"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {!hasToken && (
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-background" />
        )}
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-border/60 px-6 py-5 text-left">
              <SheetTitle>Notificaciones</SheetTitle>
              <SheetDescription>
                {hasToken
                  ? `${displayName}, aquí verás alertas de pedidos, pagos y valoraciones.`
                  : 'Inicia sesión para ver tus notificaciones y el estado de tus pedidos.'}
              </SheetDescription>
            </SheetHeader>

            {!hasToken ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <LogIn className="h-7 w-7" />
                </div>
                <div className="max-w-sm space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Tu bandeja está vacía por ahora</h3>
                  <p className="text-sm text-muted-foreground">
                    Al iniciar sesión podrás seguir el estado de tus pedidos y recibir acceso rápido a las reseñas pendientes.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row">
                  <Button className="flex-1" onClick={() => router.push('/login')}>
                    Iniciar sesión
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => router.push('/register')}>
                    Crear cuenta
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 min-h-0 flex-col">
                <div className="flex items-center justify-between gap-3 px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    {unreadCount > 0
                      ? `Tienes ${unreadCount} notificación${unreadCount === 1 ? '' : 'es'} sin leer.`
                      : 'No tienes notificaciones pendientes.'}
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={refreshNotifications} disabled={loading}>
                    <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    Actualizar
                  </Button>
                </div>

                <ScrollArea className="flex-1 min-h-0 px-3 pb-3">
                  {items.length === 0 ? (
                    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/20 px-6 text-center">
                      <CheckCheck className="mb-3 h-10 w-10 text-muted-foreground" />
                      <h3 className="font-semibold text-foreground">Todo al día</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Cuando un pedido cambie de estado o tengas una valoración pendiente, aparecerá aquí.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 px-3">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNotificationClick(item)}
                          className={cn(
                            'w-full rounded-2xl border px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
                            item.isRead ? 'border-border/60 bg-background' : 'border-primary/20 bg-primary/5',
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={cn('h-2.5 w-2.5 rounded-full', item.isRead ? 'bg-muted-foreground/40' : 'bg-red-500')} />
                                <h4 className="font-semibold text-foreground">{item.title}</h4>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.message}</p>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeDate(item.createdAt)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}