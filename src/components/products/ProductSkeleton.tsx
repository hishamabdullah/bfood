import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductSkeletonProps {
  count?: number;
}

// Single skeleton card (for use inside grids)
const ProductSkeletonCard = memo(() => {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <Skeleton className="h-40 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
});

ProductSkeletonCard.displayName = "ProductSkeletonCard";

// Grid of skeleton cards (for standalone use)
const ProductSkeleton = memo(({ count = 8 }: ProductSkeletonProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeletonCard key={i} />
      ))}
    </div>
  );
});

ProductSkeleton.displayName = "ProductSkeleton";

export { ProductSkeletonCard };
export default ProductSkeleton;
