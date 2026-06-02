import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useApiRegistry } from '@/api/ApiProvider';
import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView } from '@/components/common/DetailView';
import { runDetailDeleteAction } from '@/components/detail/detailDeleteAction';
import { DetailPageHeaderActions } from '@/components/detail/DetailPageHeaderActions';
import { EntityDetailWorkspaceTabs } from '@/components/detail/EntityDetailWorkspaceTabs';
import { useEntityAgentRegistration } from '@/components/detail/useEntityAgentRegistration';
import { useDemoData } from '@/app/demo-data';
import { useEnsureDemoOrgForRecord } from '@/lib/demo/useEnsureDemoOrg';
import { productsPageIcon } from '@/lib/modulePageIcons';
import { useOrgNavPaths, useOrgProfile } from '@/lib/org-profiles/useOrgProfile';
import { useUrlTabState } from '@/lib/routing/useUrlTabState';
import { appToast } from '@/lib/toast';

const PRODUCT_DETAIL_TABS = ['overview', 'activity', 'files', 'assistant'] as const;

import { buildProductDetailFields } from './productDetailFields';
import { productStatusBadge } from './shared';

export function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const api = useApiRegistry();
  const { findProductById } = useDemoData();
  const profile = useOrgProfile();
  const nav = useOrgNavPaths();
  const [activeTab, setActiveTab] = useUrlTabState('overview', PRODUCT_DETAIL_TABS);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const product = useMemo(() => findProductById(productId), [findProductById, productId]);
  useEnsureDemoOrgForRecord(product);
  const updateProductInline = useCallback(
    async (input: Parameters<typeof api.products.update>[1]) => {
      if (!product) return;

      try {
        await api.products.update(product.id, input);
        appToast.success('Product updated.');
      } catch (error) {
        appToast.fromApiError(error, 'Product could not be updated.');
        throw error;
      }
    },
    [api, product],
  );

  useEntityAgentRegistration(
    product
      ? {
          entityType: 'product',
          entityId: product.id,
          displayLabel: product.name,
        }
      : null,
    { moduleId: 'products', moduleLabel: profile.terminology.products },
  );

  if (!product) {
    return (
      <ModulePage title="Product not found" icon={productsPageIcon()} backTo={nav.products}>
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
        backTo={nav.products}
        actions={
          <DetailPageHeaderActions
            editTo={`${nav.products}/${product.id}/edit`}
            editLabel="Edit product"
            onDelete={() => setDeleteOpen(true)}
            deleteLabel="Delete product"
          />
        }
      >
        <EntityDetailWorkspaceTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          entityType="product"
          entityId={product.id}
          overview={
            <DetailView
              title="Product details"
              fields={buildProductDetailFields({
                product,
                onInlineUpdate: updateProductInline,
              })}
            />
          }
        />
      </ModulePage>

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this product?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          void runDetailDeleteAction({
            deleteRecord: () => api.products.delete(product.id),
            navigate,
            redirectTo: nav.products,
            successMessage: 'Product deleted.',
            errorMessage: 'Product could not be deleted.',
            toast: appToast,
          });
        }}
      />
    </>
  );
}
