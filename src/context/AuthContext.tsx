// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Order {
  id: string;
  date: string;
  total: string;
  status: string;
}

export interface Subscription {
  id: string;
  planTitle: string;
  frequency: string;
  series: string;
  hasCarbon: boolean;
  status: 'active' | 'cancelled';
  nextDelivery: string;
  price: number;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  membershipType: string;
  orders: Order[];
  subscription: Subscription | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (id: string, email: string) => {
    try {
      // Profil bilgisini çek
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
      
      // Siparişleri çek
      const { data: orders } = await supabase.from('orders').select('*').eq('user_id', id).order('created_at', { ascending: false });

      // Abonelik bilgisini çek
      // NOT: .maybeSingle() kullanarak, henüz aboneliği olmayan yeni kullanıcılarda
      // "406 Not Acceptable" hatası almayı engelliyoruz.
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', id)
        .eq('status', 'active')
        .maybeSingle();

      setUser({
        id,
        fullName: profile?.full_name || 'Değerli Müşterimiz',
        email,
        phone: profile?.phone,
        address: profile?.address,
        membershipType: 'Standart Üye',
        orders: orders?.map(o => ({
          id: o.id,
          date: new Date(o.created_at).toLocaleDateString('tr-TR'),
          total: `₺${o.total_price.toLocaleString('tr-TR')}`,
          status: o.status || 'Hazırlanıyor'
        })) || [],
        subscription: subs ? {
          id: subs.id,
          planTitle: subs.plan_title,
          frequency: subs.frequency,
          series: subs.series,
          hasCarbon: subs.has_carbon,
          status: subs.status,
          nextDelivery: new Date(subs.next_delivery).toLocaleDateString('tr-TR'),
          price: subs.price
        } : null
      });
    } catch (err) {
      console.error("Profil yükleme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı verilerini manuel olarak tazelemek için (Örn: Abonelik satın alınca)
  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetchProfile(session.user.id, session.user.email!);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchProfile(session.user.id, session.user.email!);
      else setLoading(false);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setLoading(true);
        await fetchProfile(session.user.id, session.user.email!);
      } else if (event === 'SIGNED_OUT') {
        // Çıkış eventi yakalandığında state'i temizle
        setUser(null);
        setLoading(false);
      }
    });

    return () => authSub.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });
  };

  const register = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({ 
      email: email.trim(), 
      password,
      options: { data: { full_name: fullName } }
    });
    return { error };
  };

  // GÜNCELLENMİŞ LOGOUT FONKSİYONU
  // finally bloğu sayesinde Supabase hata verse bile arayüzde çıkış işlemi gerçekleşir.
  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Çıkış işlemi sırasında hata:", error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, register, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};