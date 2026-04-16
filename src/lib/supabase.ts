import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Database types ────────────────────────────────────────────────────────────
export interface ScenarioRow {
  id: string;
  user_id: string;
  name: string;
  scenario_data: Record<string, unknown>;
  map_image_path: string | null;
  created_at: string;
  updated_at: string;
}
