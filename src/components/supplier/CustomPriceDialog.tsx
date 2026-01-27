import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useRestaurantsForSupplier,
  useCreateCustomPrice,
  useUpdateCustomPrice,
  CustomPrice,
} from "@/hooks/useCustomPrices";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";

const customPriceSchema = z.object({
  product_id: z.string().min(1, "يجب اختيار المنتج"),
  restaurant_id: z.string().min(1, "يجب اختيار المطعم"),
  custom_price: z.coerce.number().min(0.01, "السعر يجب أن يكون أكبر من صفر"),
});

type CustomPriceFormValues = z.infer<typeof customPriceSchema>;

interface CustomPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPrice?: CustomPrice | null;
  preselectedProductId?: string | null;
}

export default function CustomPriceDialog({
  open,
  onOpenChange,
  editingPrice,
  preselectedProductId,
}: CustomPriceDialogProps) {
  const { t } = useTranslation();
  const { data: restaurants, isLoading: loadingRestaurants } = useRestaurantsForSupplier();
  const { data: products, isLoading: loadingProducts } = useSupplierProducts();
  const createCustomPrice = useCreateCustomPrice();
  const updateCustomPrice = useUpdateCustomPrice();

  const isEditing = !!editingPrice;

  const form = useForm<CustomPriceFormValues>({
    resolver: zodResolver(customPriceSchema),
    defaultValues: {
      product_id: "",
      restaurant_id: "",
      custom_price: 0,
    },
  });

  const selectedProductId = form.watch("product_id");
  const selectedProduct = products?.find(p => p.id === selectedProductId);

  useEffect(() => {
    if (editingPrice) {
      form.reset({
        product_id: editingPrice.product_id,
        restaurant_id: editingPrice.restaurant_id,
        custom_price: editingPrice.custom_price,
      });
    } else {
      form.reset({
        product_id: preselectedProductId || "",
        restaurant_id: "",
        custom_price: 0,
      });
    }
  }, [editingPrice, preselectedProductId, form, open]);

  const onSubmit = async (values: CustomPriceFormValues) => {
    try {
      if (isEditing && editingPrice) {
        await updateCustomPrice.mutateAsync({
          id: editingPrice.id,
          custom_price: values.custom_price,
        });
      } else {
        await createCustomPrice.mutateAsync({
          product_id: values.product_id,
          restaurant_id: values.restaurant_id,
          custom_price: values.custom_price,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const isLoading = createCustomPrice.isPending || updateCustomPrice.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "تعديل السعر المخصص" : "إضافة سعر مخصص لمطعم"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المنتج *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEditing || !!preselectedProductId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المنتج" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingProducts ? (
                        <div className="p-2 text-center text-muted-foreground">
                          جاري التحميل...
                        </div>
                      ) : (
                        products?.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.price} {t("common.sar")}/{product.unit}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedProduct && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <span className="text-muted-foreground">السعر الأصلي: </span>
                <span className="font-medium">
                  {selectedProduct.price} {t("common.sar")}/{selectedProduct.unit}
                </span>
              </div>
            )}

            <FormField
              control={form.control}
              name="restaurant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المطعم *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المطعم" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingRestaurants ? (
                        <div className="p-2 text-center text-muted-foreground">
                          جاري التحميل...
                        </div>
                      ) : restaurants?.length === 0 ? (
                        <div className="p-2 text-center text-muted-foreground">
                          لا يوجد مطاعم معتمدة
                        </div>
                      ) : (
                        restaurants?.map((restaurant) => (
                          <SelectItem key={restaurant.user_id} value={restaurant.user_id}>
                            {restaurant.business_name || restaurant.full_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="custom_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>السعر المخصص ({t("common.sar")}) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="أدخل السعر المخصص"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? "حفظ التغييرات" : "إضافة"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
