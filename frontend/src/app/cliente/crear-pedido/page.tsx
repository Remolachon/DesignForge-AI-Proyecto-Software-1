import { Suspense } from "react";

import CrearPedido from "@/components/crear-pedido/CrearPedido";
import Header from "@/components/Header";

export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <CrearPedido />
      </Suspense>
    </>
  );
}