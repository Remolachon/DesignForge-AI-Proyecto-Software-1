import { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="font-satoshi contents">{children}</div>;
}
