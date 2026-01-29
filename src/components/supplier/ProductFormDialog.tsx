import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
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
import { useCategoryTranslation } from "@/hooks/useCategoryTranslation";
import { useCreateProduct, useUpdateProduct, SupplierProduct, PriceTier } from "@/hooks/useSupplierProducts";
import { Loader2, Globe, Tag } from "lucide-react";
import PriceTiersEditor from "./PriceTiersEditor";

const productSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0.01),
  unit: z.string().min(1),
  category_id: z.string().optional(),
  stock_quantity: z.coerce.number().min(0).default(0),
  unlimited_stock: z.boolean().default(false),
  country_of_origin: z.string().default("السعودية"),
  in_stock: z.boolean().default(true),
  image_url: z.string().url().optional().or(z.literal("")),
  delivery_fee: z.coerce.number().min(0).default(0),
  name_en: z.string().max(100).optional(),
  description_en: z.string().max(500).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: SupplierProduct | null;
}

// Unit keys that map to translation keys
const unitKeys = ["kg", "gram", "piece", "box", "carton", "liter", "pack"] as const;

export default function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: ProductFormDialogProps) {
  const { t } = useTranslation();
  const { data: categories } = useCategories();
  const { getCategoryName } = useCategoryTranslation();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEditing = !!product;
  
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      unit: "kg",
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
  const watchPrice = form.watch("price");
  const watchUnit = form.watch("unit");

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
      setPriceTiers(product.price_tiers || []);
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        unit: "kg",
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
      setPriceTiers([]);
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
        price_tiers: priceTiers,
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
            {isEditing ? t("productForm.editProduct") : t("productForm.addProduct")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("productForm.productNameAr")} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t("productForm.productNamePlaceholder")} {...field} />
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
                  <FormLabel>{t("productForm.descriptionAr")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("productForm.descriptionPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* English Translation */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="translations" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>{t("productForm.englishTranslation")}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      🇬🇧 English
                    </h4>
                    <FormField
                      control={form.control}
                      name="name_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{t("productForm.productNameEn")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("productForm.productNameEnPlaceholder")} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{t("productForm.descriptionEn")}</FormLabel>
                          <FormControl>
                            <Textarea placeholder={t("productForm.descriptionEnPlaceholder")} {...field} />
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
                    <FormLabel>{t("productForm.price")}</FormLabel>
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
                    <FormLabel>{t("productForm.unit")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("productForm.selectUnit")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unitKeys.map((unitKey) => (
                          <SelectItem key={unitKey} value={unitKey}>
                            {t(`productForm.units.${unitKey}`)}
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
                    <FormLabel className="text-base">{t("productForm.unlimitedStock")}</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {t("productForm.unlimitedStockDesc")}
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
                      <FormLabel>{t("productForm.stockQuantity")}</FormLabel>
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
                    <FormLabel>{t("productForm.category")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("productForm.selectCategory")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {getCategoryName(cat)}
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
                  <FormLabel>{t("productForm.countryOfOrigin")}</FormLabel>
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
                  <FormLabel>{t("productForm.deliveryFee")}</FormLabel>
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
                  <FormLabel>{t("productForm.imageUrl")}</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder={t("productForm.imageUrlPlaceholder")}
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
                    <FormLabel className="text-base">{t("productForm.inStock")}</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {t("productForm.inStockDesc")}
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

            {/* Price Tiers Section */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="price-tiers" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <span>{t("productForm.priceTiers")}</span>
                    {priceTiers.length > 0 && (
                      <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                        {priceTiers.length}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <PriceTiersEditor
                    tiers={priceTiers}
                    onChange={setPriceTiers}
                    basePrice={watchPrice}
                    unit={watchUnit}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? t("productForm.saveChanges") : t("productForm.addProduct")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
