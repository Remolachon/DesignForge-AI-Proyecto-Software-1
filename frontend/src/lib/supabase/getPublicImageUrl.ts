// lib/supabase/getImageUrl.ts

import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function getPublicImageUrl(path: string) {
  const { data } = supabase.storage
    .from("product-catalog")
    .getPublicUrl(path);

  return data.publicUrl;
}