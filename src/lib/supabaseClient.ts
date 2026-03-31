// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Vite ortam değişkenlerini alıyoruz
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Hata ayıklama için basit bir kontrol (Opsiyonel ama önerilir)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL veya Anon Key eksik! Lütfen .env dosyanızı kontrol edin.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);