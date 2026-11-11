import { shippingMessage, type ShippingStatus } from '../lib/shipping';

/** Kargo durumu metni: "Ücretsiz Kargo için X TL değerinde ürün ekleyin." veya ücretsiz kargo mesajı */
export default function ShippingNotice({
  status,
  strongClassName = 'text-[#1b1b1b] font-medium',
  short = false,
}: {
  status: ShippingStatus;
  strongClassName?: string;
  /** Sepet çekmecesi: "X TL'lik daha ürün ekle, kargon bizden! 🚚" */
  short?: boolean;
}) {
  const msg = shippingMessage(status);
  if (msg.free) return <span className={strongClassName}>🎉 {msg.text}</span>;
  if (short) {
    return (
      <>
        <strong className={strongClassName}>{msg.amount}'lik</strong> daha ürün ekle, kargon bizden! 🚚
      </>
    );
  }
  return (
    <>
      {msg.text} <strong className={strongClassName}>{msg.amount}</strong> değerinde ürün ekleyin.
    </>
  );
}
