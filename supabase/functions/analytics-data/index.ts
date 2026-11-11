// supabase/functions/analytics-data/index.ts
// /analiz panelinin veri kaynağı. Şifre sunucuda kontrol edilir (ANALYTICS_ADMIN_PASSWORD),
// veriler service role ile okunur. Böylece analitik tabloları herkese açık anahtarla okunamaz.
//
// İstek:  { password, mode: 'check' }                → { ok: true }
//         { password, mode: 'data', since: ISO }     → { pageViews, events, liveEvents, activeVisitors }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Panelde gösterilmeyen teknik kayıtlar
const DEBUG_TYPES = ['gads_debug', 'meta_capi_response']
const MAX_RANGE_DAYS = 75
const PAGE_SIZE = 1000

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

// deno-lint-ignore no-explicit-any
async function fetchAll(client: any, table: string, columns: string, since: string, excludeTypes = false) {
  const rows: unknown[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    let q = client.from(table).select(columns).gte('ts', since)
    if (excludeTypes) q = q.not('type', 'in', `(${DEBUG_TYPES.join(',')})`)
    const { data, error } = await q.order('ts', { ascending: true }).range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
  }
  return rows
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Yalnızca POST' }, 405)

  try {
    const expected = Deno.env.get('ANALYTICS_ADMIN_PASSWORD')
    if (!expected) return json({ error: 'ANALYTICS_ADMIN_PASSWORD tanımlı değil' }, 500)

    const { password, mode, since } = await req.json()
    if (password !== expected) {
      await new Promise((r) => setTimeout(r, 800)) // deneme-yanılmayı yavaşlat
      return json({ error: 'Şifre yanlış' }, 401)
    }
    if (mode === 'check') return json({ ok: true })

    const sinceDate = new Date(since)
    if (Number.isNaN(sinceDate.getTime())) return json({ error: 'Geçersiz tarih' }, 400)
    const minDate = new Date(Date.now() - MAX_RANGE_DAYS * 86_400_000)
    const sinceIso = (sinceDate < minDate ? minDate : sinceDate).toISOString()

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const activeSince = new Date(Date.now() - 45_000).toISOString()
    const [pageViews, events, live, active] = await Promise.all([
      fetchAll(admin, 'page_views', 'session_id, page, ts', sinceIso),
      fetchAll(admin, 'analytics_events', 'session_id, type, payload, ts', sinceIso, true),
      admin.from('analytics_events')
        .select('id, type, payload, ts')
        .not('type', 'in', `(${[...DEBUG_TYPES, 'anon_visit', 'session_start'].join(',')})`)
        .order('ts', { ascending: false })
        .limit(20),
      admin.from('active_sessions').select('session_id', { count: 'exact', head: true }).gte('last_seen', activeSince),
    ])

    return json({
      pageViews,
      events,
      liveEvents: live.data ?? [],
      activeVisitors: active.count ?? 0,
    })
  } catch (error: any) {
    return json({ error: error.message || 'Hata oluştu' }, 400)
  }
})
