import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import {
  useSubscriptionPlan,
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
} from "@/hooks/useSubscriptionPlans";

const planSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  name_en: z.string().nullable(),
  description: z.string().nullable(),
  price: z.coerce.number().min(0, "السعر يجب أن يكون 0 أو أكثر"),
  duration_months: z.coerce.number().min(1, "المدة يجب أن تكون شهر واحد على الأقل"),
  can_order: z.boolean(),
  can_use_templates: z.boolean(),
  can_use_branches: z.boolean(),
  can_use_favorites: z.boolean(),
  can_view_analytics: z.boolean(),
  can_use_custom_prices: z.boolean(),
  can_repeat_orders: z.boolean(),
  can_manage_sub_users: z.boolean(),
  max_orders_per_month: z.coerce.number().nullable(),
  max_sub_users: z.coerce.number().nullable(),
  is_active: z.boolean(),
});

type PlanFormValues = z.infer<typeof planSchema>;

interface SubscriptionPlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string | null;
}

const SubscriptionPlanFormDialog = ({
  open,
  onOpenChange,
  planId,
}: SubscriptionPlanFormDialogProps) => {
  const { data: existingPlan, isLoading } = useSubscriptionPlan(planId);
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      name_en: null,
      description: null,
      price: 0,
      duration_months: 1,
      can_order: true,
      can_use_templates: false,
      can_use_branches: false,
      can_use_favorites: true,
      can_view_analytics: false,
      can_use_custom_prices: false,
      can_repeat_orders: true,
      can_manage_sub_users: false,
      max_orders_per_month: null,
      max_sub_users: 3,
      is_active: true,
    },
  });

  useEffect(() => {
    if (existingPlan) {
      form.reset({
        name: existingPlan.name,
        name_en: existingPlan.name_en,
        description: existingPlan.description,
        price: existingPlan.price,
        duration_months: existingPlan.duration_months,
        can_order: existingPlan.can_order,
        can_use_templates: existingPlan.can_use_templates,
        can_use_branches: existingPlan.can_use_branches,
        can_use_favorites: existingPlan.can_use_favorites,
        can_view_analytics: existingPlan.can_view_analytics,
        can_use_custom_prices: existingPlan.can_use_custom_prices,
        can_repeat_orders: existingPlan.can_repeat_orders,
        can_manage_sub_users: existingPlan.can_manage_sub_users,
        max_orders_per_month: existingPlan.max_orders_per_month,
        max_sub_users: existingPlan.max_sub_users,
        is_active: existingPlan.is_active,
      });
    } else if (!planId) {
      form.reset({
        name: "",
        name_en: null,
        description: null,
        price: 0,
        duration_months: 1,
        can_order: true,
        can_use_templates: false,
        can_use_branches: false,
        can_use_favorites: true,
        can_view_analytics: false,
        can_use_custom_prices: false,
        can_repeat_orders: true,
        can_manage_sub_users: false,
        max_orders_per_month: null,
        max_sub_users: 3,
        is_active: true,
      });
    }
  }, [existingPlan, planId, form]);

  const onSubmit = async (values: PlanFormValues) => {
    try {
      if (planId) {
        await updatePlan.mutateAsync({ id: planId, ...values });
      } else {
        await createPlan.mutateAsync({
          name: values.name,
          name_en: values.name_en,
          description: values.description,
          price: values.price,
          duration_months: values.duration_months,
          can_order: values.can_order,
          can_use_templates: values.can_use_templates,
          can_use_branches: values.can_use_branches,
          can_use_favorites: values.can_use_favorites,
          can_view_analytics: values.can_view_analytics,
          can_use_custom_prices: values.can_use_custom_prices,
          can_repeat_orders: values.can_repeat_orders,
          can_manage_sub_users: values.can_manage_sub_users,
          max_orders_per_month: values.max_orders_per_month,
          max_sub_users: values.max_sub_users,
          is_active: values.is_active,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isSubmitting = createPlan.isPending || updatePlan.isPending;

  const featureFields = [
    { name: "can_order", label: "الطلب" },
    { name: "can_use_templates", label: "قوالب الطلب" },
    { name: "can_use_branches", label: "إدارة الفروع" },
    { name: "can_use_favorites", label: "المفضلة" },
    { name: "can_view_analytics", label: "التحليلات" },
    { name: "can_use_custom_prices", label: "أسعار مخصصة" },
    { name: "can_repeat_orders", label: "إعادة الطلب" },
    { name: "can_manage_sub_users", label: "المستخدمين الفرعيين" },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {planId ? "تعديل خطة الاشتراك" : "إضافة خطة اشتراك جديدة"}
          </DialogTitle>
        </DialogHeader>

        {isLoading && planId ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الخطة (عربي) *</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: الباقة الأساسية" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الخطة (إنجليزي)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Basic Plan"
                          {...field}
                          value={field.value || ""}
                          dir="ltr"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="وصف مختصر للخطة..."
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* السعر والمدة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر (ر.س) *</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدة (بالأشهر) *</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* الحدود */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="max_orders_per_month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحد الأقصى للطلبات شهرياً</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="اتركه فارغاً لغير محدود"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_sub_users"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحد الأقصى للمستخدمين الفرعيين</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* الميزات */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">الميزات</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {featureFields.map((feature) => (
                    <FormField
                      key={feature.name}
                      control={form.control}
                      name={feature.name}
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3 space-y-0">
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            {feature.label}
                          </FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* الحالة */}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4 space-y-0">
                    <div>
                      <FormLabel className="text-base">تفعيل الخطة</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        الخطط المفعلة فقط تظهر للمطاعم
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* أزرار */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                  {planId ? "حفظ التغييرات" : "إنشاء الخطة"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPlanFormDialog;
