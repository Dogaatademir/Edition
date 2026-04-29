// src/hooks/useShopifyAnalytics.ts

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type DateRange = 'today' | 'week' | 'month';

export interface DailyStat {
  date: string;
  sessions: number;
  purchases: number;
  convRate: number;
}

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
  pct: number;
}

export interface TopProduct {
  name: string;
  revenue: number;
  orders: number;
}

export interface ShopifyAnalyticsData {
  totalSessions: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  aov: number;
  abandonmentRate: number;
  abandonedCarts: number;       // checkoutSessions - totalOrders
  cartAddSessions: number;
  odemeViewSessions: number;    // React /odeme sayfasına giren unique session sayısı
  checkoutSessions: number;     // Shopify checkout'a geçen unique session sayısı
  dailyStats: DailyStat[];
  funnel: FunnelStep[];
  topPages: { page: string; count: number }[];
  topProducts: TopProduct[];
  loading: boolean;
  lastUpdated: Date | null;
}

function getRangeStart(range: DateRange): Date {
  const now = new Date();
  if (range === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

const EMPTY: ShopifyAnalyticsData = {
  totalSessions: 0, totalOrders: 0, totalRevenue: 0,
  conversionRate: 0, aov: 0, abandonmentRate: 0, abandonedCarts: 0,
  cartAddSessions: 0, odemeViewSessions: 0, checkoutSessions: 0,
  dailyStats: [], funnel: [], topPages: [], topProducts: [],
  loading: true, lastUpdated: null,
};

export function useShopifyAnalytics(range: DateRange = 'month'): ShopifyAnalyticsData {
  const [state, setState] = useState<ShopifyAnalyticsData>(EMPTY);

  const fetchData = useCallback(async () => {
    const rangeStart = getRangeStart(range);
    const now = new Date();

    const [pvResult, evResult] = await Promise.all([
      supabase.from('page_views').select('session_id, page'),
      supabase
        .from('analytics_events')
        .select('session_id, type, payload, ts')
        .gte('ts', rangeStart.toISOString()),
    ]);

    const pageViews = pvResult.data ?? [];
    const events = evResult.data ?? [];

    const totalSessions = new Set(pageViews.map(pv => pv.session_id)).size;

    const sessionsByDay: Record<string, Set<string>> = {};
    events.forEach(ev => {
      const d = new Date(ev.ts);
      const key = `${d.getDate()} ${d.toLocaleString('tr-TR', { month: 'short' })}`;
      if (!sessionsByDay[key]) sessionsByDay[key] = new Set();
      sessionsByDay[key].add(ev.session_id);
    });

    const purchaseEvents   = events.filter(e => e.type === 'purchase');
    const cartEvents       = events.filter(e => e.type === 'cart_add' || e.type === 'pixel_cart_add');
    const odemeViewEvents  = events.filter(e => e.type === 'react_odeme_view');
    const checkoutEvents   = events.filter(e => e.type === 'checkout_start');

    const purchaseSessionSet  = new Set(purchaseEvents.map(e => e.session_id));
    const cartSessionSet      = new Set(cartEvents.map(e => e.session_id));
    const odemeViewSessionSet = new Set(odemeViewEvents.map(e => e.session_id));
    const checkoutSessionSet  = new Set(checkoutEvents.map(e => e.session_id));

    const totalOrders        = purchaseSessionSet.size;
    const cartAddSessions    = cartSessionSet.size;
    const odemeViewSessions  = odemeViewSessionSet.size;
    const checkoutSessions   = checkoutSessionSet.size;

    // Terk edilen sepet = Shopify ödeme sayfasına gidenler - Siparişler
    const abandonedCarts  = Math.max(0, checkoutSessions - totalOrders);
    const abandonmentRate = checkoutSessions > 0
      ? (abandonedCarts / checkoutSessions) * 100
      : 0;

    let totalRevenue = 0;
    purchaseEvents.forEach(e => {
      const p = e.payload as Record<string, unknown> | null;
      totalRevenue += Number(p?.total_price ?? p?.price ?? p?.amount ?? 0);
    });

    const productMap: Record<string, { revenue: number; orders: number }> = {};
    purchaseEvents.forEach(e => {
      const p = e.payload as Record<string, unknown> | null;
      const name = String(p?.productTitle ?? p?.title ?? p?.product_title ?? 'Diğer');
      const price = Number(p?.total_price ?? p?.price ?? p?.amount ?? 0);
      if (!productMap[name]) productMap[name] = { revenue: 0, orders: 0 };
      productMap[name].revenue += price;
      productMap[name].orders += 1;
    });
    const topProducts = Object.entries(productMap)
      .map(([name, v]) => ({ name, revenue: v.revenue, orders: v.orders }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const purchasesByDay: Record<string, Set<string>> = {};
    purchaseEvents.forEach(e => {
      const d = new Date(e.ts);
      const key = `${d.getDate()} ${d.toLocaleString('tr-TR', { month: 'short' })}`;
      if (!purchasesByDay[key]) purchasesByDay[key] = new Set();
      purchasesByDay[key].add(e.session_id);
    });

    const dailyStats: DailyStat[] = [];
    const cur = new Date(rangeStart);
    while (cur <= now) {
      const key = `${cur.getDate()} ${cur.toLocaleString('tr-TR', { month: 'short' })}`;
      const daySessions = sessionsByDay[key]?.size ?? 0;
      const dayPurchases = purchasesByDay[key]?.size ?? 0;
      dailyStats.push({
        date: key,
        sessions: daySessions,
        purchases: dayPurchases,
        convRate: daySessions > 0 ? parseFloat(((dayPurchases / daySessions) * 100).toFixed(2)) : 0,
      });
      cur.setDate(cur.getDate() + 1);
    }

    const pageCounts: Record<string, number> = {};
    pageViews.forEach(pv => {
      if (pv.page) pageCounts[pv.page] = (pageCounts[pv.page] ?? 0) + 1;
    });
    const topPages = Object.entries(pageCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const conversionRate = totalSessions > 0 ? (totalOrders / totalSessions) * 100 : 0;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const funnel: FunnelStep[] = [
      { key: 'sessions',    label: 'Oturumlar',              count: totalSessions,      pct: 100 },
      { key: 'cart',        label: 'Sepete eklendi',          count: cartAddSessions,    pct: totalSessions > 0 ? parseFloat(((cartAddSessions / totalSessions) * 100).toFixed(2)) : 0 },
      { key: 'odeme_view',  label: 'Checkout başladı',        count: odemeViewSessions,  pct: totalSessions > 0 ? parseFloat(((odemeViewSessions / totalSessions) * 100).toFixed(2)) : 0 },
      { key: 'checkout',    label: 'Shopify ödeme sayfası',   count: checkoutSessions,   pct: totalSessions > 0 ? parseFloat(((checkoutSessions / totalSessions) * 100).toFixed(2)) : 0 },
      { key: 'purchase',    label: 'Sipariş tamamlandı',      count: totalOrders,        pct: parseFloat(conversionRate.toFixed(2)) },
    ];

    setState({
      totalSessions, totalOrders, totalRevenue,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      aov,
      abandonmentRate: parseFloat(abandonmentRate.toFixed(2)),
      abandonedCarts,
      cartAddSessions, odemeViewSessions, checkoutSessions,
      dailyStats, funnel, topPages, topProducts,
      loading: false, lastUpdated: new Date(),
    });
  }, [range]);

  useEffect(() => {
    setState(s => ({ ...s, loading: true }));
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return state;
}