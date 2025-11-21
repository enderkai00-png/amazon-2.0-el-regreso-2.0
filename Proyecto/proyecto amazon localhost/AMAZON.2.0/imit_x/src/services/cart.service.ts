const API_ROOT = 'http://localhost:4000';

function getClientId() {
  let id = localStorage.getItem('client_id');
  if (!id) {
    id = String(Date.now());
    localStorage.setItem('client_id', id);
  }
  return id;
}

export async function addToCart(productId: any, quantity = 1, productInfo?: { title?: string; price?: number; image?: string }) {
  const client_id = getClientId();
  const payload: any = { client_id, product_id: productId, quantity };
  
  // Include product info if provided for better cart display
  if (productInfo) {
    if (productInfo.title) payload.title = productInfo.title;
    if (productInfo.price) payload.price = productInfo.price;
    if (productInfo.image) payload.image = productInfo.image;
  }
  
  console.log('addToCart - payload:', payload);
  
  const res = await fetch(`${API_ROOT}/api/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    let body = 'Failed to add to cart';
    try {
      const j = await res.json();
      body = j.error || j.message || JSON.stringify(j);
    } catch (e) {}
    throw new Error(body);
  }
  const result = await res.json();
  console.log('addToCart - respuesta:', result);
  return result;
}

export async function getCart() {
  const client_id = getClientId();
  console.log('getCart - client_id:', client_id);
  const res = await fetch(`${API_ROOT}/api/cart/${client_id}`);
  if (!res.ok) throw new Error('Failed to fetch cart');
  const data = await res.json();
  console.log('getCart - respuesta:', data);
  return data;
}

export async function removeCartItem(id: number | string) {
  console.log('removeCartItem - id:', id);
  const res = await fetch(`${API_ROOT}/api/cart/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('removeCartItem - error:', errorText);
    throw new Error('Failed to delete cart item');
  }
  const result = await res.json();
  console.log('removeCartItem - respuesta:', result);
  return result;
}
