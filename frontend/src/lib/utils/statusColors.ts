export function getStatusColor(status: string): string {
  switch (status) {
    case 'Pendiente':
      return 'bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800/60 dark:text-slate-100 dark:border-slate-600';
    case 'Pendiente de pago':
      return 'bg-yellow-100 text-yellow-900 border border-yellow-300 dark:bg-yellow-900/35 dark:text-yellow-200 dark:border-yellow-700';
    case 'En diseño':
      return 'bg-sky-100 text-sky-900 border border-sky-300 dark:bg-sky-900/35 dark:text-sky-200 dark:border-sky-700';
    case 'En producción':
      return 'bg-orange-100 text-orange-900 border border-orange-300 dark:bg-orange-900/35 dark:text-orange-200 dark:border-orange-700';
    case 'Listo para entregar':
      return 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-900/35 dark:text-emerald-200 dark:border-emerald-700';
    case 'Entregado':
      return 'bg-green-600 text-white border border-green-700 dark:bg-green-700 dark:text-green-100 dark:border-green-600';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-800/60 dark:text-gray-200 dark:border-gray-600';
  }
}