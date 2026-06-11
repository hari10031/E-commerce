import dynamic from 'next/dynamic';

const ProductWizard = dynamic(
  () => import('@/components/products/ProductWizard').then((m) => m.ProductWizard),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    ),
  }
);

export default function NewProductPage() {
  return (
    <div>
      <ProductWizard />
    </div>
  );
}
