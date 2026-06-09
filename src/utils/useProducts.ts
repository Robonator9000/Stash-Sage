import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { parseProductDates, safeSetItem } from './helpers';

const PRODUCTS_KEY = 'weed-products';

export function useProducts() {
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
    safeSetItem(PRODUCTS_KEY, JSON.stringify(products));
  }, [products]);

  const addProduct = useCallback((product: Product) => {
    setProducts((prev) => [product, ...prev]);
  }, []);

  const updateProduct = useCallback((updated: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, favorite: !p.favorite } : p
      )
    );
  }, []);

  const consumeProduct = useCallback((id: string, amountConsumed: number, consumedAt?: Date) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              amount: Math.max(0, p.amount - amountConsumed),
              consumptionCount: (p.consumptionCount || 0) + 1,
              lastConsumed: consumedAt || new Date(),
            }
          : p
      )
    );
  }, []);

  const replaceAllProducts = useCallback((nextProducts: Product[]) => {
    setProducts(nextProducts.map(parseProductDates));
  }, []);

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleFavorite,
    consumeProduct,
    replaceAllProducts,
  };
}
