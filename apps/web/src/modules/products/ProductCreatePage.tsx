import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useApiRegistry } from '@/api/ApiProvider';
import { ModulePage } from '@/components/common/PageLayout';
import { EntityForm } from '@/components/forms/EntityForm';
import { submitApiForm } from '@/lib/apiFormSubmit';
import { useOrgNavPaths } from '@/lib/org-profiles/useOrgProfile';
import { appToast } from '@/lib/toast';

import {
  productFormDefaults,
  productFormFields,
  productsPageIcon,
  type ProductFormValues,
} from './shared';

export function ProductCreatePage() {
  const navigate = useNavigate();
  const api = useApiRegistry();
  const nav = useOrgNavPaths();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      return await submitApiForm({
        action: () =>
          api.products.create({
            sku: values.sku,
            name: values.name,
            category: values.category,
            status: values.status,
            currency: values.currency || 'EUR',
            price: values.price,
            stock: Number(values.stock) || 0,
            unit: values.unit,
          }),
        onSuccess: (created) => {
          appToast.success('Product created.');
          navigate(`${nav.products}/${created.id}`);
        },
        onError: (error) => appToast.fromApiError(error, 'Product could not be created.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModulePage title="New product" icon={productsPageIcon()} backTo={nav.products}>
      <EntityForm
        title="Product details"
        fields={productFormFields}
        defaultValues={productFormDefaults}
        submitLabel="Create product"
        isSubmitting={isSubmitting}
        warnOnDirty
        onSubmit={handleSubmit}
      />
    </ModulePage>
  );
}
