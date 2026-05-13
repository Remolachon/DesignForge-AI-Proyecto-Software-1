import { supabaseClient } from '@/lib/supabase/supabaseClient';

export async function getImageUrl(bucket: string, path: string) {
  // público
  if (bucket === 'product-catalog') {
    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  // privado → signed URL
  const { data } = await supabaseClient.storage
    .from(bucket)
    .createSignedUrl(path, 3600);

  return data?.signedUrl;
}