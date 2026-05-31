import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Retrieve Supabase environment variables from import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.'
  );
}

// Instantiate the typed Supabase client for cloud connections
export const supabase = createClient<Database>(
  supabaseUrl || 'https://cohfeeekwzlqrgufxtwi.supabase.co',
  supabaseAnonKey || 'sb_publishable_VaxWmsFy2oa68FZapIN59Q_80tD6R9n'
);
