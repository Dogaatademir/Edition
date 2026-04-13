// src/pages/Hesap.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getCustomerDetails, 
  createShopifyCart,
  updateCustomerProfile,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress
} from '../lib/shopify';
import { useAuth } from '../context/AuthContext';

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};

const translateFinancialStatus = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'PAID': return 'Ödendi';
    case 'PENDING': return 'Bekliyor';
    case 'REFUNDED': return 'İade Edildi';
    case 'VOIDED': return 'İptal Edildi';
    case 'PARTIALLY_REFUNDED': return 'Kısmi İade';
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

const formatPrice = (priceObject: any) => {
  if (!priceObject) return '0,00';
  const amount = priceObject.amount || priceObject.price || priceObject || '0';
  return parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
};

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
    <path d="M12 5v14m-7-7h14"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

function OrderDetailModal({ order, onClose }: { order: any; onClose: () => void }) {
  const [isReordering, setIsReordering] = useState(false);

  const lineItems = order.lineItems?.edges ? order.lineItems.edges.map((e: any) => e.node) : [];
  const shippingAddress = order.shippingAddress;
  const billingAddress = order.billingAddress;
  const fulfillment = order.successfulFulfillments?.[0];
  const trackingInfo = fulfillment?.trackingInfo?.[0];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleReorder = async () => {
    try {
      setIsReordering(true);
      const cartItems = lineItems.map((item: any) => ({
        variantId: item.variant?.id,
        quantity: item.quantity
      })).filter((item: any) => item.variantId);

      if (cartItems.length === 0) throw new Error("Sipariş edilebilir ürün bulunamadı.");

      const cartResponse = await createShopifyCart(cartItems);
      window.location.href = cartResponse.checkoutUrl;
    } catch (error) {
      console.error("Tekrar sipariş hatası:", error);
      alert("Ürünler sepete eklenirken bir sorun oluştu.");
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-8" onClick={onClose}>
      <div className="bg-white w-full max-w-4xl max-h-full overflow-y-auto flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-[#E5E5E5] sticky top-0 bg-white z-10">
          <div>
            <span className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-[#888888]">Sipariş Detayı</span>
            <div className="flex items-center gap-4 mt-1">
              <h2 className="font-serif text-[1.6rem] leading-tight">#{order.orderNumber}</h2>
              <span className="font-mono text-[0.65rem] text-[#888888] tracking-widest mt-1">{formatDate(order.processedAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleReorder} disabled={isReordering} className="font-mono text-[0.6rem] tracking-[0.2em] uppercase bg-black text-white px-6 py-3 hover:bg-[#333333] transition-all disabled:opacity-50">
              {isReordering ? 'Hazırlanıyor...' : 'Tekrar Sipariş Ver'}
            </button>
            <button onClick={onClose} className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] border border-[#E5E5E5] px-4 py-3 hover:text-black hover:border-black transition-all">
              Kapat
            </button>
          </div>
        </div>

        <div className="px-8 py-8 flex flex-col gap-10">
           <div>
            <h3 className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-black mb-4 pb-2 border-b border-black inline-block">1. Ürünler</h3>
            <div className="divide-y divide-[#E5E5E5] border border-[#E5E5E5] bg-[#FAFAFA] px-6">
              {lineItems.map((item: any, idx: number) => {
                const itemPrice = item.variant?.priceV2 || item.price;
                const imageUrl = item.variant?.image?.url || item.image?.url;
                return (
                  <div key={idx} className="flex items-center justify-between py-4 gap-4">
                    <div className="w-16 h-16 bg-white border border-[#E5E5E5] flex-shrink-0 flex items-center justify-center">
                      {imageUrl ? <img src={imageUrl} alt={item.title} className="w-full h-full object-cover mix-blend-multiply" /> : <span className="font-mono text-[0.45rem] text-[#888888] uppercase tracking-widest text-center leading-tight">Görsel<br />Yok</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-[0.95rem] font-medium truncate text-black">{item.title}</p>
                      {item.variant?.title && item.variant.title !== 'Default Title' && <p className="font-mono text-[0.65rem] text-[#555555] mt-1">{item.variant.title}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono text-[0.75rem] text-[#888888]">x{item.quantity}</p>
                      <p className="font-mono text-[0.9rem] text-black mt-0.5">₺{formatPrice(itemPrice)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-black mb-4 pb-2 border-b border-black inline-block">2. Adres & Teslimat</h3>
              <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-6 h-full">
                <div>
                  <span className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest block mb-2">Teslimat Adresi</span>
                  {shippingAddress ? (
                    <div className="font-sans text-[0.9rem] text-black leading-relaxed">
                      <span className="font-medium">{shippingAddress.firstName} {shippingAddress.lastName}</span><br />
                      {shippingAddress.address1} {shippingAddress.address2 && <>{shippingAddress.address2}</>}<br />
                      {shippingAddress.city}, {shippingAddress.province || ''} {shippingAddress.zip}<br />
                      {shippingAddress.country}
                    </div>
                  ) : <p className="font-sans text-[0.85rem] text-[#888888]">Adres bilgisi yok.</p>}
                </div>
                <div className="pt-4 border-t border-[#E5E5E5]">
                  <span className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest block mb-2">Kargo Durumu</span>
                  <span className={`px-2 py-1 font-mono text-[0.55rem] tracking-[0.1em] uppercase ${order.fulfillmentStatus === 'FULFILLED' ? 'bg-black text-white' : 'bg-white text-black border border-[#E5E5E5]'}`}>
                    {translateFulfillmentStatus(order.fulfillmentStatus)}
                  </span>
                  {trackingInfo && (
                    <div className="mt-3">
                      <span className="font-sans text-[0.85rem] text-[#555555] block">Takip No: <span className="text-black font-mono">{trackingInfo.number}</span></span>
                      {trackingInfo.url && <a href={trackingInfo.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[0.65rem] underline underline-offset-4 mt-2 inline-block hover:text-[#555555]">Kargoyu Takip Et</a>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-black mb-4 pb-2 border-b border-black inline-block">3. Ödeme & Fatura</h3>
              <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-6 h-full">
                <div>
                  <span className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest block mb-2">Ödeme Durumu</span>
                  <span className={`px-3 py-1 font-mono text-[0.55rem] tracking-[0.1em] uppercase inline-block ${order.financialStatus === 'PAID' ? 'bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]' : 'bg-white text-[#555555] border border-[#E5E5E5]'}`}>
                    {translateFinancialStatus(order.financialStatus)}
                  </span>
                </div>
                <div className="pt-4 border-t border-[#E5E5E5]">
                  <span className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest block mb-2">Fatura Adresi</span>
                  {billingAddress ? (
                    <div className="font-sans text-[0.85rem] text-[#555555] leading-relaxed">
                      {billingAddress.address1}, {billingAddress.city} {billingAddress.country}
                    </div>
                  ) : <p className="font-sans text-[0.85rem] text-[#888888]">Teslimat adresi ile aynı.</p>}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-black mb-4 pb-2 border-b border-black inline-block">4. Özet</h3>
            <div className="bg-black text-white p-6 space-y-3">
              <div className="flex justify-between">
                <span className="font-mono text-[0.65rem] uppercase text-[#A3A3A3] tracking-wider">Ara Toplam</span>
                <span className="font-mono text-[0.85rem]">₺{formatPrice(order.subtotalPriceV2)}</span>
              </div>
              <div className="flex justify-between border-t border-[#333333] pt-4 mt-4">
                <span className="font-mono text-[0.65rem] uppercase tracking-wider font-bold">Toplam</span>
                <span className="font-mono text-[1.2rem] font-bold">₺{formatPrice(order.currentTotalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hesap() {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'profil' | 'adresler' | 'siparisler'>('siparisler');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Telefon inputu stateleri
  const [countryCode, setCountryCode] = useState('+90');
  const [phoneNumber, setPhoneNumber] = useState('');

  const navigate = useNavigate();
  const { logout } = useAuth();

  const fetchCustomerData = async () => {
    const token = localStorage.getItem('customerToken');
    if (!token) return;
    try {
      const data = await getCustomerDetails(token);
      if (data) setCustomer(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const expiry = localStorage.getItem('customerTokenExpiry');

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

  // Düzenleme moduna geçildiğinde mevcut telefonu parçala ve state'e yaz
  useEffect(() => {
    if (isEditingProfile) {
      const currentPhone = customer?.phone || '';
      if (currentPhone.startsWith('+90')) {
        setCountryCode('+90');
        setPhoneNumber(currentPhone.slice(3));
      } else if (currentPhone.startsWith('+1')) {
        setCountryCode('+1');
        setPhoneNumber(currentPhone.slice(2));
      } else if (currentPhone.startsWith('+44')) {
        setCountryCode('+44');
        setPhoneNumber(currentPhone.slice(3));
      } else if (currentPhone.startsWith('+49')) {
        setCountryCode('+49');
        setPhoneNumber(currentPhone.slice(3));
      } else {
        setCountryCode('+90');
        setPhoneNumber(currentPhone.replace(/\D/g, '')); // Diğer tüm durumlarda sadece sayıları al
      }
    }
  }, [isEditingProfile, customer]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    
    // Telefonu parçalardan birleştir
    let phone: string | undefined = undefined;
    if (phoneNumber.trim() !== '') {
      phone = `${countryCode}${phoneNumber}`;
    }

    const token = localStorage.getItem('customerToken');

    if (token) {
      try {
        console.log("Gönderilen Güncel Veriler:", { firstName, lastName, phone });
        const response = await updateCustomerProfile(token, { firstName, lastName, phone });
        console.log("Shopify API Yanıtı:", response);
        
        if (response?.customerUserErrors && response.customerUserErrors.length > 0) {
          console.error("Shopify Kullanıcı Hataları (Update):", response.customerUserErrors);
          alert(`Shopify Hatası: ${response.customerUserErrors[0].message}`);
        } else {
          console.log("Profil başarıyla güncellendi.");
          
          const currentAddresses = customer?.addresses?.edges ? customer.addresses.edges.map((e:any) => e.node) : 
                                   (customer?.defaultAddress ? [customer.defaultAddress] : []);
          
          if (currentAddresses.length > 0) {
            const updatePromises = currentAddresses.map((addr: any) => 
              updateCustomerAddress(token, addr.id, { firstName, lastName })
            );
            await Promise.all(updatePromises);
          }

          await fetchCustomerData();
          setIsEditingProfile(false);
        }
      } catch (err) {
        console.error("Profil güncellenirken hata:", err);
        alert("Profil güncellenirken bir hata oluştu.");
      }
    }
    
    setIsSubmitting(false);
  };

  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const addressData = {
      firstName: customer?.firstName,
      lastName: customer?.lastName,
      address1: formData.get('address1') as string,
      address2: formData.get('address2') as string,
      city: formData.get('city') as string,
      zip: formData.get('zip') as string,
      country: 'Turkey',
    };
    const token = localStorage.getItem('customerToken');

    if (token) {
      try {
        let response;
        if (editingAddressId === 'new') {
          response = await createCustomerAddress(token, addressData);
          if (response?.customerUserErrors && response.customerUserErrors.length > 0) {
             alert(`Shopify Hatası: ${response.customerUserErrors[0].message}`);
             setIsSubmitting(false);
             return;
          }
        } else if (editingAddressId) {
          response = await updateCustomerAddress(token, editingAddressId, addressData);
          if (response?.customerUserErrors && response.customerUserErrors.length > 0) {
             alert(`Shopify Hatası: ${response.customerUserErrors[0].message}`);
             setIsSubmitting(false);
             return;
          }
        }
        await fetchCustomerData(); 
        setEditingAddressId(null);
      } catch (err) {
        alert("Adres kaydedilirken bir hata oluştu.");
      }
    }
    setIsSubmitting(false);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm("Bu adresi silmek istediğinize emin misiniz?")) return;
    
    const token = localStorage.getItem('customerToken');
    if (token) {
      try {
        await deleteCustomerAddress(token, id);
        await fetchCustomerData(); 
      } catch (err) {
        alert("Adres silinirken bir hata oluştu.");
      }
    }
  };

  if (loading) return null;

  const orders = customer?.orders?.edges ? customer.orders.edges.map((e: any) => e.node) : [];
  const addresses = customer?.addresses?.edges ? customer.addresses.edges.map((e:any) => e.node) : 
                    (customer?.defaultAddress ? [customer.defaultAddress] : []);

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-20 min-h-screen">
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
        <div>
          <div className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-[#888888] mb-4">Müşteri Paneli</div>
          <h1 className="font-serif text-[3rem] leading-none text-[#000000]">
            Hoş Geldin, <em className="italic">{customer?.firstName}</em>
          </h1>
        </div>
        <button onClick={handleLogout} className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] border border-[#E5E5E5] px-6 py-3 hover:text-black hover:border-black transition-all">
          Oturumu Kapat
        </button>
      </div>

      <div className="flex gap-8 border-b border-[#E5E5E5] mb-12 overflow-x-auto no-scrollbar">
        {['siparisler', 'profil', 'adresler'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab as any);
              setEditingAddressId(null);
              setIsEditingProfile(false);
            }}
            className={`font-mono text-[0.65rem] tracking-[0.2em] uppercase pb-4 whitespace-nowrap transition-colors ${
              activeTab === tab ? 'text-black border-b border-black' : 'text-[#888888] hover:text-black'
            }`}
          >
            {tab === 'siparisler' ? 'Siparişlerim' : tab === 'profil' ? 'Kişisel Bilgiler' : 'Adresler'}
          </button>
        ))}
      </div>

      <div className="max-w-4xl">
        
        {/* SİPARİŞLER */}
        {activeTab === 'siparisler' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-10 text-center">
                <p className="font-serif italic text-[#888888] text-[1.1rem] mb-6">Henüz bir siparişiniz bulunmuyor.</p>
                <button onClick={() => navigate('/kahveler')} className="font-mono text-[0.6rem] tracking-[0.2em] uppercase bg-black text-white px-8 py-4 hover:bg-[#333333] transition-colors">
                  Seçkiyi İncele
                </button>
              </div>
            ) : (
              orders.map((order: any) => (
                <button key={order.id} onClick={() => setSelectedOrder(order)} className="w-full text-left border border-[#E5E5E5] bg-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-black transition-colors cursor-pointer group">
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-[0.85rem] font-bold group-hover:underline underline-offset-2">Sipariş #{order.orderNumber}</span>
                      <span className="font-mono text-[0.55rem] text-[#888888] tracking-widest">{formatDate(order.processedAt)}</span>
                    </div>
                    <p className="font-sans text-[0.85rem] text-[#555555] line-clamp-1">
                      {order.lineItems?.edges ? order.lineItems.edges.map((edge: any) => edge.node.title).join(', ') : ""}
                    </p>
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 flex-shrink-0">
                    <span className={`px-2 py-1 font-mono text-[0.55rem] tracking-[0.1em] uppercase ${order.financialStatus === 'PAID' ? 'bg-[#F0FDF4] text-[#166534]' : 'bg-[#FAFAFA] text-[#888888]'}`}>
                      {translateFinancialStatus(order.financialStatus)}
                    </span>
                    <span className="font-mono text-[1.1rem] font-medium">₺{formatPrice(order.currentTotalPrice)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* KİŞİSEL BİLGİLER */}
        {activeTab === 'profil' && (
          <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-8 md:p-10">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#E5E5E5]">
              <h3 className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-black">Hesap Detayları</h3>
              {!isEditingProfile && (
                <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 text-[#888888] hover:text-black transition-colors">
                  <PencilIcon />
                  <span className="font-mono text-[0.55rem] tracking-[0.1em] uppercase">Düzenle</span>
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest">İsim</label>
                    <input type="text" name="firstName" defaultValue={customer?.firstName} className="w-full border-b border-[#E5E5E5] py-2 bg-transparent outline-none focus:border-black font-sans text-[0.95rem]" required />
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest">Soyisim</label>
                    <input type="text" name="lastName" defaultValue={customer?.lastName} className="w-full border-b border-[#E5E5E5] py-2 bg-transparent outline-none focus:border-black font-sans text-[0.95rem]" required />
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest">E-Posta (Değiştirilemez)</label>
                    <input type="email" disabled defaultValue={customer?.email} className="w-full border-b border-[#E5E5E5] py-2 bg-transparent outline-none text-[#888888] font-sans text-[0.95rem] cursor-not-allowed" />
                  </div>
                  
                  {/* YENİ TELEFON GİRİŞ ALANI */}
                  <div className="space-y-2">
                    <label className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest">Telefon</label>
                    <div className="flex gap-3">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="border-b border-[#E5E5E5] py-2 bg-transparent outline-none focus:border-black font-sans text-[0.95rem] w-[5.5rem] cursor-pointer text-[#555555]"
                      >
                        <option value="+90">TR +90</option>
                        <option value="+1">US +1</option>
                        <option value="+44">UK +44</option>
                        <option value="+49">DE +49</option>
                      </select>
                      <input 
                        type="tel" 
                        value={phoneNumber}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, ''); // Sadece sayı girmesine izin ver
                          if (val.startsWith('0')) val = val.substring(1); // İlk rakam 0 olamaz
                          if (val.length > 10) val = val.substring(0, 10); // Maksimum 10 hane
                          setPhoneNumber(val);
                        }}
                        placeholder="5XX XXX XX XX" 
                        className="flex-1 border-b border-[#E5E5E5] py-2 bg-transparent outline-none focus:border-black font-sans text-[0.95rem]" 
                      />
                    </div>
                  </div>

                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={isSubmitting} className="font-mono text-[0.6rem] tracking-[0.2em] uppercase bg-black text-white px-8 py-3 hover:bg-[#333333] transition-colors disabled:opacity-50">
                    {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  <button type="button" onClick={() => setIsEditingProfile(false)} disabled={isSubmitting} className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] border border-[#E5E5E5] px-8 py-3 hover:text-black hover:border-black transition-colors disabled:opacity-50">
                    İptal
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <span className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest block mb-1">Ad Soyad</span>
                  <span className="font-sans text-[1rem]">{customer?.firstName} {customer?.lastName}</span>
                </div>
                <div>
                  <span className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest block mb-1">E-Posta</span>
                  <span className="font-sans text-[1rem]">{customer?.email}</span>
                </div>
                <div>
                  <span className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest block mb-1">Telefon</span>
                  <span className="font-sans text-[1rem]">{customer?.phone || 'Belirtilmemiş'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADRESLER */}
        {activeTab === 'adresler' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-black">Kayıtlı Adresler</h3>
              <button onClick={() => setEditingAddressId('new')} className="flex items-center gap-2 font-mono text-[0.55rem] tracking-[0.1em] uppercase bg-black text-white px-4 py-2 hover:bg-[#333333] transition-colors">
                <PlusIcon /> Yeni Ekle
              </button>
            </div>

            {editingAddressId === 'new' && (
              <div className="bg-white border border-black p-8 relative">
                <h4 className="font-mono text-[0.6rem] tracking-[0.2em] uppercase mb-6">Yeni Adres Ekle</h4>
                <form onSubmit={handleSaveAddress} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <label className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest">Adres Satırı 1</label>
                    <input type="text" name="address1" required className="w-full border-b border-[#E5E5E5] py-2 bg-transparent outline-none focus:border-black font-sans text-[0.95rem]" />
                  </div>
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <label className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest">Adres Satırı 2 (Opsiyonel)</label>
                    <input type="text" name="address2" className="w-full border-b border-[#E5E5E5] py-2 bg-transparent outline-none focus:border-black font-sans text-[0.95rem]" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest">Şehir / İl</label>
                    <input type="text" name="city" required className="w-full border-b border-[#E5E5E5] py-2 bg-transparent outline-none focus:border-black font-sans text-[0.95rem]" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest">Posta Kodu</label>
                    <input type="text" name="zip" required className="w-full border-b border-[#E5E5E5] py-2 bg-transparent outline-none focus:border-black font-sans text-[0.95rem]" />
                  </div>
                  <div className="flex gap-4 pt-4 col-span-1 md:col-span-2">
                    <button type="submit" disabled={isSubmitting} className="font-mono text-[0.6rem] tracking-[0.2em] uppercase bg-black text-white px-8 py-3 hover:bg-[#333333] transition-colors disabled:opacity-50">
                      {isSubmitting ? 'Kaydediliyor...' : 'Adresi Kaydet'}
                    </button>
                    <button type="button" onClick={() => setEditingAddressId(null)} disabled={isSubmitting} className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] border border-[#E5E5E5] px-8 py-3 hover:text-black hover:border-black transition-colors disabled:opacity-50">
                      İptal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {addresses.length === 0 && editingAddressId !== 'new' ? (
              <p className="font-sans text-[0.85rem] text-[#888888] bg-[#FAFAFA] border border-[#E5E5E5] p-6 text-center">Kayıtlı adresiniz bulunmuyor.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map((addr: any, idx: number) => {
                  const addrId = addr.id;
                  
                  if (editingAddressId === addrId) {
                    return (
                      <div key={addrId} className="bg-white border border-black p-6 md:col-span-2">
                        <form onSubmit={handleSaveAddress} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2 col-span-1 md:col-span-2">
                            <label className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest">Adres Satırı 1</label>
                            <input type="text" name="address1" defaultValue={addr.address1} className="w-full border-b border-[#E5E5E5] py-2 bg-transparent outline-none focus:border-black" required />
                          </div>
                          <div className="space-y-2 col-span-1 md:col-span-2">
                            <label className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest">Adres Satırı 2 (Opsiyonel)</label>
                            <input type="text" name="address2" defaultValue={addr.address2} className="w-full border-b border-[#E5E5E5] py-2 bg-transparent outline-none focus:border-black" />
                          </div>
                          <div className="space-y-2">
                            <label className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest">Şehir / İl</label>
                            <input type="text" name="city" defaultValue={addr.city} className="w-full border-b border-[#E5E5E5] py-2 bg-transparent outline-none focus:border-black" required />
                          </div>
                          <div className="space-y-2">
                            <label className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest">Posta Kodu</label>
                            <input type="text" name="zip" defaultValue={addr.zip} className="w-full border-b border-[#E5E5E5] py-2 bg-transparent outline-none focus:border-black" required />
                          </div>
                          <div className="flex gap-4 pt-2 col-span-1 md:col-span-2">
                            <button type="submit" disabled={isSubmitting} className="font-mono text-[0.55rem] tracking-[0.2em] uppercase bg-black text-white px-6 py-2 disabled:opacity-50">
                              {isSubmitting ? 'Kaydediliyor...' : 'Güncelle'}
                            </button>
                            <button type="button" onClick={() => setEditingAddressId(null)} disabled={isSubmitting} className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#888888] border border-[#E5E5E5] px-6 py-2 disabled:opacity-50">
                              İptal
                            </button>
                          </div>
                        </form>
                      </div>
                    );
                  }

                  return (
                    <div key={addrId} className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 relative group hover:border-black transition-colors">
                      <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingAddressId(addrId)} className="text-[#888888] hover:text-black transition-colors" title="Düzenle">
                          <PencilIcon />
                        </button>
                        {addresses.length > 1 && (
                          <button onClick={() => handleDeleteAddress(addrId)} className="text-[#888888] hover:text-red-600 transition-colors" title="Sil">
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                      
                      <span className="font-mono text-[0.55rem] uppercase text-[#888888] tracking-widest block mb-3">Adres {idx + 1}</span>
                      <div className="font-sans text-[0.95rem] text-black leading-relaxed">
                        <span className="font-medium text-black">
                          {addr.firstName} {addr.lastName}
                        </span>
                        <br />
                        {addr.address1} <br />
                        {addr.address2 && <>{addr.address2}<br /></>}
                        {addr.city}, {addr.province || ''} {addr.zip} <br />
                        {addr.country}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}