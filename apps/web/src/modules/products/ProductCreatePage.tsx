import { useNavigate } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';
import { EntityForm } from '@/components/forms/EntityForm';
import { useDemoData } from '@/app/demo-data';
import { toast } from '@/lib/toast';

import {
  productFormDefaults,
  productFormFields,
  productsPageIcon,
  type ProductFormValues,
} from './shared';

export function ProductCreatePage() {
  const navigate = useNavigate();
  const { createProduct } = useDemoData();

  const handleSubmit = async (values: ProductFormValues) => {
    const created = createProduct({
      sku: values.sku,
      name: values.name,
      category: values.category,
      status: values.status,
      currency: values.currency || 'EUR',
      price: values.price,
      stock: Number(values.stock) || 0,
      unit: values.unit,
    });
    toast.success('Product created.');
    navigate(`/products/${created.id}`);
  };

  return (
    <ModulePage title="New product" icon={productsPageIcon()} backTo="/products">
      <EntityForm
        title="Product details"
        fields={productFormFields}
        defaultValues={productFormDefaults}
        submitLabel="Create product"
        onSubmit={handleSubmit}
      />
    </ModulePage>
  );
}
