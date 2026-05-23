import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDemoData } from '@/app/demo-data';
import { ModulePage } from '@/components/common/PageLayout';
import { EntityForm } from '@/components/forms/EntityForm';

import { productFormDefaults, productFormFields, productsPageIcon, type ProductFormValues } from './shared';

export function ProductCreatePage() {
  const navigate = useNavigate();
  const { createProduct } = useDemoData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <ModulePage title="New product" backTo="/products" icon={productsPageIcon()}>
      <EntityForm<ProductFormValues>
        title="Product details"
        fields={productFormFields}
        defaultValues={productFormDefaults}
        submitLabel="Create product"
        isSubmitting={isSubmitting}
        onSubmit={(values) => {
          setIsSubmitting(true);
          const next = createProduct({
            sku: values.sku,
            name: values.name,
            category: values.category,
            status: values.status as 'Active' | 'Draft' | 'Discontinued',
            price: values.price,
            stock: Number(values.stock) || 0,
            unit: values.unit,
          });
          setIsSubmitting(false);
          navigate(`/products/${next.id}`);
        }}
      />
    </ModulePage>
  );
}
