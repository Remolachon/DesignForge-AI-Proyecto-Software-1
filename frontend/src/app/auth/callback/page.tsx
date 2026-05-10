import { Suspense } from "react";

import GoogleCallbackClient from "./GoogleCallbackClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <GoogleCallbackClient />
    </Suspense>
  );
}
