import { createClient } from '@supabase/supabase-js'

// Safe to expose — anon key only, RLS protects data
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

