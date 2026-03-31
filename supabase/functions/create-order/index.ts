// supabase/functions/create-order/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Preflight request (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Supabase Admin Client oluştur
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Veriyi al
    const { items, deliveryInfo, user_id } = await req.json()

    if (!items || items.length === 0) {
      throw new Error('Sepet boş')
    }

    let calculatedTotal = 0;
    const cleanItems = [];

    // 3. Fiyatları veritabanından çek ve hesapla
    for (const item of items) {
      const { data: product, error } = await supabaseAdmin
        .from('products')
        .select('price, title, size')
        .eq('id', item.id)
        .single()

      if (error || !product) {
        throw new Error(`Ürün bulunamadı veya pasif: ID ${item.id}`)
      }

      const quantity = item.quantity;
      // Adet kontrolü
      if (!quantity || quantity <= 0) throw new Error('Geçersiz adet');

      const itemTotal = Number(product.price) * quantity;
      calculatedTotal += itemTotal;

      cleanItems.push({
        id: item.id,
        title: product.title,
        size: product.size,
        quantity: quantity,
        unit_price: Number(product.price),
        total_price: itemTotal
      });
    }

    // Kargo ve Toplam
    const shippingCost = 0; 
    const grandTotal = calculatedTotal + shippingCost;

    // Fatura Adresi Mantığı
    const billingAddress = (deliveryInfo.faturaAdres && deliveryInfo.faturaSehir)
        ? `${deliveryInfo.faturaAdres}, ${deliveryInfo.faturaSehir}`
        : `${deliveryInfo.adres}, ${deliveryInfo.sehir}`;

    // 4. Siparişi Kaydet
    const { data: orderData, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          user_id: user_id || null,
          items: cleanItems,
          total_price: grandTotal,
          address: `${deliveryInfo.adres}, ${deliveryInfo.sehir}`,
          billing_address: billingAddress,
          phone: deliveryInfo.telefon,
          kvkk_consent: true,
          is_guest: !user_id,
          status: 'Hazırlanıyor'
        }
      ])
      .select()
      .single()

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ success: true, order: orderData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Bilinmeyen hata' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})