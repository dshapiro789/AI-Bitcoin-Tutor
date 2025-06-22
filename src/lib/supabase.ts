import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../core/config/env';

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);