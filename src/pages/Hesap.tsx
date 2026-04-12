// src/pages/Hesap.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerDetails } from '../lib/shopify';
import { useAuth } from '../context/AuthContext';

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(dateString));
};

const translateFinancialStatus = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'PAID': return 'Ödendi';
    case 'PENDING': return 'Bekliyor';
    case 'REFUNDED': return 'İade Edildi';
    case 'VOIDED': return 'İptal Edildi';
    default: return status || 'Bilinmiyor';
  }
};

const translateFulfillmentStatus = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'FULFILLED': return 'Kargolandı';
    case 'UNFULFILLED': return 'Hazırlanıyor';
    case 'PARTIALLY_FULFILLED': return 'Kısmen Kargolandı';
    default: return status || 'Hazırlanıyor';
  }
};

// Sipariş Detay Modalı
function OrderDetailModal({ order, onClose }: { order: any; onClose: () => void }) {
  const lineItems = order.lineItems?.edges
    ? order.lineItems.edges.map((e: any) => e.node)
    : [];

  const shippingAddress = order.shippingAddress;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Başlık */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-[#E5E5E5]">
          <div>
            <span className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-[#888888]">
              Sipariş Detayı
            </span>
            <h2 className="font-serif text-[1.6rem] leading-tight mt-1">
              #{order.orderNumber}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] border border-[#E5E5E5] px-4 py-2 hover:text-black hover:border-black transition-all"
          >
            Kapat
          </button>
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* Durum ve Tarih */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <span className="font-mono text-[0.75rem] text-[#888888]">
              {formatDate(order.processedAt)}
            </span>
            <div className="flex gap-2">
              <span className={`px-3 py-1 font-mono text-[0.55rem] tracking-[0.1em] uppercase ${
                order.financialStatus === 'PAID'
                  ? 'bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]'
                  : 'bg-[#FAFAFA] text-[#555555] border border-[#E5E5E5]'
              }`}>
                {translateFinancialStatus(order.financialStatus)}
              </span>
              <span className={`px-3 py-1 font-mono text-[0.55rem] tracking-[0.1em] uppercase ${
                order.fulfillmentStatus === 'FULFILLED'
                  ? 'bg-black text-white'
                  : 'bg-[#FAFAFA] text-black border border-[#E5E5E5]'
              }`}>
                {translateFulfillmentStatus(order.fulfillmentStatus)}
              </span>
            </div>
          </div>

          {/* Ürünler Bölümü */}
          <div>
            <h3 className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-black mb-4 pb-2 border-b border-black inline-block">
              Ürünler
            </h3>
            <div className="divide-y divide-[#E5E5E5]">
              {lineItems.length > 0 ? lineItems.map((item: any, idx: number) => {
                const price = item.variant?.priceV2 || item.originalTotalPrice || item.price;
                const imageUrl = item.variant?.image?.url || item.image?.url || item.variant?.image?.src;

                return (
                  <div key={idx} className="flex items-center justify-between py-4 gap-4">
                    <div className="w-16 h-16 bg-[#FAFAFA] border border-[#E5E5E5] flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover mix-blend-multiply"
                        />
                      ) : (
                        <span className="font-mono text-[0.45rem] text-[#888888] uppercase tracking-widest text-center leading-tight">
                          Görsel<br />Yok
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-[0.95rem] font-medium truncate">{item.title}</p>
                      {item.variant?.title && item.variant.title !== 'Default Title' && (
                        <p className="font-mono text-[0.6rem] text-[#888888] mt-0.5">{item.variant.title}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono text-[0.75rem] text-[#888888]">x{item.quantity}</p>
                      {price && (
                        <p className="font-mono text-[0.9rem] mt-0.5">
                          ₺{parseFloat(price.amount || price || '0').toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <p className="font-sans text-[0.85rem] text-[#888888] py-4">Ürün detayları gösterilemiyor.</p>
              )}
            </div>
          </div>

          {/* Fiyat Özeti */}
          <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-3">
            {order.subtotalPriceV2 && (
              <div className="flex justify-between">
                <span className="font-mono text-[0.65rem] uppercase text-[#888888] tracking-wider">Ara Toplam</span>
                <span className="font-mono text-[0.85rem]">
                  ₺{parseFloat(order.subtotalPriceV2.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {order.totalShippingPriceV2 && (
              <div className="flex justify-between">
                <span className="font-mono text-[0.65rem] uppercase text-[#888888] tracking-wider">Kargo</span>
                <span className="font-mono text-[0.85rem]">
                  {parseFloat(order.totalShippingPriceV2.amount) === 0
                    ? 'Ücretsiz'
                    : `₺${parseFloat(order.totalShippingPriceV2.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-[#E5E5E5] pt-3 mt-3">
              <span className="font-mono text-[0.65rem] uppercase text-black tracking-wider font-bold">Toplam</span>
              <span className="font-mono text-[1.1rem] font-bold">
                ₺{parseFloat(order.currentTotalPrice?.amount || order.totalPrice?.amount || '0').toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Teslimat Adresi */}
          {shippingAddress && (
            <div>
              <h3 className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-black mb-4 pb-2 border-b border-black inline-block">
                Teslimat Adresi
              </h3>
              <div className="font-sans text-[0.9rem] text-[#555555] leading-relaxed mt-4">
                {shippingAddress.firstName} {shippingAddress.lastName}<br />
                {shippingAddress.address1}<br />
                {shippingAddress.city}, {shippingAddress.zip}<br />
                {shippingAddress.country}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Hesap() {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const expiry = localStorage.getItem('customerTokenExpiry');

    // Token yoksa veya süresi dolduysa giriş sayfasına yönlendir
    if (!token || (expiry && new Date(expiry) < new Date())) {
      logout();
      navigate('/hesap/giris');
      return;
    }

    getCustomerDetails(token)
      .then((data) => {
        if (!data) {
          logout();
          navigate('/hesap/giris');
        } else {
          setCustomer(data);
        }
      })
      .finally(() => setLoading(false));
  }, [navigate, logout]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Auth yüklenirken veya müşteri verisi beklenirken boş sayfa gösterme
  if (loading) return null;

  const orders = customer?.orders?.edges
    ? customer.orders.edges.map((e: any) => e.node)
    : [];

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-20 min-h-screen">
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start gap-12 border-b border-[#E5E5E5] pb-12 mb-12">
        <div>
          <div className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-[#888888] mb-4">
            Profil Detayları
          </div>
          <h1 className="font-serif text-[3rem] leading-none text-[#000000]">
            Hoş Geldin, <br />
            <em className="italic">{customer?.firstName} {customer?.lastName}</em>
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] border border-[#E5E5E5] px-6 py-3 hover:text-black hover:border-black transition-all"
        >
          Oturumu Kapat
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Müşteri Bilgileri */}
        <div className="space-y-10">
          <div>
            <h4 className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-black mb-4 pb-2 border-b border-black inline-block">
              Müşteri Bilgileri
            </h4>
            <div className="space-y-4 pt-4">
              <div className="flex flex-col">
                <span className="font-mono text-[0.5rem] uppercase text-[#888888] tracking-widest">E-Posta</span>
                <span className="font-sans text-[0.95rem]">{customer?.email}</span>
              </div>
              {customer?.defaultAddress && (
                <div className="flex flex-col mt-4">
                  <span className="font-mono text-[0.5rem] uppercase text-[#888888] tracking-widest mb-1">Varsayılan Adres</span>
                  <span className="font-sans text-[0.9rem] text-[#555555] leading-relaxed">
                    {customer.defaultAddress.address1} <br />
                    {customer.defaultAddress.city}, {customer.defaultAddress.country}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sipariş Geçmişi */}
        <div className="lg:col-span-2">
          <h4 className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-black mb-8 pb-2 border-b border-black inline-block">
            Siparişlerim
          </h4>

          {orders.length === 0 ? (
            <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-10 text-center">
              <p className="font-serif italic text-[#888888] text-[1.1rem] mb-6">Henüz bir siparişiniz bulunmuyor.</p>
              <button
                onClick={() => navigate('/kahveler')}
                className="font-mono text-[0.6rem] tracking-[0.2em] uppercase bg-black text-white px-8 py-4 hover:bg-[#333333] transition-colors"
              >
                Seçkiyi İncele
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {orders.map((order: any) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left border border-[#E5E5E5] bg-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-black transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-[0.85rem] font-bold group-hover:underline underline-offset-2">
                        Sipariş #{order.orderNumber}
                      </span>
                      <span className="font-mono text-[0.55rem] text-[#888888] tracking-widest">
                        {formatDate(order.processedAt)}
                      </span>
                    </div>
                    <p className="font-sans text-[0.85rem] text-[#555555] line-clamp-1">
                      {order.lineItems?.edges
                        ? order.lineItems.edges.map((edge: any) => edge.node.title).join(', ')
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 flex-shrink-0">
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 font-mono text-[0.55rem] tracking-[0.1em] uppercase ${
                        order.financialStatus === 'PAID' ? 'bg-[#F0FDF4] text-[#166534]' : 'bg-[#FAFAFA] text-[#888888]'
                      }`}>
                        {translateFinancialStatus(order.financialStatus)}
                      </span>
                    </div>
                    <span className="font-mono text-[1.1rem] font-medium">
                      ₺{parseFloat(order.totalPrice?.amount || '0').toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}