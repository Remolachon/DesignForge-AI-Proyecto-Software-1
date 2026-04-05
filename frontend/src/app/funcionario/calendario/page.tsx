'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addDays,
  startOfWeek,
  format,
  isSameDay,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { funcionarioOrderService } from '@/services/funcionario-order.service';
import { type AdminOrder } from '@/types/order';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type CalendarView = 'week' | 'day';

// ─── Constantes ───────────────────────────────────────────────────────────────
const TIME_SLOTS = Array.from({ length: 10 }, (_, i) => `${8 + i}:00`);
const ORDERS_DISPLAY_HOUR = '9:00';

// ─── Utilidades ───────────────────────────────────────────────────────────────
function getOrdersForDay(day: Date, orders: AdminOrder[]): AdminOrder[] {
  return orders.filter((order) =>
    isSameDay(new Date(order.deliveryDate), day),
  );
}

function getStatusDotColor(status: AdminOrder['status']): string {
  switch (status) {
    case 'En diseño':
      return 'bg-blue-500';
    case 'En producción':
      return 'bg-amber-500';
    case 'Listo para entregar':
      return 'bg-green-500';
    case 'Entregado':
      return 'bg-gray-400';
  }
}

// ─── Sub-componente: chip de pedido en celda ──────────────────────────────────
function OrderChip({ order }: { order: AdminOrder }) {
  return (
    <div className="p-1.5 bg-accent/20 border-l-2 border-accent rounded text-xs cursor-pointer hover:bg-accent/30 transition-colors">
      <p className="font-semibold truncate">{order.title}</p>
      <p className="text-muted-foreground truncate">{order.clientName}</p>
    </div>
  );
}

// ─── Sub-componente: vista semanal ────────────────────────────────────────────
interface WeekViewProps {
  weekDays: Date[];
  today: Date;
  orders: AdminOrder[];
}

function WeekView({ weekDays, today, orders }: WeekViewProps) {
  return (
    <div className="min-w-[700px]">
      {/* Cabecera de días */}
      <div className="grid grid-cols-8 border-b border-border">
        <div className="p-3 border-r border-border">
          <span className="text-xs font-medium text-muted-foreground">Hora</span>
        </div>
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={`p-3 border-r border-border text-center ${isToday ? 'bg-accent/10' : ''}`}
            >
              <p className="text-xs font-medium capitalize">
                {format(day, 'EEE', { locale: es })}
              </p>
              <p className={`text-lg font-semibold ${isToday ? 'text-accent' : ''}`}>
                {format(day, 'd')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filas de horas */}
      {TIME_SLOTS.map((time) => (
        <div key={time} className="grid grid-cols-8 border-b border-border">
          <div className="p-3 border-r border-border">
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
          {weekDays.map((day) => {
            const dayOrders = time === ORDERS_DISPLAY_HOUR ? getOrdersForDay(day, orders) : [];
            return (
              <div
                key={`${day.toISOString()}-${time}`}
                className="p-1.5 border-r border-border min-h-[72px] hover:bg-muted/30 transition-colors"
              >
                {dayOrders.length > 0 && (
                  <div className="space-y-1">
                    {dayOrders.map((order) => (
                      <OrderChip key={order.id} order={order} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Sub-componente: vista diaria ─────────────────────────────────────────────
interface DayViewProps {
  currentDate: Date;
  orders: AdminOrder[];
}

function DayView({ currentDate, orders }: DayViewProps) {
  const dayOrders = getOrdersForDay(currentDate, orders);

  return (
    <div>
      <div className="border-b border-border p-4">
        <h3 className="text-base font-semibold capitalize">
          {format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </h3>
      </div>
      {TIME_SLOTS.map((time) => {
        const orders = time === ORDERS_DISPLAY_HOUR ? dayOrders : [];
        return (
          <div
            key={time}
            className="border-b border-border min-h-[88px] hover:bg-muted/30 transition-colors"
          >
            <div className="flex gap-4 p-4">
              <span className="text-sm text-muted-foreground w-14 flex-shrink-0">{time}</span>
              <div className="flex-1 space-y-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 bg-accent/20 border-l-2 border-accent rounded text-sm hover:bg-accent/30 transition-colors"
                  >
                    <p className="font-semibold">{order.title}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {order.clientName} · {order.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function FuncionarioCalendario() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarView>('week');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await funcionarioOrderService.getOrders();
        setOrders(data);
      } catch (error: any) {
        toast.error(error?.message || 'No se pudieron cargar los pedidos del calendario');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const today = new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthLabel = format(weekStart, 'MMMM yyyy', { locale: es });

  const goToPrev = () =>
    setCurrentDate((d) => (view === 'week' ? subWeeks(d, 1) : addDays(d, -1)));

  const goToNext = () =>
    setCurrentDate((d) => (view === 'week' ? addWeeks(d, 1) : addDays(d, 1)));

  const goToToday = () => setCurrentDate(new Date());

  // Resumen de estados
  const statusSummary = [
    {
      label: 'En Diseño',
      count: orders.filter((o) => o.status === 'En diseño').length,
      dotColor: getStatusDotColor('En diseño'),
    },
    {
      label: 'En Producción',
      count: orders.filter((o) => o.status === 'En producción').length,
      dotColor: getStatusDotColor('En producción'),
    },
    {
      label: 'Listo para entregar',
      count: orders.filter((o) => o.status === 'Listo para entregar').length,
      dotColor: getStatusDotColor('Listo para entregar'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-primary mb-2">
              Calendario de Producción
            </h1>
            <p className="text-muted-foreground">
              Organiza y planifica las entregas
            </p>
          </div>
          {/* Toggle de vista */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(['week', 'day'] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                  view === v
                    ? 'bg-white shadow-sm font-medium text-black'
                    : 'text-muted-foreground hover:text-black'
                }`}
              >
                {v === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>
        </div>

        {/* Controles de navegación */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={goToPrev}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-base font-semibold capitalize min-w-[160px] text-center">
                  {view === 'week'
                    ? monthLabel
                    : format(currentDate, "d 'de' MMMM yyyy", { locale: es })}
                </h2>
                <Button variant="outline" size="icon" onClick={goToNext}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grid del calendario */}
        <Card>
          <CardContent className="pt-4 pb-0 px-0 overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Cargando calendario...
              </div>
            ) : view === 'week' ? (
              <WeekView weekDays={weekDays} today={today} orders={orders} />
            ) : (
              <DayView currentDate={currentDate} orders={orders} />
            )}
          </CardContent>
        </Card>

        {/* Resumen de estados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statusSummary.map(({ label, count, dotColor }) => (
            <Card key={label}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${dotColor}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-xl font-semibold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}