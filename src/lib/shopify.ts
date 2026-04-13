// src/lib/shopify.ts

export interface ProductVariant {
  id: string;
  weight: string;
  price: string;
  oldPrice?: string;
}

export interface CoffeeProduct {
  id: string;
  handle: string;
  name: string;
  description: string;
  price: string;
  oldPrice?: string;
  image?: string;
  badge?: string;
  origin?: string;
  process?: string;
  roast?: string;
  notes: string[];
  code?: string;
  category: string[];
  variants: ProductVariant[];
  brewingGuide?: string;
}

export function mapShopifyProduct(p: any): CoffeeProduct {
  const price = parseFloat(p.priceRange?.minVariantPrice?.amount || "0");
  const compareAt = parseFloat(p.compareAtPriceRange?.minVariantPrice?.amount ?? "0");

  const metaMap: Record<string, string> = {};
  p.metafields?.forEach((m: any) => { if (m) metaMap[m.key] = m.value; });

  const mappedVariants: ProductVariant[] = (p.variants?.nodes || []).map((v: any) => ({
    id: v.id,
    weight: v.title,
    price: `${parseFloat(v.price.amount).toFixed(2)} ₺`,
    oldPrice: v.compareAtPrice ? `${parseFloat(v.compareAtPrice.amount).toFixed(2)} ₺` : undefined,
  }));

  return {
    id: p.id,
    handle: p.handle,
    name: p.title,
    description: p.description || "Bu seçki için henüz bir açıklama girilmedi.",
    price: `${price.toFixed(2)} ₺`,
    oldPrice: compareAt > price ? `${compareAt.toFixed(2)} ₺` : undefined,
    image: p.featuredImage?.url,
    badge: metaMap["badge"] ?? undefined,
    origin: metaMap["origin"] ?? undefined,
    process: metaMap["process"] ?? undefined,
    roast: metaMap["roast"] ?? undefined,
    notes: metaMap["notes"] ? metaMap["notes"].split(",").map((n: string) => n.trim()) : [],
    code: metaMap["code"] ?? p.handle.toUpperCase().slice(0, 6),
    category: p.tags || [],
    variants: mappedVariants,
    brewingGuide: metaMap["brewingGuide"] ?? "Standart demleme profilleri için uygundur.",
  };
}

const domain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
const token  = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
const url = `https://${domain}/api/2024-01/graphql.json`;

const headers = {
  "Content-Type": "application/json",
  "X-Shopify-Storefront-Access-Token": token,
};

export async function fetchShopifyProducts(): Promise<CoffeeProduct[]> {
  if (!domain || !token) return [];

  const query = `
    query ShopProducts {
      products(first: 250) {
        nodes {
          id
          title
          handle
          description
          tags
          featuredImage { url altText }
          variants(first: 10) {
            nodes {
              id
              title
              price { amount }
              compareAtPrice { amount }
            }
          }
          metafields(identifiers: [
            { namespace: "custom", key: "badge" }
            { namespace: "custom", key: "origin" }
            { namespace: "custom", key: "process" }
            { namespace: "custom", key: "roast" }
            { namespace: "custom", key: "notes" }
            { namespace: "custom", key: "code" }
          ]) { key value }
        }
      }
    }
  `;

  try {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ query }) });
    const json = await res.json();
    const nodes = json.data?.products?.nodes || [];
    
    const flattenedProducts: CoffeeProduct[] = [];

    nodes.forEach((p: any) => {
      const metaMap: Record<string, string> = {};
      p.metafields?.forEach((m: any) => { if (m) metaMap[m.key] = m.value; });

      const variants = p.variants?.nodes || [];

      variants.forEach((v: any) => {
        const isDefault = v.title === "Default Title";
        const productName = isDefault ? p.title : `${p.title} ${v.title}`;
        
        flattenedProducts.push({
          id: v.id, 
          handle: p.handle,
          name: productName,
          description: p.description || "",
          price: `${parseFloat(v.price.amount).toFixed(2)} ₺`,
          oldPrice: v.compareAtPrice ? `${parseFloat(v.compareAtPrice.amount).toFixed(2)} ₺` : undefined,
          image: p.featuredImage?.url,
          badge: metaMap["badge"] ?? undefined,
          origin: metaMap["origin"] ?? undefined,
          process: metaMap["process"] ?? undefined,
          roast: metaMap["roast"] ?? undefined,
          notes: metaMap["notes"] ? metaMap["notes"].split(",").map((n: string) => n.trim()) : [],
          code: metaMap["code"] ?? p.handle.toUpperCase().slice(0, 6),
          category: p.tags || [],
          variants: [],
        });
      });
    });

    return flattenedProducts;
  } catch (err) {
    console.error("Shopify Fetch Hatası:", err);
    return [];
  }
}

