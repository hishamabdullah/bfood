import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RestaurantPayment {
  id: string;
  order_id: string | null;
  supplier_id: string;
  restaurant_id: string;
  is_paid: boolean;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useRestaurantPayments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["restaurant-payments", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("order_payments")
        .select("*")
        .eq("restaurant_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RestaurantPayment[];
    },
    enabled: !!user,
  });
};

// Check if payment was notified for a specific supplier and order
export const usePaymentStatus = (supplierId: string, orderId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payment-status", user?.id, supplierId, orderId],
    queryFn: async () => {
      if (!user || !supplierId) return null;

      // If orderId is provided, check for payment linked to this specific order
      let query = supabase
        .from("order_payments")
        .select("*")
        .eq("restaurant_id", user.id)
        .eq("supplier_id", supplierId);

      if (orderId) {
        query = query.eq("order_id", orderId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data as RestaurantPayment | null;
    },
    enabled: !!user && !!supplierId,
  });
};
