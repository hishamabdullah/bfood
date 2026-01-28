import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PriceTier {
  id: string;
  product_id: string;
  min_quantity: number;
  price_per_unit: number;
  created_at: string;
}

export interface PriceTierInput {
  min_quantity: number;
  price_per_unit: number;
}

// Hook to get price tiers for a specific product
export const useProductPriceTiers = (productId: string | undefined) => {
  return useQuery({
    queryKey: ["product-price-tiers", productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from("product_price_tiers")
        .select("*")
        .eq("product_id", productId)
        .order("min_quantity", { ascending: true });

      if (error) throw error;
      return data as PriceTier[];
    },
    enabled: !!productId,
  });
};

// Hook to save price tiers for a product (replaces all existing tiers)
export const useSavePriceTiers = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      productId,
      tiers,
    }: {
      productId: string;
      tiers: PriceTierInput[];
    }) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      // First, delete all existing tiers for this product
      const { error: deleteError } = await supabase
        .from("product_price_tiers")
        .delete()
        .eq("product_id", productId);

      if (deleteError) throw deleteError;

      // If no tiers to add, we're done
      if (tiers.length === 0) return [];

      // Insert new tiers
      const tiersToInsert = tiers.map((tier) => ({
        product_id: productId,
        min_quantity: tier.min_quantity,
        price_per_unit: tier.price_per_unit,
      }));

      const { data, error: insertError } = await supabase
        .from("product_price_tiers")
        .insert(tiersToInsert)
        .select();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["product-price-tiers", variables.productId],
      });
      queryClient.invalidateQueries({ queryKey: ["product-price-tiers"] });
    },
    onError: (error) => {
      console.error("Error saving price tiers:", error);
      toast.error("حدث خطأ أثناء حفظ شرائح الأسعار");
    },
  });
};

// Helper function to calculate price based on quantity and tiers
export const calculateTieredPrice = (
  quantity: number,
  basePrice: number,
  tiers: PriceTier[]
): number => {
  if (!tiers || tiers.length === 0) {
    return basePrice;
  }

  // Sort tiers by min_quantity descending to find the applicable tier
  const sortedTiers = [...tiers].sort(
    (a, b) => b.min_quantity - a.min_quantity
  );

  // Find the tier that applies to this quantity
  for (const tier of sortedTiers) {
    if (quantity >= tier.min_quantity) {
      return tier.price_per_unit;
    }
  }

  // No tier applies, use base price
  return basePrice;
};

// Helper to get the applicable tier for display
export const getApplicableTier = (
  quantity: number,
  tiers: PriceTier[]
): PriceTier | null => {
  if (!tiers || tiers.length === 0) return null;

  const sortedTiers = [...tiers].sort(
    (a, b) => b.min_quantity - a.min_quantity
  );

  for (const tier of sortedTiers) {
    if (quantity >= tier.min_quantity) {
      return tier;
    }
  }

  return null;
};
