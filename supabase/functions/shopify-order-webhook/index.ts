// supabase/functions/shopify-order-webhook/index.ts
// Shopify "Sipariş oluşturma" (orders/create) webhook'u. Her siparişi sunucudan sunucuya
// analytics_events tablosuna 'purchase' olarak yazar. Müşterinin tarayıcısına bağlı olmadığı için
// çerez reddi, reklam engelleyici ya da teşekkür sayfasının açılmaması siparişi kaçırmaz.
//
// Kurulum:
//   - Supabase secret: SHOPIFY_WEBHOOK_SECRET (Shopify → Ayarlar → Bildirimler → Webhook'lar
//     sayfasının altındaki imzalama anahtarı)
//   - Bu fonksiyonda "Verify JWT" KAPALI olmalı (Shopify Supabase anahtarı göndermez; istek
//     bunun yerine HMAC imzasıyla doğrulanır).
//
// Ziyaret eşleştirmesi: site sepeti oluştururken 'react_session_id' sepet özelliğini ekler
// (src/lib/shopify.ts → createShopifyCart). Shopify bunu siparişin note_attributes alanına taşır.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SESSION_ATTRIBUTE = 'react_session_id'

function bytesToBase64(bytes: ArrayBuffer) {
  let bin = ''
  new Uint8Array(bytes).forEach((b) => { bin += String.fromCharCode(b) })
  return btoa(bin)
}

/** Sabit süreli karşılaştırma (imza tahminini zorlaştırır) */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function verifyShopifyHmac(rawBody: string, header: string | null, secret: string) {
  if (!header) return false
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  return safeEqual(bytesToBase64(sig), header)
}

const text = (body: string, status = 200) => new Response(body, { status })

serve(async (req: Request) => {
  if (req.method !== 'POST') return text('Yalnızca POST', 405)

  const secret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET')
  if (!secret) return text('SHOPIFY_WEBHOOK_SECRET tanımlı değil', 500)

  const rawBody = await req.text()
  if (!(await verifyShopifyHmac(rawBody, req.headers.get('x-shopify-hmac-sha256'), secret))) {
    return text('İmza geçersiz', 401)
  }

  // deno-lint-ignore no-explicit-any
  let order: any
  try { order = JSON.parse(rawBody) } catch { return text('Geçersiz JSON', 400) }
  if (!order?.id) return text('Sipariş kimliği yok', 400)

  const orderId = String(order.id)
  // deno-lint-ignore no-explicit-any
  const sessionAttr = (order.note_attributes ?? []).find((a: any) => a?.name === SESSION_ATTRIBUTE)
  const sessionId = sessionAttr?.value ? String(sessionAttr.value) : null

  // Siteden gelmeyen siparişler (Shopify admin'den elle / taslak sipariş, POS vb.) panele yazılmaz.
  if (!sessionId) {
    console.log(`[shopify-order-webhook] ${orderId}: ${SESSION_ATTRIBUTE} yok, atlandı (source: ${order.source_name})`)
    return text('ok (siteden değil)')
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  // Shopify webhook'ları tekrar gönderebilir; aynı sipariş bir kez yazılır.
  const { data: existing, error: lookupError } = await admin
    .from('analytics_events')
    .select('id')
    .eq('type', 'purchase')
    .eq('payload->>source', 'webhook')
    .eq('payload->>orderId', orderId)
    .limit(1)
  if (lookupError) {
    console.error('[shopify-order-webhook] lookup:', lookupError.message)
    return text('Veritabanı hatası', 500) // Shopify tekrar dener
  }
  if (existing && existing.length > 0) return text('ok (zaten kayıtlı)')

  // deno-lint-ignore no-explicit-any
  const lineItems = (order.line_items ?? []) as any[]
  const items = lineItems.map((li) => {
    const quantity = Number(li.quantity) || 1
    const discount = Number(li.total_discount) || 0
    return {
      title: li.title ?? null,
      variant: li.variant_title ?? null,
      quantity,
      total: Math.round((Number(li.price) * quantity - discount) * 100) / 100,
    }
  })

  const { error: insertError } = await admin.from('analytics_events').insert({
    session_id: sessionId,
    type: 'purchase',
    payload: {
      orderId,
      orderNumber: order.order_number ?? null,
      total: Number(order.current_total_price ?? order.total_price),
      currency: order.currency ?? null,
      itemCount: lineItems.length,
      items,
      source: 'webhook',
    },
    ts: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(),
  })
  if (insertError) {
    console.error('[shopify-order-webhook] insert:', insertError.message)
    return text('Veritabanı hatası', 500)
  }

  return text('ok')
})
