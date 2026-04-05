import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getImageUrl(bucket: string, path: string) {
  // público
  if (bucket === 'product-catalog') {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  // privado → signed URL
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600);

  return data?.signedUrl;
}