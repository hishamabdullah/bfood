import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OrderPayment {
  id: string;
  order_id: string;
  supplier_id: string;
  restaurant_id: string;
  is_paid: boolean;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useSupplierPayments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["supplier-payments", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("order_payments")
        .select("*")
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as OrderPayment[];
    },
    enabled: !!user,
  });
};

export const useOrderPaymentByOrder = (orderId: string, supplierId: string) => {
  return useQuery({
    queryKey: ["order-payment", orderId, supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_payments")
        .select("*")
        .eq("order_id", orderId)
        .eq("supplier_id", supplierId)
        .maybeSingle();

      if (error) throw error;
      return data as OrderPayment | null;
    },
    enabled: !!orderId && !!supplierId,
  });
};
