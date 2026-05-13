'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { addDays, addWeeks, format, isSameDay, startOfWeek, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

import Header from '@/components/Header';
import { OrderDetailsModal } from '@/components/modals/OrderDetailsModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { funcionarioOrderService } from '@/services/funcionario-order.service';
import { type AdminOrder } from '@/types/order';

type CalendarView = 'week' | 'day';

type TimedOrder = AdminOrder & {
  assignedHour: number;
};

const WORK_HOURS_START = 8;
const WORK_HOURS_END = 18;
const TIME_SLOTS = Array.from({ length: WORK_HOURS_END - WORK_HOURS_START }, (_, i) => WORK_HOURS_START + i);

function getOrdersForDay(day: Date, orders: AdminOrder[]): AdminOrder[] {
  return orders.filter((order) => isSameDay(new Date(order.deliveryDate), day));
}

function distributeOrdersInDay(dayOrders: AdminOrder[]): TimedOrder[] {
  return dayOrders
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((order, index) => ({
      ...order,
      assignedHour: WORK_HOURS_START + (index % (WORK_HOURS_END - WORK_HOURS_START)),
    }));
}

function statusDot(status: AdminOrder['status']) {
  switch (status) {
    case 'En diseño':
      return 'bg-blue-500';
    case 'En producción':
      return 'bg-amber-500';
    case 'Listo para entregar':
      return 'bg-green-500';
    default:
      return 'bg-gray-400';
  }
}

function TimedOrderCard({ order, onClick }: { order: TimedOrder; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-2.5 rounded-lg border border-border bg-white hover:bg-muted/30 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">{order.title}</p>
          <p className="text-[11px] text-muted-foreground truncate">{order.clientName || 'Cliente'}</p>
          <p className="text-[11px] mt-1 inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" /> {order.assignedHour}:00
          </p>
        </div>
        <span className={`w-2.5 h-2.5 rounded-full mt-1 ${statusDot(order.status)}`} />
      </div>
    </button>
  );
}

function WeekGrid({ weekDays, orders, onOrderClick, today }: {
  weekDays: Date[];
  orders: AdminOrder[];
  onOrderClick: (id: string) => void;
  today: Date;
}) {
  return (
    <div className="min-w-[920px]">
      <div className="grid grid-cols-8 border-b border-border bg-muted/30">
        <div className="p-3 border-r border-border text-xs font-semibold text-muted-foreground">Hora</div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`p-3 border-r border-border text-center ${isSameDay(day, today) ? 'bg-accent/10' : ''}`}
          >
            <p className="text-xs font-medium capitalize">{format(day, 'EEE', { locale: es })}</p>
            <p className="text-lg font-semibold">{format(day, 'd')}</p>
          </div>
        ))}
      </div>

      {TIME_SLOTS.map((hour) => (
        <div key={hour} className="grid grid-cols-8 border-b border-border">
          <div className="p-3 border-r border-border text-xs text-muted-foreground">{hour}:00</div>
          {weekDays.map((day) => {
            const timed = distributeOrdersInDay(getOrdersForDay(day, orders));
            const atHour = timed.filter((o) => o.assignedHour === hour);

            return (
              <div key={`${day.toISOString()}-${hour}`} className="p-2 border-r border-border min-h-[88px]">
                <div className="space-y-1.5">
                  {atHour.map((order) => (
                    <TimedOrderCard key={order.id} order={order} onClick={() => onOrderClick(order.id)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DayList({ date, orders, onOrderClick }: {
  date: Date;
  orders: AdminOrder[];
  onOrderClick: (id: string) => void;
}) {
  const timedOrders = useMemo(() => distributeOrdersInDay(getOrdersForDay(date, orders)), [date, orders]);

  return (
    <div>
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold capitalize">{format(date, "EEEE, d 'de' MMMM yyyy", { locale: es })}</h3>
        <p className="text-sm text-muted-foreground">{timedOrders.length} pedidos programados</p>
      </div>

      {TIME_SLOTS.map((hour) => {
        const atHour = timedOrders.filter((o) => o.assignedHour === hour);
        return (
          <div key={hour} className="border-b border-border p-4">
            <div className="flex gap-4">
              <div className="w-16 text-sm text-muted-foreground">{hour}:00</div>
              <div className="flex-1 space-y-2">
                {atHour.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin pedidos</p>
                ) : (
                  atHour.map((order) => (
                    <TimedOrderCard key={order.id} order={order} onClick={() => onOrderClick(order.id)} />
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FuncionarioCalendario() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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

  const goToPrev = () => setCurrentDate((d) => (view === 'week' ? subWeeks(d, 1) : addDays(d, -1)));
  const goToNext = () => setCurrentDate((d) => (view === 'week' ? addWeeks(d, 1) : addDays(d, 1)));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-primary mb-2">Calendario de Producción</h1>
            <p className="text-muted-foreground">Pedidos distribuidos automáticamente entre 8:00 y 18:00</p>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              type="button"
              onClick={() => setView('week')}
              className={`px-4 py-1.5 text-sm rounded-md ${view === 'week' ? 'bg-white shadow-sm font-medium text-black' : 'text-muted-foreground hover:text-black'}`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setView('day')}
              className={`px-4 py-1.5 text-sm rounded-md ${view === 'day' ? 'bg-white shadow-sm font-medium text-black' : 'text-muted-foreground hover:text-black'}`}
            >
              Día
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={goToPrev}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-base font-semibold capitalize min-w-[180px] text-center">
                  {view === 'week'
                    ? format(weekStart, 'MMMM yyyy', { locale: es })
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

        <Card>
          <CardContent className="pt-4 pb-0 px-0 overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">Cargando calendario...</div>
            ) : view === 'week' ? (
              <WeekGrid weekDays={weekDays} orders={orders} onOrderClick={setSelectedOrderId} today={today} />
            ) : (
              <DayList date={currentDate} orders={orders} onOrderClick={setSelectedOrderId} />
            )}
          </CardContent>
        </Card>
      </main>

      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          isOpen={true}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
