import { useState, useEffect, useRef, useMemo } from "react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Loader2, Globe, Upload, X, ImageIcon, Tag, ChevronsUpDown, Check } from "lucide-react";
import PriceTiersEditor from "./PriceTiersEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSubcategoriesByCategory, getSubcategoryName } from "@/hooks/useSubcategories";

const productSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0.01),
  unit: z.string().min(1),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  stock_quantity: z.coerce.number().min(0).default(0),
  unlimited_stock: z.boolean().default(false),
  country_of_origin: z.string().default("السعودية"),
  in_stock: z.boolean().default(true),
  image_url: z.string().url().optional().or(z.literal("")),
  delivery_fee: z.coerce.number().min(0).default(0),
  name_en: z.string().max(100).optional(),
  description_en: z.string().max(500).optional(),
  sku: z.string().max(50).optional(),
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
  const { user } = useAuth();
  const { data: categories } = useCategories();
  const { getCategoryName } = useCategoryTranslation();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEditing = !!product;
  
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Category and subcategory popover states
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [subcategoryPopoverOpen, setSubcategoryPopoverOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [subcategorySearch, setSubcategorySearch] = useState("");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      unit: "kg",
      category_id: "",
      subcategory_id: "",
      stock_quantity: 0,
      unlimited_stock: false,
      country_of_origin: "السعودية",
      in_stock: true,
      image_url: "",
      delivery_fee: 0,
      name_en: "",
      description_en: "",
      sku: "",
    },
  });

  const watchCategoryId = form.watch("category_id");
  const { data: subcategories } = useSubcategoriesByCategory(watchCategoryId || null);

  const watchUnlimitedStock = form.watch("unlimited_stock");
  const watchPrice = form.watch("price");
  const watchUnit = form.watch("unit");
  
  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!categorySearch.trim()) return categories;
    const search = categorySearch.toLowerCase();
    return categories.filter((cat) =>
      cat.name?.toLowerCase().includes(search) ||
      cat.name_en?.toLowerCase().includes(search)
    );
  }, [categories, categorySearch]);
  
  // Filter subcategories based on search
  const filteredSubcategories = useMemo(() => {
    if (!subcategories) return [];
    if (!subcategorySearch.trim()) return subcategories;
    const search = subcategorySearch.toLowerCase();
    return subcategories.filter((sub) =>
      sub.name?.toLowerCase().includes(search) ||
      sub.name_en?.toLowerCase().includes(search)
    );
  }, [subcategories, subcategorySearch]);
  
  // Get selected category and subcategory info
  const selectedCategory = useMemo(() => {
    const catId = form.watch("category_id");
    if (!catId || !categories) return null;
    return categories.find((c) => c.id === catId);
  }, [form.watch("category_id"), categories]);
  
  const selectedSubcategory = useMemo(() => {
    const subId = form.watch("subcategory_id");
    if (!subId || !subcategories) return null;
    return subcategories.find((s) => s.id === subId);
  }, [form.watch("subcategory_id"), subcategories]);

  // Reset form when dialog opens for a new product
  useEffect(() => {
    if (open) {
      // Reset search states
      setCategorySearch("");
      setSubcategorySearch("");
      
      if (product) {
        form.reset({
          name: product.name,
          description: product.description || "",
          price: product.price,
          unit: product.unit,
          category_id: product.category_id || "",
          subcategory_id: (product as any).subcategory_id || "",
          stock_quantity: product.stock_quantity || 0,
          unlimited_stock: (product as any).unlimited_stock || false,
          country_of_origin: product.country_of_origin || "السعودية",
          in_stock: product.in_stock,
          image_url: product.image_url || "",
          delivery_fee: product.delivery_fee || 0,
          name_en: (product as any).name_en || "",
          description_en: (product as any).description_en || "",
          sku: (product as any).sku || "",
        });
        setPriceTiers(product.price_tiers || []);
        setImagePreview(product.image_url || null);
        setImageFile(null);
      } else {
        // Clear form completely for new product
        form.reset({
          name: "",
          description: "",
          price: 0,
          unit: "kg",
          category_id: "",
          subcategory_id: "",
          stock_quantity: 0,
          unlimited_stock: false,
          country_of_origin: "السعودية",
          in_stock: true,
          image_url: "",
          delivery_fee: 0,
          name_en: "",
          description_en: "",
          sku: "",
        });
        setPriceTiers([]);
        setImagePreview(null);
        setImageFile(null);
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  }, [open, product, form]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("productForm.imageTooLarge"));
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue("image_url", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return form.getValues("image_url") || null;

    setIsUploading(true);
    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(t("productForm.imageUploadError"));
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: ProductFormValues) => {
    try {
      // Upload image if a new file was selected
      let imageUrl = values.image_url || null;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const productData = {
        name: values.name,
        description: values.description || null,
        price: values.price,
        unit: values.unit,
        category_id: values.category_id || null,
        subcategory_id: values.subcategory_id || null,
        stock_quantity: values.unlimited_stock ? null : values.stock_quantity,
        unlimited_stock: values.unlimited_stock,
        country_of_origin: values.country_of_origin,
        in_stock: values.in_stock,
        image_url: imageUrl,
        delivery_fee: values.delivery_fee,
        name_en: values.name_en || null,
        description_en: values.description_en || null,
        sku: values.sku || null,
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

  const isLoading = createProduct.isPending || updateProduct.isPending || isUploading;

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
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("productForm.sku")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("productForm.skuPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                <FormItem className="flex flex-col">
                  <FormLabel>{t("productForm.category")}</FormLabel>
                  <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {selectedCategory ? (
                            <span>{getCategoryName(selectedCategory)}</span>
                          ) : (
                            t("productForm.selectCategory")
                          )}
                          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder={t("productForm.searchCategory")}
                          value={categorySearch}
                          onValueChange={setCategorySearch}
                        />
                        <CommandList className="max-h-[200px] overflow-y-auto">
                          {filteredCategories.length === 0 ? (
                            <CommandEmpty>{t("common.noResults")}</CommandEmpty>
                          ) : (
                            <CommandGroup>
                              {filteredCategories.map((cat) => (
                                <CommandItem
                                  key={cat.id}
                                  value={cat.id}
                                  onSelect={() => {
                                    field.onChange(cat.id);
                                    form.setValue("subcategory_id", "");
                                    setCategoryPopoverOpen(false);
                                    setCategorySearch("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "me-2 h-4 w-4",
                                      field.value === cat.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <span>{getCategoryName(cat)}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subcategory Field - Optional, shown when category is selected */}
            {watchCategoryId && subcategories && subcategories.length > 0 && (
              <FormField
                control={form.control}
                name="subcategory_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("productForm.subcategory")}</FormLabel>
                    <Popover open={subcategoryPopoverOpen} onOpenChange={setSubcategoryPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {selectedSubcategory ? (
                              <span>{getSubcategoryName(selectedSubcategory, "ar")}</span>
                            ) : (
                              t("productForm.selectSubcategory")
                            )}
                            <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder={t("productForm.searchSubcategory")}
                            value={subcategorySearch}
                            onValueChange={setSubcategorySearch}
                          />
                          <CommandList className="max-h-[200px] overflow-y-auto">
                            <CommandGroup>
                              <CommandItem
                                value="none"
                                onSelect={() => {
                                  field.onChange("");
                                  setSubcategoryPopoverOpen(false);
                                  setSubcategorySearch("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "me-2 h-4 w-4",
                                    !field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span>{t("productForm.noSubcategory")}</span>
                              </CommandItem>
                              {filteredSubcategories.map((sub) => (
                                <CommandItem
                                  key={sub.id}
                                  value={sub.id}
                                  onSelect={() => {
                                    field.onChange(sub.id);
                                    setSubcategoryPopoverOpen(false);
                                    setSubcategorySearch("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "me-2 h-4 w-4",
                                      field.value === sub.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <span>{getSubcategoryName(sub, "ar")}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("productForm.subcategoryHint")}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

            {/* Image Upload Section */}
            <div className="space-y-2">
              <FormLabel>{t("productForm.productImage")}</FormLabel>
              <div className="flex flex-col gap-3">
                {imagePreview ? (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 end-2 h-8 w-8"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-muted/50"
                  >
                    <div className="p-3 rounded-full bg-primary/10">
                      <ImageIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{t("productForm.clickToUpload")}</p>
                      <p className="text-xs text-muted-foreground">{t("productForm.maxFileSize")}</p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                {!imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4" />
                    {t("productForm.uploadImage")}
                  </Button>
                )}
              </div>
            </div>

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
