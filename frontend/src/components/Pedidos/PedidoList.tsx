import { Pedido } from '@/components/Pedidos/types/pedido';
import { PedidoCard } from '@/components/Pedidos/PedidoCard';

interface Props {
  pedidos: Pedido[];
}

export function PedidoList({ pedidos }: Props) {
  if (pedidos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No se encontraron pedidos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pedidos.map((pedido) => (
        <PedidoCard key={pedido.id} pedido={pedido} />
      ))}
    </div>
  );
}