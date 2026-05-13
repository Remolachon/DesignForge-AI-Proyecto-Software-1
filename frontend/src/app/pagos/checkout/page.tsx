import { Suspense } from "react";

import PaymentCheckoutClient from "./PaymentCheckoutClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PaymentCheckoutClient />
    </Suspense>
  );
}