export async function fetchShopifyProductByHandle(handle: string): Promise<CoffeeProduct | null> {
  if (!domain || !token) return null;

  const query = `
    query ProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        description
        tags
        priceRange { minVariantPrice { amount currencyCode } }
        compareAtPriceRange { minVariantPrice { amount currencyCode } }
        featuredImage { url altText }
        variants(first: 10) {
          nodes {
            id
            title
            price { amount }
            compareAtPrice { amount }
          }
        }
        metafields(identifiers: [
          { namespace: "custom", key: "badge" }
          { namespace: "custom", key: "origin" }
          { namespace: "custom", key: "process" }
          { namespace: "custom", key: "roast" }
          { namespace: "custom", key: "notes" }
          { namespace: "custom", key: "code" }
          { namespace: "custom", key: "brewingGuide" }
        ]) { key value }
      }
    }
  `;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables: { handle } }),
    });
    const json = await res.json();
    if (!json.data?.product) return null;
    return mapShopifyProduct(json.data.product);
  } catch (err) {
    console.error("Shopify Tekil Ürün Fetch Hatası:", err);
    return null;
  }
}

export async function customerLogin(email: string, password: string) {
  if (!domain || !token) throw new Error("Shopify ENV eksik");

  const query = `
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code message }
      }
    }
  `;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables: { input: { email, password } } }),
    });
    const json = await res.json();
    return json.data?.customerAccessTokenCreate;
  } catch (err) {
    console.error("Shopify Login Hatası:", err);
    throw err;
  }
}

export async function customerCreate(email: string, password: string, firstName?: string, lastName?: string, phone?: string) {
  if (!domain || !token) throw new Error("Shopify ENV eksik");

  const query = `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id email phone }
        customerUserErrors { code message }
      }
    }
  `;

  const input: any = { email, password };
  if (firstName) input.firstName = firstName;
  if (lastName) input.lastName = lastName;
  if (phone) input.phone = phone;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables: { input } }),
    });
    const json = await res.json();
    return json.data?.customerCreate;
  } catch (err) {
    console.error("Shopify Register Hatası:", err);
    throw err;
  }
}

