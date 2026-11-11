// supabase/functions/reset-analytics/index.ts
// /analiz sayfasından çağrılır: verilen tarihten ÖNCEKİ analitik kayıtlarını siler.
// Şifre sunucuda kontrol edilir (ANALYTICS_ADMIN_PASSWORD secret'ı), silme service role ile yapılır.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// tablo → zaman sütunu
const TABLES: { table: string; column: string }[] = [
  { table: 'analytics_events', column: 'ts' },
  { table: 'page_views',       column: 'ts' },
  { table: 'active_sessions',  column: 'last_seen' },
]

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Yalnızca POST' }, 405)

  try {
    const expected = Deno.env.get('ANALYTICS_ADMIN_PASSWORD')
    if (!expected) return json({ error: 'ANALYTICS_ADMIN_PASSWORD tanımlı değil' }, 500)

    const { password, before } = await req.json()
    if (password !== expected) return json({ error: 'Şifre yanlış' }, 401)

    const beforeDate = new Date(before)
    if (!before || Number.isNaN(beforeDate.getTime())) {
      return json({ error: 'Geçerli bir tarih gerekli' }, 400)
    }
    if (beforeDate.getTime() > Date.now()) {
      return json({ error: 'Gelecekteki bir tarih seçilemez' }, 400)
    }
    const iso = beforeDate.toISOString()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const deleted: Record<string, number> = {}
    const errors: Record<string, string> = {}
    for (const { table, column } of TABLES) {
      const { error, count } = await supabaseAdmin
        .from(table)
        .delete({ count: 'exact' })
        .lt(column, iso)
      if (error) errors[table] = error.message
      else deleted[table] = count ?? 0
    }

    return json({ success: Object.keys(errors).length === 0, before: iso, deleted, errors })
  } catch (error: any) {
    return json({ error: error.message || 'Hata oluştu' }, 400)
  }
})
