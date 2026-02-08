import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { useSubcategoriesByCategory, getSubcategoryName } from "@/hooks/useSubcategories";
import { useSectionsBySubcategory, getSectionName } from "@/hooks/useSections";
import { useCategoryTranslation } from "@/hooks/useCategoryTranslation";
import { Loader2, Globe, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import { useTranslation } from "react-i18next";

type AdminProduct = Tables<"products"> & {
  category?: Tables<"categories"> | null;
  subcategory?: Tables<"subcategories"> | null;
  section?: Tables<"sections"> | null;
  supplier_profile?: Tables<"profiles"> | null;
};

const productSchema = z.object({
  name: z.string().min(2, "اسم المنتج مطلوب").max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0.01, "السعر يجب أن يكون أكبر من صفر"),
  unit: z.string().min(1, "الوحدة مطلوبة"),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  section_id: z.string().optional(),
  stock_quantity: z.coerce.number().min(0).default(0),
  unlimited_stock: z.boolean().default(false),
  country_of_origin: z.string().default("السعودية"),
  in_stock: z.boolean().default(true),
  image_url: z.string().url().optional().or(z.literal("")),
  delivery_fee: z.coerce.number().min(0).default(0),
  name_en: z.string().max(100).optional(),
  description_en: z.string().max(500).optional(),
  sku: z.string().max(50).optional(),
  supplier_id: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface AdminProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: AdminProduct | null;
}

const units = ["kg", "gram", "piece", "box", "carton", "liter", "pack"];
const unitLabels: Record<string, string> = {
  kg: "كيلو",
  gram: "جرام",
  piece: "قطعة",
  box: "صندوق",
  carton: "كرتون",
  liter: "لتر",
  pack: "علبة",
};

type SupplierItem = {
  user_id: string;
  business_name: string;
  full_name: string;
  customer_code: string | null;
};

const useSuppliers = () => {
  return useQuery({
    queryKey: ["admin-suppliers-with-code"],
    queryFn: async () => {
      // استخدام الدالة الآمنة لجلب الموردين
      const { data, error } = await supabase.rpc("get_approved_suppliers");

      if (error) throw error;
      return (data || []) as SupplierItem[];
    },
  });
};

const useAdminUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...product }: { id: string } & Partial<Tables<"products">>) => {
      const { data, error } = await supabase
        .from("products")
        .update(product)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم تحديث المنتج بنجاح");
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      toast.error("حدث خطأ أثناء تحديث المنتج");
    },
  });
};

const useAdminCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Omit<Tables<"products">, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("products")
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم إضافة المنتج بنجاح");
    },
    onError: (error) => {
      console.error("Error creating product:", error);
      toast.error("حدث خطأ أثناء إضافة المنتج");
    },
  });
};