export async function getCustomerDetails(accessToken: string) {
  if (!domain || !token) return null;

  const query = `
    query getCustomer($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id 
        firstName 
        lastName 
        email 
        phone
        defaultAddress {
          id
          firstName
          lastName
          address1
          address2
          city
          province
          country
          zip
        }
        addresses(first: 10) {
          edges {
            node {
              id
              firstName
              lastName
              address1
              address2
              city
              province
              country
              zip
            }
          }
        }
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              orderNumber
              processedAt
              financialStatus
              fulfillmentStatus
              currentTotalPrice { amount currencyCode }
              subtotalPriceV2 { amount currencyCode }
              totalShippingPriceV2 { amount currencyCode }
              totalTaxV2 { amount currencyCode }
              successfulFulfillments {
                trackingInfo {
                  number
                  url
                }
              }
              shippingAddress {
                firstName
                lastName
                address1
                address2
                city
                province
                country
                zip
                phone
              }
              billingAddress {
                firstName
                lastName
                address1
                address2
                city
                province
                country
                zip
              }
              lineItems(first: 20) {
                edges {
                  node {
                    title
                    quantity
                    variant {
                      id
                      title
                      priceV2 { amount currencyCode }
                      image { url }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables: { customerAccessToken: accessToken } }),
    });
    
    const json = await res.json();
    return json.data?.customer;
  } catch (err) {
    console.error("Shopify Müşteri Bilgisi Çekme Hatası:", err);
    return null;
  }
}

export async function updateCustomerProfile(accessToken: string, customerData: { firstName?: string; lastName?: string; phone?: string; }) {
  if (!domain || !token) throw new Error("Shopify ENV eksik");

  const query = `
    mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
      customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
        customer { id firstName lastName phone }
        customerUserErrors { code field message }
      }
    }
  `;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables: { customerAccessToken: accessToken, customer: customerData } }),
    });
    const json = await res.json();
    return json.data?.customerUpdate;
  } catch (err) {
    console.error("Shopify Profil Güncelleme Hatası:", err);
    throw err;
  }
}

export async function createCustomerAddress(accessToken: string, address: { firstName?: string; lastName?: string; address1: string; address2?: string; city: string; zip: string; country?: string; }) {
  if (!domain || !token) throw new Error("Shopify ENV eksik");

  const query = `
    mutation customerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
      customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
        customerAddress { id firstName lastName address1 address2 city zip country }
        customerUserErrors { code field message }
      }
    }
  `;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables: { customerAccessToken: accessToken, address } }),
    });
    const json = await res.json();
    return json.data?.customerAddressCreate;
  } catch (err) {
    console.error("Shopify Adres Ekleme Hatası:", err);
    throw err;
  }
}

export async function updateCustomerAddress(accessToken: string, id: string, address: { firstName?: string; lastName?: string; address1?: string; address2?: string; city?: string; zip?: string; country?: string; }) {
  if (!domain || !token) throw new Error("Shopify ENV eksik");

  const query = `
    mutation customerAddressUpdate($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
      customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
        customerAddress { id firstName lastName address1 address2 city zip country }
        customerUserErrors { code field message }
      }
    }
  `;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables: { customerAccessToken: accessToken, id, address } }),
    });
    const json = await res.json();
    return json.data?.customerAddressUpdate;
  } catch (err) {
    console.error("Shopify Adres Güncelleme Hatası:", err);
    throw err;
  }
}

export async function deleteCustomerAddress(accessToken: string, id: string) {
  if (!domain || !token) throw new Error("Shopify ENV eksik");

  const query = `
    mutation customerAddressDelete($customerAccessToken: String!, $id: ID!) {
      customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
        deletedCustomerAddressId
        customerUserErrors { code field message }
      }
    }
  `;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables: { customerAccessToken: accessToken, id } }),
    });
    const json = await res.json();
    return json.data?.customerAddressDelete;
  } catch (err) {
    console.error("Shopify Adres Silme Hatası:", err);
    throw err;
  }
}

export async function recoverCustomerPassword(email: string) {
  if (!domain || !token) throw new Error("Shopify ENV eksik");

  const query = `
    mutation customerRecover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors { code message }
      }
    }
  `;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables: { email } }),
    });
    const json = await res.json();
    return json.data?.customerRecover;
  } catch (err) {
    console.error("Shopify Şifre Sıfırlama Hatası:", err);
    throw err;
  }
}

export interface ShopifyCartResponse {
  checkoutUrl: string;
  subtotal: number;
  total: number;
  discount: number;
  shippingCost: number | null;
  shippingTitle: string | null;
  lines: Array<{
    id: string;
    variantId?: string;
    title: string;
    quantity: number;
    originalPrice: number;
    discountedPrice: number;
    image?: string;
    variantTitle?: string;
    discountTitles?: string[];
  }>;
}

export async function createShopifyCart(cartItems: any[], discountCode?: string | null): Promise<ShopifyCartResponse> {
  if (!domain || !token) throw new Error("Sistem yapılandırma hatası: Shopify API anahtarları eksik.");

  const lineItems = cartItems.map((item: any) => ({
    merchandiseId: item.variantId || item.id,
    quantity: item.quantity
  }));

  const createQuery = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
          cost {
            subtotalAmount { amount currencyCode }
            totalAmount { amount currencyCode }
          }
          discountAllocations {
            discountedAmount { amount }
          }
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                cost {
                  totalAmount { amount }
                }
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price { amount }
                    image { url }
                    product { title }
                  }
                }
                discountAllocations {
                  discountedAmount { amount }
                  ... on CartCodeDiscountAllocation {
                    code
                  }
                  ... on CartAutomaticDiscountAllocation {
                    title
                  }
                  ... on CartCustomDiscountAllocation {
                    title
                  }
                }
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `;

  const buyerIdentityQuery = `
    mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
      cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
        cart {
          deliveryGroups(first: 5) {
            nodes {
              deliveryOptions {
                title
                estimatedCost { amount currencyCode }
              }
              selectedDeliveryOption {
                title
                estimatedCost { amount currencyCode }
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `;

  try {
    const inputPayload: any = { lines: lineItems };
    if (discountCode) {
      inputPayload.discountCodes = [discountCode];
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: createQuery, variables: { input: inputPayload } }),
    });

    const json = await res.json();

    if (json.errors) throw new Error("Ödeme altyapısına bağlanırken bir sorun oluştu.");

    const cartData = json.data?.cartCreate;

    if (cartData?.userErrors?.length > 0) {
      throw new Error(`Ürünler işlenemedi: ${cartData.userErrors[0].message}`);
    }

    if (!cartData?.cart) {
      throw new Error("Geçerli bir ödeme bağlantısı alınamadı.");
    }

    let totalDiscount = 0;

    if (cartData.cart.discountAllocations) {
      cartData.cart.discountAllocations.forEach((alloc: any) => {
        totalDiscount += parseFloat(alloc.discountedAmount.amount);
      });
    }

    const parsedLines = cartData.cart.lines?.edges?.map((edge: any) => {
      const node = edge.node;
      
      const discountTitles: string[] = [];
      if (node.discountAllocations) {
        node.discountAllocations.forEach((alloc: any) => {
          totalDiscount += parseFloat(alloc.discountedAmount.amount);
          const label = alloc.code || alloc.title;
          if (label && !discountTitles.includes(label)) {
            discountTitles.push(label);
          }
        });
      }

      const quantity = node.quantity;
      const originalPrice = parseFloat(node.merchandise?.price?.amount || "0");
      const lineTotal = parseFloat(node.cost?.totalAmount?.amount || "0");
      const discountedPrice = lineTotal / quantity;

      let title = node.merchandise?.product?.title || "Bilinmeyen Ürün";
      const variantTitle = node.merchandise?.title;
      
      if (variantTitle && variantTitle !== "Default Title") {
         title += ` ${variantTitle}`; 
      }

      return {
        id: node.id,
        variantId: node.merchandise?.id,
        title: title,
        quantity: quantity,
        originalPrice: originalPrice,
        discountedPrice: discountedPrice,
        image: node.merchandise?.image?.url || null,
        variantTitle: variantTitle !== "Default Title" ? variantTitle : undefined,
        discountTitles: discountTitles.length > 0 ? discountTitles : undefined,
      };
    }) || [];

    const finalTotal = parseFloat(cartData.cart.cost.totalAmount.amount);
    const rawSubtotal = parseFloat(cartData.cart.cost.subtotalAmount.amount);

    if (totalDiscount === 0 && rawSubtotal > finalTotal) {
      totalDiscount = rawSubtotal - finalTotal;
    }

    const displaySubtotal = finalTotal + totalDiscount;

    let shippingCost: number | null = null;
    let shippingTitle: string | null = null;

    try {
      const shippingRes = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: buyerIdentityQuery,
          variables: {
            cartId: cartData.cart.id,
            buyerIdentity: {
              deliveryAddressPreferences: [{
                deliveryAddress: {
                  country: "TR",
                  city: "Istanbul",
                  zip: "34000",
                }
              }]
            }
          }
        }),
      });

      const shippingJson = await shippingRes.json();
      const deliveryGroups = shippingJson.data?.cartBuyerIdentityUpdate?.cart?.deliveryGroups?.nodes || [];

      for (const group of deliveryGroups) {
        const option = group.selectedDeliveryOption || group.deliveryOptions?.[0];
        if (option) {
          shippingCost = parseFloat(option.estimatedCost.amount);
          shippingTitle = option.title;
          break;
        }
      }
    } catch {
      // Kargo çekilemezse null
    }

    return {
      checkoutUrl: cartData.cart.checkoutUrl,
      subtotal: displaySubtotal,
      total: finalTotal,
      discount: totalDiscount,
      shippingCost,
      shippingTitle,
      lines: parsedLines,
    };

  } catch (err: any) {
    console.error("Shopify Sepet Oluşturma Hatası:", err);
    throw err;
  }
}
export async function resetCustomerPassword(id: string, input: { password: string; resetToken: string }) {
  if (!domain || !token) throw new Error("Shopify ENV eksik");

  const query = `
    mutation customerReset($id: ID!, $input: CustomerResetInput!) {
      customerReset(id: $id, input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code message }
      }
    }
  `;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables: { id, input } }),
    });
    const json = await res.json();
    return json.data?.customerReset;
  } catch (err) {
    console.error("Shopify Şifre Reset Hatası:", err);
    throw err;
  }
}