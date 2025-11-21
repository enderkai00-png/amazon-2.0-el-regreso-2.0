const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export interface Favorite {
  id?: number;
  client_id: string;
  product_id: string;
  created_at?: string;
}

/**
 * Obtener favoritos de un cliente
 */
export async function getFavorites(clientId: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/api/favorites/${clientId}`);
    if (!res.ok) {
      console.warn('Failed to fetch favorites from API');
      return getLocalFavorites(clientId);
    }
    const data = await res.json();
    return data.map((fav: Favorite) => fav.product_id);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    return getLocalFavorites(clientId);
  }
}

/**
 * Agregar producto a favoritos
 */
export async function addFavorite(clientId: string, productId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, product_id: productId })
    });
    
    if (res.ok) {
      saveLocalFavorite(clientId, productId);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error adding favorite:', err);
    saveLocalFavorite(clientId, productId);
    return true;
  }
}

/**
 * Eliminar producto de favoritos
 */
export async function removeFavorite(clientId: string, productId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/favorites/${clientId}/${productId}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      removeLocalFavorite(clientId, productId);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error removing favorite:', err);
    removeLocalFavorite(clientId, productId);
    return true;
  }
}

/**
 * Toggle favorito (agregar o quitar)
 */
export async function toggleFavorite(clientId: string, productId: string, isFavorite: boolean): Promise<boolean> {
  if (isFavorite) {
    return await removeFavorite(clientId, productId);
  } else {
    return await addFavorite(clientId, productId);
  }
}

// ========== Funciones de almacenamiento local (fallback) ==========

function getLocalFavorites(clientId: string): string[] {
  try {
    const key = `favorites_${clientId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalFavorite(clientId: string, productId: string): void {
  try {
    const favorites = getLocalFavorites(clientId);
    if (!favorites.includes(productId)) {
      favorites.push(productId);
      localStorage.setItem(`favorites_${clientId}`, JSON.stringify(favorites));
    }
  } catch (err) {
    console.error('Error saving local favorite:', err);
  }
}

function removeLocalFavorite(clientId: string, productId: string): void {
  try {
    const favorites = getLocalFavorites(clientId);
    const filtered = favorites.filter(id => id !== productId);
    localStorage.setItem(`favorites_${clientId}`, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error removing local favorite:', err);
  }
}
