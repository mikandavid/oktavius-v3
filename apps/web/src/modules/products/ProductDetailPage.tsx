import { Navigate, useParams } from 'react-router-dom';

import { Badge } from '@oktavius/base-ui';

import { useDemoData } from '@/app/demo-data';
import { DetailView } from '@/components/common/DetailView';
import { ModulePage } from '@/components/common/PageLayout';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { PRODUCT_STATUS_MAP, productsPageIcon } from './shared';

export function ProductDetailPage() {
  const { productId } = useParams();
  const { products } = useDemoData();
  const product = products.find((p) => p.id === productId);
  if (!product) return <Navigate to="/products" replace />;

  const price = `€ ${Number(product.price).toLocaleString('de-AT', { minimumFractionDigits: 2 })}`;

  return (
    <ModulePage
      title={product.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <span>
            {product.sku} · {product.category}
          </span>
          <StatusBadge status={product.status} variantMap={PRODUCT_STATUS_MAP} />
        </span>
      }
      icon={productsPageIcon()}
      backTo="/products"
    >
      <DetailView
        title="Product record"
        fields={[
          {
            key: 'sku',
            label: 'SKU',
            value: <span className="font-mono text-sm">{product.sku}</span>,
            section: 'Catalog',
          },
          {
            key: 'category',
            label: 'Category',
            value: <Badge variant="outline">{product.category}</Badge>,
            section: 'Catalog',
          },
          { key: 'unit', label: 'Unit', value: product.unit, section: 'Catalog' },
          { key: 'price', label: 'List price', value: price, section: 'Inventory' },
          {
            key: 'stock',
            label: 'Stock on hand',
            value: String(product.stock),
            section: 'Inventory',
          },
        ]}
      />
    </ModulePage>
  );
}
