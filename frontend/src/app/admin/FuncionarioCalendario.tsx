import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { addDays, startOfWeek, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { mockOrders } from '../data/mockData';

export default function FuncionarioCalendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'day'>('week');

  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

  const timeSlots = Array.from({ length: 10 }, (_, i) => `${8 + i}:00`);

  const handlePreviousWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Simular pedidos en el calendario
  const getOrdersForDay = (day: Date) => {
    return mockOrders.filter(order => {
      const deliveryDate = new Date(order.deliveryDate);
      return isSameDay(deliveryDate, day);
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-primary mb-2">
              Calendario de Producción
            </h1>
            <p className="text-muted-foreground">
              Organiza y planifica las entregas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'week' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setView('week')}
            >
              Semana
            </Button>
            <Button
              variant={view === 'day' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setView('day')}
            >
              Día
            </Button>
          </div>
        </div>

        {/* Calendar Controls */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="secondary" size="sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold">
                {format(startOfCurrentWeek, 'MMMM yyyy', { locale: es })}
              </h2>
              <Button variant="secondary" size="sm" onClick={handleNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="secondary" size="sm" onClick={handleToday}>
              Hoy
            </Button>
          </div>
        </Card>

        {/* Calendar Grid */}
        <Card className="overflow-auto">
          <div className="min-w-[800px]">
            {/* Week View */}
            {view === 'week' && (
              <div>
                {/* Header Days */}
                <div className="grid grid-cols-8 border-b border-border">
                  <div className="p-4 border-r border-border">
                    <span className="text-sm font-medium text-muted-foreground">Hora</span>
                  </div>
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={`p-4 border-r border-border text-center ${
                        isSameDay(day, new Date()) ? 'bg-accent/10' : ''
                      }`}
                    >
                      <p className="text-sm font-medium">
                        {format(day, 'EEE', { locale: es })}
                      </p>
                      <p className={`text-xl font-semibold ${
                        isSameDay(day, new Date()) ? 'text-accent' : ''
                      }`}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                {timeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-8 border-b border-border">
                    <div className="p-4 border-r border-border">
                      <span className="text-sm text-muted-foreground">{time}</span>
                    </div>
                    {weekDays.map((day) => {
                      const orders = getOrdersForDay(day);
                      return (
                        <div
                          key={`${day.toISOString()}-${time}`}
                          className="p-2 border-r border-border min-h-[80px] hover:bg-gray-50 transition-colors"
                        >
                          {time === '9:00' && orders.length > 0 && (
                            <div className="space-y-1">
                              {orders.map((order) => (
                                <div
                                  key={order.id}
                                  className="p-2 bg-accent/20 border-l-2 border-accent rounded text-xs cursor-pointer hover:bg-accent/30 transition-colors"
                                >
                                  <p className="font-semibold truncate">{order.title}</p>
                                  <p className="text-muted-foreground truncate">{order.clientName}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Day View */}
            {view === 'day' && (
              <div>
                <div className="border-b border-border p-4">
                  <h3 className="text-lg font-semibold">
                    {format(currentDate, 'EEEE, d MMMM yyyy', { locale: es })}
                  </h3>
                </div>
                {timeSlots.map((time) => (
                  <div key={time} className="border-b border-border p-4 min-h-[100px] hover:bg-gray-50 transition-colors">
                    <div className="flex gap-4">
                      <span className="text-sm text-muted-foreground w-16">{time}</span>
                      <div className="flex-1">
                        {/* Placeholder para eventos */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div>
                <p className="text-sm text-muted-foreground">En Diseño</p>
                <p className="text-xl font-semibold">
                  {mockOrders.filter(o => o.status === 'En diseño').length}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div>
                <p className="text-sm text-muted-foreground">En Producción</p>
                <p className="text-xl font-semibold">
                  {mockOrders.filter(o => o.status === 'En producción').length}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div>
                <p className="text-sm text-muted-foreground">Listos</p>
                <p className="text-xl font-semibold">
                  {mockOrders.filter(o => o.status === 'Listo para entrega').length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
