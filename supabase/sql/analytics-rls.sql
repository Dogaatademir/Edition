-- supabase/sql/analytics-rls.sql
-- Analitik tablolarını herkese açık (anon) anahtara karşı kilitler.
--   • Site ve Shopify pixel'i kayıt EKLEYEBİLİR (INSERT).
--   • Kimse herkese açık anahtarla OKUYAMAZ, GÜNCELLEYEMEZ, SİLEMEZ.
--   • /analiz paneli verileri şifreli `analytics-data` fonksiyonundan (service role) okur.
--
-- ÖNCE: analytics-data fonksiyonunu yükleyin ve yeni siteyi yayınlayın. Sonra bunu
-- Supabase → SQL Editor'da çalıştırın. (active_sessions tablosuna dokunulmaz.)

do $$
declare
  t text;
  p record;
begin
  foreach t in array array['analytics_events', 'page_views'] loop
    execute format('alter table public.%I enable row level security', t);
    -- mevcut tüm politikaları kaldır (adları bilinmediği için döngüyle)
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
    execute format(
      'create policy "public can insert" on public.%I for insert to anon, authenticated with check (true)', t
    );
  end loop;
end $$;

-- Panel artık realtime yerine sunucu fonksiyonunu kullanıyor; analytics_events yayını gereksiz.
-- (Tablo yayında değilse bu satır hata verir; o durumda yok sayabilirsiniz.)
-- alter publication supabase_realtime drop table public.analytics_events;
