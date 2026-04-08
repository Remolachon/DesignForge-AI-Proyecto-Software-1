import { supabaseClient } from '@/lib/supabase/supabaseClient';

export function getPublicImageUrl(path: string) {
  const { data } = supabaseClient.storage
    .from("product-catalog")
    .getPublicUrl(path);

  return data.publicUrl;
}