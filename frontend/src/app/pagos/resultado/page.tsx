import { Suspense } from "react";

import PaymentResultClient from "./PaymentResultClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PaymentResultClient />
    </Suspense>
  );
}
