import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateSubUser, useUpdateSubUser, SubUserPermissions } from "@/hooks/useSubUsers";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").optional(),
  full_name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().optional(),
  branch_ids: z.array(z.string()),
  can_see_prices: z.boolean(),
  can_see_order_totals: z.boolean(),
  can_edit_order: z.boolean(),
  can_cancel_order: z.boolean(),
  can_approve_order: z.boolean(),
  can_see_favorite_suppliers_only: z.boolean(),
  can_see_favorite_products_only: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface SubUserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subUser?: any;
  branches: { id: string; name: string }[];
}

const SubUserFormDialog = ({
  open,
  onOpenChange,
  subUser,
  branches,
}: SubUserFormDialogProps) => {
  const isEditing = !!subUser;
  const createSubUser = useCreateSubUser();
  const updateSubUser = useUpdateSubUser();
  const isSubmitting = createSubUser.isPending || updateSubUser.isPending;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      phone: "",
      branch_ids: [],
      can_see_prices: true,
      can_see_order_totals: true,
      can_edit_order: true,
      can_cancel_order: true,
      can_approve_order: false,
      can_see_favorite_suppliers_only: false,
      can_see_favorite_products_only: false,
    },
  });

  useEffect(() => {
    if (subUser) {
      form.reset({
        email: "",
        password: "",
        full_name: subUser.full_name || "",
        phone: subUser.phone || "",
        branch_ids: subUser.branch_ids || [],
        can_see_prices: subUser.permissions?.can_see_prices ?? true,
        can_see_order_totals: subUser.permissions?.can_see_order_totals ?? true,
        can_edit_order: subUser.permissions?.can_edit_order ?? true,
        can_cancel_order: subUser.permissions?.can_cancel_order ?? true,
        can_approve_order: subUser.permissions?.can_approve_order ?? false,
        can_see_favorite_suppliers_only:
          subUser.permissions?.can_see_favorite_suppliers_only ?? false,
        can_see_favorite_products_only:
          subUser.permissions?.can_see_favorite_products_only ?? false,
      });
    } else {
      form.reset({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        branch_ids: [],
        can_see_prices: true,
        can_see_order_totals: true,
        can_edit_order: true,
        can_cancel_order: true,
        can_approve_order: false,
        can_see_favorite_suppliers_only: false,
        can_see_favorite_products_only: false,
      });
    }
  }, [subUser, form]);

  const onSubmit = async (data: FormData) => {
    const permissions: SubUserPermissions = {
      can_see_prices: data.can_see_prices,
      can_see_order_totals: data.can_see_order_totals,
      can_edit_order: data.can_edit_order,
      can_cancel_order: data.can_cancel_order,
      can_approve_order: data.can_approve_order,
      can_see_favorite_suppliers_only: data.can_see_favorite_suppliers_only,
      can_see_favorite_products_only: data.can_see_favorite_products_only,
    };

    try {
      if (isEditing) {
        await updateSubUser.mutateAsync({
          sub_user_id: subUser.id,
          full_name: data.full_name,
          phone: data.phone,
          branch_ids: data.branch_ids,
          permissions,
        });
      } else {
        if (!data.password) {
          form.setError("password", { message: "كلمة المرور مطلوبة" });
          return;
        }
        await createSubUser.mutateAsync({
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          phone: data.phone,
          branch_ids: data.branch_ids,
          permissions,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "تعديل مستخدم فرعي" : "إضافة مستخدم فرعي"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "قم بتعديل بيانات وصلاحيات المستخدم الفرعي"
              : "أنشئ حساباً جديداً لموظف يمكنه إدارة الطلبات"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pl-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!isEditing && (
                <>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور *</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل *</FormLabel>
                    <FormControl>
                      <Input placeholder="اسم الموظف" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <Input placeholder="05xxxxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {branches.length > 0 && (
                <FormField
                  control={form.control}
                  name="branch_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الفروع المسموح بها</FormLabel>
                      <FormDescription>
                        اختر الفروع التي يمكن للمستخدم الطلب منها (اتركها فارغة
                        للسماح بجميع الفروع)
                      </FormDescription>
                      <div className="space-y-2 mt-2">
                        {branches.map((branch) => (
                          <div
                            key={branch.id}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={branch.id}
                              checked={field.value.includes(branch.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, branch.id]);
                                } else {
                                  field.onChange(
                                    field.value.filter((id) => id !== branch.id)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={branch.id}
                              className="text-sm cursor-pointer"
                            >
                              {branch.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-4">الصلاحيات</h4>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="can_see_prices"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>رؤية الأسعار</FormLabel>
                          <FormDescription>
                            عرض أسعار المنتجات والإجماليات
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="can_see_order_totals"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>رؤية إجماليات الطلبات</FormLabel>
                          <FormDescription>
                            عرض المجموع الكلي للطلبات
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="can_edit_order"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>إنشاء وتعديل الطلبات</FormLabel>
                          <FormDescription>
                            إضافة منتجات للسلة وتأكيد الطلبات
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="can_cancel_order"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>إلغاء الطلبات</FormLabel>
                          <FormDescription>
                            إلغاء الطلبات المعلقة
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="can_see_favorite_suppliers_only"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>تقييد الموردين</FormLabel>
                          <FormDescription>
                            رؤية الموردين المفضلين فقط
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="can_see_favorite_products_only"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>تقييد المنتجات</FormLabel>
                          <FormDescription>
                            رؤية المنتجات المفضلة فقط
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  )}
                  {isEditing ? "حفظ التغييرات" : "إنشاء المستخدم"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SubUserFormDialog;
