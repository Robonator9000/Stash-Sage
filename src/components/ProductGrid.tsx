import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { StatsCard } from './StatsCard';
import { EmptyState } from './EmptyState';

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
  onAddProduct: () => void;
}

export function ProductGrid({
  products,
  filteredProducts,
  isDark,
  layout,
  precision,
  onEditProduct,
  onConsumeProduct,
  onSellProduct,
  onToggleFavorite,
  onAddProduct,
}: ProductGridProps) {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      {products.length > 0 && (
        <div className="mb-6">
          <StatsCard products={products} isDark={isDark} />
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <EmptyState
          isDark={isDark}
          hasProducts={products.length > 0}
          onAddProduct={onAddProduct}
        />
      ) : (
        <div className={
          layout === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : layout === 'list'
              ? 'flex flex-col gap-3'
              : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
        }>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onEditProduct(product)}
                onConsume={() => onConsumeProduct(product)}
                onSell={() => onSellProduct(product)}
                onToggleFavorite={() => onToggleFavorite(product.id)}
                isDark={isDark}
                layout={layout}
                precision={precision}
              />
          ))}
        </div>
      )}
    </main>
  );
}
