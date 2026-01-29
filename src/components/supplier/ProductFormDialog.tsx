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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCategories } from "@/hooks/useProducts";
import { useCreateProduct, useUpdateProduct, SupplierProduct } from "@/hooks/useSupplierProducts";
import { Loader2, Globe } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(2, "اسم المنتج مطلوب").max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0.01, "السعر يجب أن يكون أكبر من صفر"),
  unit: z.string().min(1, "الوحدة مطلوبة"),
  category_id: z.string().optional(),
  stock_quantity: z.coerce.number().min(0).default(0),
  unlimited_stock: z.boolean().default(false),
  country_of_origin: z.string().default("السعودية"),
  in_stock: z.boolean().default(true),
  image_url: z.string().url().optional().or(z.literal("")),
  delivery_fee: z.coerce.number().min(0).default(0),
  // ترجمة إنجليزية اختيارية
  name_en: z.string().max(100).optional(),
  description_en: z.string().max(500).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: SupplierProduct | null;
}

const units = ["كيلو", "جرام", "قطعة", "صندوق", "كرتون", "لتر", "علبة"];

export default function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: ProductFormDialogProps) {
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEditing = !!product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      unit: "كيلو",
      category_id: "",
      stock_quantity: 0,
      unlimited_stock: false,
      country_of_origin: "السعودية",
      in_stock: true,
      image_url: "",
      delivery_fee: 0,
      name_en: "",
      description_en: "",
    },
  });

  const watchUnlimitedStock = form.watch("unlimited_stock");

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || "",
        price: product.price,
        unit: product.unit,
        category_id: product.category_id || "",
        stock_quantity: product.stock_quantity || 0,
        unlimited_stock: (product as any).unlimited_stock || false,
        country_of_origin: product.country_of_origin || "السعودية",
        in_stock: product.in_stock,
        image_url: product.image_url || "",
        delivery_fee: product.delivery_fee || 0,
        name_en: (product as any).name_en || "",
        description_en: (product as any).description_en || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        unit: "كيلو",
        category_id: "",
        stock_quantity: 0,
        unlimited_stock: false,
        country_of_origin: "السعودية",
        in_stock: true,
        image_url: "",
        delivery_fee: 0,
        name_en: "",
        description_en: "",
      });
    }
  }, [product, form]);

  const onSubmit = async (values: ProductFormValues) => {
    try {
      const productData = {
        name: values.name,
        description: values.description || null,
        price: values.price,
        unit: values.unit,
        category_id: values.category_id || null,
        stock_quantity: values.unlimited_stock ? null : values.stock_quantity,
        unlimited_stock: values.unlimited_stock,
        country_of_origin: values.country_of_origin,
        in_stock: values.in_stock,
        image_url: values.image_url || null,
        delivery_fee: values.delivery_fee,
        name_en: values.name_en || null,
        description_en: values.description_en || null,
      };

      if (isEditing && product) {
        await updateProduct.mutateAsync({
          id: product.id,
          ...productData,
        });
      } else {
        await createProduct.mutateAsync(productData as any);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const isLoading = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "تعديل المنتج" : "إضافة منتج جديد"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المنتج (عربي) *</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: طماطم طازجة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف بالعربي (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="وصف مختصر للمنتج..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ترجمة إنجليزية اختيارية */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="translations" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>الترجمة الإنجليزية (اختياري)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {/* English */}
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      🇬🇧 English
                    </h4>
                    <FormField
                      control={form.control}
                      name="name_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Fresh Tomatoes" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Product description..." {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر (ر.س)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوحدة</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الوحدة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Unlimited Stock Toggle */}
            <FormField
              control={form.control}
              name="unlimited_stock"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="text-base">كمية غير محدودة</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      تفعيل هذا الخيار يعني أن الكمية متاحة دائماً
                    </p>
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

            <div className="grid grid-cols-2 gap-4">
              {!watchUnlimitedStock && (
                <FormField
                  control={form.control}
                  name="stock_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الكمية المتوفرة</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem className={watchUnlimitedStock ? "col-span-2" : ""}>
                    <FormLabel>التصنيف</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر التصنيف" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country_of_origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>بلد المنشأ</FormLabel>
                  <FormControl>
                    <Input placeholder="السعودية" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="delivery_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رسوم التوصيل (ر.س) - اختياري</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رابط الصورة (اختياري)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="in_stock"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="text-base">متوفر</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      هل المنتج متوفر للطلب؟
                    </p>
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
                {isEditing ? "حفظ التغييرات" : "إضافة المنتج"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
