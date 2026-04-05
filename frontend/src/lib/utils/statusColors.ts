export function getStatusColor(status: string): string {
  switch (status) {
    case 'En diseño':
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'En producción':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'Listo para entrega':
      return 'bg-green-100 text-green-700 border border-green-200';
    case 'Entregado':
      return 'bg-green-500 text-white border border-green-500';
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200';
  }
}