import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { MoneyText } from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView } from '@/components/common/DetailView';
import { IconDeleteButton } from '@/components/common/RecordIconButtons';
import { useDemoData } from '@/app/demo-data';
import { toast } from '@/lib/toast';

import { productStatusBadge, productsPageIcon } from './shared';

export function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products } = useDemoData();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const product = useMemo(
    () => products.find((entry) => entry.id === productId),
    [products, productId],
  );

  if (!product) {
    return (
      <ModulePage title="Product not found" icon={productsPageIcon()} backTo="/products">
        <p className="text-sm text-muted-foreground">This product may have been removed.</p>
      </ModulePage>
    );
  }

  return (
    <>
      <ModulePage
        title={product.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{product.sku}</span>
            {productStatusBadge(product.status)}
          </span>
        }
        icon={productsPageIcon()}
        backTo="/products"
        actions={<IconDeleteButton onClick={() => setDeleteOpen(true)} label="Delete product" />}
      >
        <DetailView
          title="Product details"
          fields={[
            { label: 'Name', value: product.name, importance: 'primary' },
            { label: 'SKU', value: product.sku, section: 'Product' },
            { label: 'Category', value: product.category, section: 'Product' },
            {
              label: 'Status',
              value: productStatusBadge(product.status),
              section: 'Product',
            },
            {
              label: 'Price',
              value: <MoneyText value={Number(product.price)} currency={product.currency} />,
              section: 'Pricing',
            },
            { label: 'Currency', value: product.currency, section: 'Pricing' },
            { label: 'Stock', value: String(product.stock), section: 'Inventory' },
            { label: 'Unit', value: product.unit, section: 'Inventory' },
          ]}
        />
      </ModulePage>

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this product?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          toast.success('Product deleted.');
          navigate('/products');
        }}
      />
    </>
  );
}