export default function AdminProductFormDialog({
  open,
  onOpenChange,
  product,
}: AdminProductFormDialogProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const { data: categories } = useCategories();
  const { data: suppliers } = useSuppliers();
  const { getCategoryName } = useCategoryTranslation();
  const updateProduct = useAdminUpdateProduct();
  const createProduct = useAdminCreateProduct();
  const isEditing = !!product;
  
  // Subcategory and Section states
  const [subcategoryPopoverOpen, setSubcategoryPopoverOpen] = useState(false);
  const [sectionPopoverOpen, setSectionPopoverOpen] = useState(false);
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [sectionSearch, setSectionSearch] = useState("");
  
  // Supplier search state
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);
  
  // Filter suppliers based on search
  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    if (!supplierSearch.trim()) return suppliers;
    
    const search = supplierSearch.toLowerCase();
    return suppliers.filter((s) => 
      s.business_name?.toLowerCase().includes(search) ||
      s.full_name?.toLowerCase().includes(search) ||
      s.customer_code?.includes(search)
    );
  }, [suppliers, supplierSearch]);
  
  // Get selected supplier info
  const selectedSupplier = useMemo(() => {
    const supplierId = product?.supplier_id;
    if (!supplierId || !suppliers) return null;
    return suppliers.find((s) => s.user_id === supplierId);
  }, [product?.supplier_id, suppliers]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      unit: "kg",
      category_id: "",
      subcategory_id: "",
      section_id: "",
      stock_quantity: 0,
      unlimited_stock: false,
      country_of_origin: "السعودية",
      in_stock: true,
      image_url: "",
      delivery_fee: 0,
      name_en: "",
      description_en: "",
      sku: "",
      supplier_id: "",
    },
  });

  const watchCategoryId = form.watch("category_id");
  const watchSubcategoryId = form.watch("subcategory_id");
  const watchUnlimitedStock = form.watch("unlimited_stock");

  // Fetch subcategories based on selected category
  const { data: subcategories } = useSubcategoriesByCategory(watchCategoryId || null);
  const { data: sections } = useSectionsBySubcategory(watchSubcategoryId || null);

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

  // Filter sections based on search
  const filteredSections = useMemo(() => {
    if (!sections) return [];
    if (!sectionSearch.trim()) return sections;
    const search = sectionSearch.toLowerCase();
    return sections.filter((sec) =>
      sec.name?.toLowerCase().includes(search) ||
      sec.name_en?.toLowerCase().includes(search)
    );
  }, [sections, sectionSearch]);

  // Get selected subcategory and section info
  const selectedSubcategory = useMemo(() => {
    const subId = form.watch("subcategory_id");
    if (!subId || !subcategories) return null;
    return subcategories.find((s) => s.id === subId);
  }, [form.watch("subcategory_id"), subcategories]);

  const selectedSection = useMemo(() => {
    const secId = form.watch("section_id");
    if (!secId || !sections) return null;
    return sections.find((s) => s.id === secId);
  }, [form.watch("section_id"), sections]);

  useEffect(() => {
    // Reset search states when dialog opens
    setSubcategorySearch("");
    setSectionSearch("");
    
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || "",
        price: product.price,
        unit: product.unit,
        category_id: product.category_id || "",
        subcategory_id: product.subcategory_id || "",
        section_id: product.section_id || "",
        stock_quantity: product.stock_quantity || 0,
        unlimited_stock: product.unlimited_stock || false,
        country_of_origin: product.country_of_origin || "السعودية",
        in_stock: product.in_stock,
        image_url: product.image_url || "",
        delivery_fee: product.delivery_fee || 0,
        name_en: product.name_en || "",
        description_en: product.description_en || "",
        sku: (product as any).sku || "",
        supplier_id: product.supplier_id || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        unit: "kg",
        category_id: "",
        subcategory_id: "",
        section_id: "",
        stock_quantity: 0,
        unlimited_stock: false,
        country_of_origin: "السعودية",
        in_stock: true,
        image_url: "",
        delivery_fee: 0,
        name_en: "",
        description_en: "",
        sku: "",
        supplier_id: "",
      });
    }
  }, [product, form, open]);

  const onSubmit = async (values: ProductFormValues) => {
    try {
      const productData = {
        name: values.name,
        description: values.description || null,
        price: values.price,
        unit: values.unit,
        category_id: values.category_id || null,
        subcategory_id: values.subcategory_id || null,
        section_id: values.section_id || null,
        stock_quantity: values.unlimited_stock ? null : values.stock_quantity,
        unlimited_stock: values.unlimited_stock,
        country_of_origin: values.country_of_origin,
        in_stock: values.in_stock,
        image_url: values.image_url || null,
        delivery_fee: values.delivery_fee,
        name_en: values.name_en || null,
        description_en: values.description_en || null,
        sku: values.sku || null,
      };

      if (isEditing && product) {
        await updateProduct.mutateAsync({
          id: product.id,
          ...productData,
        });
      } else {
        if (!values.supplier_id) {
          toast.error("يجب اختيار المورد");
          return;
        }
        await createProduct.mutateAsync({
          ...productData,
          supplier_id: values.supplier_id,
        } as any);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const isLoading = updateProduct.isPending || createProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Supplier Selection with Search - Only for new products */}
            {!isEditing && (
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => {
                  const selectedSupplierForField = suppliers?.find((s) => s.user_id === field.value);
                  
                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>المورد *</FormLabel>
                      <Popover open={supplierPopoverOpen} onOpenChange={setSupplierPopoverOpen}>
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
                              {selectedSupplierForField ? (
                                <span className="flex items-center gap-2">
                                  <span>{selectedSupplierForField.business_name || selectedSupplierForField.full_name}</span>
                                  {selectedSupplierForField.customer_code && (
                                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                      #{selectedSupplierForField.customer_code}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                "ابحث عن المورد..."
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput 
                              placeholder="ابحث بالاسم أو رقم المورد..." 
                              value={supplierSearch}
                              onValueChange={setSupplierSearch}
                            />
                            <CommandList>
                              <CommandEmpty>لا يوجد موردين</CommandEmpty>
                              <CommandGroup>
                                {filteredSuppliers.map((supplier) => (
                                  <CommandItem
                                    key={supplier.user_id}
                                    value={`${supplier.business_name} ${supplier.full_name} ${supplier.customer_code || ""}`}
                                    onSelect={() => {
                                      field.onChange(supplier.user_id);
                                      setSupplierPopoverOpen(false);
                                      setSupplierSearch("");
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === supplier.user_id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                      <span>{supplier.business_name || supplier.full_name}</span>
                                      {supplier.customer_code && (
                                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                          #{supplier.customer_code}
                                        </span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}

            {/* SKU Field */}
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم المنتج (SKU)</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: PRD-001" {...field} />
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
                    <Textarea placeholder="وصف مختصر للمنتج..." {...field} />
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
                    <span>الترجمة الإنجليزية (اختياري)</span>
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
                            {unitLabels[unit] || unit}
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
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                    <FormLabel>التصنيف الرئيسي</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset subcategory and section when category changes
                        form.setValue("subcategory_id", "");
                        form.setValue("section_id", "");
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر التصنيف" />
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

            {/* Subcategory Selection */}
            {watchCategoryId && subcategories && subcategories.length > 0 && (
              <FormField
                control={form.control}
                name="subcategory_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>القسم الفرعي</FormLabel>
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
                            {selectedSubcategory
                              ? getSubcategoryName(selectedSubcategory, currentLang)
                              : "اختر القسم الفرعي..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="ابحث عن قسم فرعي..."
                            value={subcategorySearch}
                            onValueChange={setSubcategorySearch}
                          />
                          <CommandList>
                            <CommandEmpty>لا توجد أقسام فرعية</CommandEmpty>
                            <CommandGroup>
                              {filteredSubcategories.map((sub) => (
                                <CommandItem
                                  key={sub.id}
                                  value={`${sub.name} ${sub.name_en || ""}`}
                                  onSelect={() => {
                                    field.onChange(sub.id);
                                    form.setValue("section_id", "");
                                    setSubcategoryPopoverOpen(false);
                                    setSubcategorySearch("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === sub.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {getSubcategoryName(sub, currentLang)}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Section Selection */}
            {watchSubcategoryId && sections && sections.length > 0 && (
              <FormField
                control={form.control}
                name="section_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>القسم الداخلي</FormLabel>
                    <Popover open={sectionPopoverOpen} onOpenChange={setSectionPopoverOpen}>
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
                            {selectedSection
                              ? getSectionName(selectedSection, currentLang)
                              : "اختر القسم الداخلي..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="ابحث عن قسم داخلي..."
                            value={sectionSearch}
                            onValueChange={setSectionSearch}
                          />
                          <CommandList>
                            <CommandEmpty>لا توجد أقسام داخلية</CommandEmpty>
                            <CommandGroup>
                              {filteredSections.map((sec) => (
                                <CommandItem
                                  key={sec.id}
                                  value={`${sec.name} ${sec.name_en || ""}`}
                                  onSelect={() => {
                                    field.onChange(sec.id);
                                    setSectionPopoverOpen(false);
                                    setSectionSearch("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === sec.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {getSectionName(sec, currentLang)}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                  <FormLabel>رسوم التوصيل (ر.س)</FormLabel>
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
                    <Input type="url" placeholder="https://example.com/image.jpg" {...field} />
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
                    <FormLabel className="text-base">متوفر للطلب</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      إظهار المنتج للمطاعم
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {isEditing ? "حفظ التعديلات" : "إضافة المنتج"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}