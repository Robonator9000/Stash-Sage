import { memo } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { EmptyState } from './EmptyState';
import { SimpleGrid, Stack } from '@mantine/core';

interface ProductGridProps {
  products: Product[];
  filteredProducts: Product[];
  isDark: boolean;
  layout: 'grid' | 'list' | 'compact';
  precision: number;
  onEditProduct: (product: Product) => void;
  onConsumeProduct: (product: Product) => void;
  onSellProduct: (product: Product) => void;
  onToggleFavorite: (id: string) => void;
  onQuickConsumeProduct?: (product: Product) => void;
  onAddProduct: () => void;
  isSelectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export const ProductGrid = memo(function ProductGrid({
  products,
  filteredProducts,
  isDark,
  layout,
  precision,
  onEditProduct,
  onConsumeProduct,
  onSellProduct,
  onToggleFavorite,
  onQuickConsumeProduct,
  onAddProduct,
  isSelectMode = false,
  selectedIds,
  onToggleSelect,
}: ProductGridProps) {
  return (
    <Stack pt="md">
      {filteredProducts.length === 0 ? (
        <EmptyState
          isDark={isDark}
          hasProducts={products.length > 0}
          onAddProduct={onAddProduct}
        />
      ) : layout === 'list' ? (
        <Stack gap="sm">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={onEditProduct}
              onConsume={onConsumeProduct}
              onSell={onSellProduct}
              onToggleFavorite={onToggleFavorite}
              onQuickConsume={onQuickConsumeProduct}
              isDark={isDark}
              layout={layout}
              precision={precision}
              isSelectMode={isSelectMode}
              selected={selectedIds?.has(product.id) || false}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </Stack>
      ) : (
        <SimpleGrid
          cols={layout === 'grid' ? { base: 1, sm: 2, lg: 3, xl: 4 } : { base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
          spacing="md"
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={onEditProduct}
              onConsume={onConsumeProduct}
              onSell={onSellProduct}
              onToggleFavorite={onToggleFavorite}
              onQuickConsume={onQuickConsumeProduct}
              isDark={isDark}
              layout={layout}
              precision={precision}
              isSelectMode={isSelectMode}
              selected={selectedIds?.has(product.id) || false}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
});