import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

declare global {
  // Reuse the same client in dev/HMR to avoid multiple GoTrue instances.
  var __designforgeSupabaseClient: SupabaseClient | undefined;
}

function createSafeClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabaseClient =
  globalThis.__designforgeSupabaseClient ??
  (globalThis.__designforgeSupabaseClient = createSafeClient());
