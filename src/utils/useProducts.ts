import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { parseProductDates, safeSetItem, roundToHundredth } from './helpers';
import { supabase } from './supabase';
import { useAuth } from '../contexts/AuthContext';

const PRODUCTS_KEY = 'weed-products';

interface DbProduct {
  id: string; name: string; type: string; strain: string;
  brand: string | null; amount: number; thc: number; cbd: number;
  price: number; rating: number; picture: string | null; pictures: any;
  favorite: boolean; lastconsumed: string | null; createdat: string;
  updatedat: string; "consumptionCount": number; notes: string | null;
  tags: string | null; effects: string | null; "purchasedAt": string | null;
}

function toCamel(db: DbProduct): Product {
  return {
    id: db.id, name: db.name, strain: db.strain || '', type: db.type,
    thc: Number(db.thc), cbd: Number(db.cbd), amount: Number(db.amount),
    price: Number(db.price), rating: Number(db.rating),
    picture: db.picture || undefined,
    pictures: Array.isArray(db.pictures) ? db.pictures : [],
    notes: db.notes || undefined, brand: db.brand || undefined,
    tags: db.tags || undefined, effects: db.effects || undefined,
    consumptionCount: db.consumptionCount,
    lastConsumed: db.lastconsumed ? new Date(db.lastconsumed) : undefined,
    purchasedAt: db.purchasedAt ? new Date(db.purchasedAt) : undefined,
    createdAt: new Date(db.createdat), updatedAt: new Date(db.updatedat),
    favorite: db.favorite,
  };
}

function toSnake(p: Product) {
  return {
    name: p.name, type: p.type, strain: p.strain,
    brand: p.brand || null, amount: p.amount, thc: p.thc, cbd: p.cbd,
    price: p.price, rating: p.rating, picture: p.picture || null,
    pictures: p.pictures || [], favorite: p.favorite,
    lastconsumed: p.lastConsumed?.toISOString() || null,
    createdat: p.createdAt.toISOString(), updatedat: p.updatedAt.toISOString(),
    consumptionCount: p.consumptionCount || 0, notes: p.notes || null,
    tags: p.tags || null, effects: p.effects || null,
    purchasedAt: p.purchasedAt?.toISOString() || null,
  };
}

const $ids = new Set<string>();

export function useProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.map(parseProductDates);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const id = user.id;
    $ids.forEach(x => { if (x !== id) $ids.delete(x); });
    $ids.add(id);
    supabase.from('products').select('*').eq('user_id', id).order('createdat', { ascending: false })
      .then(({ data }) => {
        if (cancelled || !data || !$ids.has(id)) return;
        const mapped = data.map(toCamel);
        setProducts(mapped);
        safeSetItem(PRODUCTS_KEY, JSON.stringify(mapped));
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    safeSetItem(PRODUCTS_KEY, JSON.stringify(products));
  }, [products]);

  const addProduct = useCallback((product: Product) => {
    setProducts((prev) => [product, ...prev]);
    if (user) {
      supabase.from('products').insert({ id: product.id, user_id: user.id, ...toSnake(product) }).then(() => {}, () => {});
    }
  }, [user]);

  const updateProduct = useCallback((updated: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    if (user) {
      supabase.from('products').update(toSnake(updated)).eq('id', updated.id).then(() => {}, () => {});
    }
  }, [user]);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (user) {
      supabase.from('products').delete().eq('id', id).then(() => {}, () => {});
    }
  }, [user]);

  const toggleFavorite = useCallback((id: string) => {
    setProducts((prev) => {
      const p = prev.find(x => x.id === id);
      const next = prev.map((x) =>
        x.id === id ? { ...x, favorite: !x.favorite } : x
      );
      if (user && p) {
        supabase.from('products').update({ favorite: !p.favorite }).eq('id', id).then(() => {}, () => {});
      }
      return next;
    });
  }, [user]);

  const consumeProduct = useCallback((id: string, amountConsumed: number, consumedAt?: Date) => {
    let pRef: Product | undefined;
    setProducts((prev) => {
      pRef = prev.find(x => x.id === id);
      if (!pRef) return prev;
      return prev.map((p) =>
        p.id === id
          ? {
              ...p,
              amount: roundToHundredth(Math.max(0, p.amount - amountConsumed)),
              consumptionCount: (p.consumptionCount || 0) + 1,
              lastConsumed: consumedAt || new Date(),
            }
          : p
      );
    });
    if (user && pRef) {
      supabase.from('products').update({
        amount: roundToHundredth(Math.max(0, pRef.amount - amountConsumed)),
        consumptionCount: (pRef.consumptionCount || 0) + 1,
        lastconsumed: (consumedAt || new Date()).toISOString(),
      }).eq('id', id).then(() => {}, () => {});
    }
  }, [user]);

  const replaceAllProducts = useCallback((nextProducts: Product[]) => {
    setProducts(nextProducts.map(parseProductDates));
    if (user) {
      supabase.from('products').delete().eq('user_id', user.id).then(() => {
        const rows = nextProducts.map(p => ({ id: p.id, user_id: user.id, ...toSnake(p) }));
        supabase.from('products').insert(rows).then(() => {}, () => {});
      }, () => {});
    }
  }, [user]);

  return {
    products, addProduct, updateProduct, deleteProduct,
    toggleFavorite, consumeProduct, replaceAllProducts,
  };
}
