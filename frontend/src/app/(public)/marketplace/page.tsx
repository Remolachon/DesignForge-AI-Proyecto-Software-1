import Header from "@/components/Header";
import { Marketplace } from "@/components/marketplace/Marketplace";
import { Suspense } from "react";

export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="p-8 text-center">Cargando catálogo...</div>}>
        <Marketplace />
      </Suspense>
    </>
  );
}