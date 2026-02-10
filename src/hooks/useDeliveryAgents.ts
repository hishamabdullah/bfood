import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DeliveryAgent {
  id: string;
  name: string;
  phone: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_iban: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useDeliveryAgents = (onlyActive = false) => {
  return useQuery({
    queryKey: ["delivery-agents", onlyActive],
    queryFn: async () => {
      let query = supabase
        .from("delivery_agents")
        .select("*")
        .order("name");

      if (onlyActive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DeliveryAgent[];
    },
  });
};

export const useCreateDeliveryAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agent: Omit<DeliveryAgent, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("delivery_agents")
        .insert(agent)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-agents"] });
      toast.success("تم إضافة المندوب بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة المندوب"),
  });
};

export const useUpdateDeliveryAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeliveryAgent> & { id: string }) => {
      const { data, error } = await supabase
        .from("delivery_agents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-agents"] });
      toast.success("تم تحديث المندوب بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء التحديث"),
  });
};

export const useDeleteDeliveryAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("delivery_agents")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-agents"] });
      toast.success("تم حذف المندوب بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف"),
  });
};

// Assign delivery agent to order items (supplier action)
export const useAssignDeliveryAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      supplierId,
      deliveryType,
      deliveryAgentId,
    }: {
      orderId: string;
      supplierId: string;
      deliveryType: "self" | "agent";
      deliveryAgentId?: string | null;
    }) => {
      const { error } = await supabase
        .from("order_items")
        .update({
          delivery_type: deliveryType,
          delivery_agent_id: deliveryType === "agent" ? deliveryAgentId : null,
        })
        .eq("order_id", orderId)
        .eq("supplier_id", supplierId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
      toast.success("تم تعيين طريقة التوصيل بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء تعيين المندوب"),
  });
};
