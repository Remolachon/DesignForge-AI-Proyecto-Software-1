import { Suspense } from "react";

import LoginForm from "@/components/auth/LoginForm";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}