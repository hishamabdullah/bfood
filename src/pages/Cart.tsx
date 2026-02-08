import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingBag, ArrowLeft, Truck, Warehouse, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useCreateOrder } from "@/hooks/useOrders";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BranchSelector } from "@/components/cart/BranchSelector";
import { useBranches } from "@/hooks/useBranches";
import { SupplierCartSection } from "@/components/cart/SupplierCartSection";
import { SaveTemplateDialog } from "@/components/cart/SaveTemplateDialog";
import { supabase } from "@/integrations/supabase/client";
import { useHasFeature, useMaxNotesChars } from "@/hooks/useRestaurantAccess";
import { useSubUserContext, useEffectiveRestaurantId } from "@/hooks/useSubUserContext";

const Cart = () => {
  const { t } = useTranslation();
  const { items, updateQuantity, removeItem, clearCart, getSubtotal, getItemsBySupplier } = useCart();
  const { user, userRole } = useAuth();
  const createOrder = useCreateOrder();
  const navigate = useNavigate();
  const { data: subUserContext } = useSubUserContext();
  const { restaurantId: effectiveRestaurantId } = useEffectiveRestaurantId();
  
  // Feature checks
  const { hasFeature: canUseBranches } = useHasFeature("can_use_branches");
  const { hasFeature: canUseTemplates } = useHasFeature("can_use_templates");
  const { maxChars: maxNotesChars } = useMaxNotesChars();
  
  const { data: branches = [] } = useBranches();

  // الفروع المتاحة حسب المستخدم (المستخدم الفرعي يرى فقط الفروع المربوطة به)
  const availableBranchesForUser = useMemo(() => {
    if (subUserContext?.isSubUser && subUserContext.allowedBranchIds.length > 0) {
      return branches.filter((b) => subUserContext.allowedBranchIds.includes(b.id));
    }
    return branches;
  }, [branches, subUserContext]);

  // جلب اسم الموظف إذا كان موظفاً
  const { data: subUserName } = useQuery({
    queryKey: ["sub-user-name", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("restaurant_sub_users")
        .select("full_name")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      return data?.full_name || null;
    },
    enabled: !!subUserContext?.isSubUser && !!user?.id,
  });

  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  // Per-supplier pickup status
  const [supplierPickupStatus, setSupplierPickupStatus] = useState<Record<string, boolean>>({});

  const groupedBySupplier = getItemsBySupplier();
  const supplierIds = Object.keys(groupedBySupplier);

  // جلب بيانات الموردين الحديثة من قاعدة البيانات
  const { data: freshSupplierProfiles } = useQuery({
    queryKey: ["cart-supplier-profiles", supplierIds],
    queryFn: async () => {
      if (supplierIds.length === 0) return {};
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, business_name, avatar_url, minimum_order_amount, default_delivery_fee, delivery_option, google_maps_url")
        .in("user_id", supplierIds);
      
      const profileMap: Record<string, any> = {};
      profiles?.forEach(p => {
        profileMap[p.user_id] = p;
      });
      return profileMap;
    },
    enabled: supplierIds.length > 0,
    staleTime: 0, // دائماً جلب بيانات جديدة
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // دمج بيانات الموردين الجديدة مع المجموعات
  const groupedWithFreshData = useMemo(() => {
    if (!freshSupplierProfiles) return groupedBySupplier;
    
    const updated: typeof groupedBySupplier = {};
    Object.entries(groupedBySupplier).forEach(([supplierId, group]) => {
      const freshProfile = freshSupplierProfiles[supplierId];
      updated[supplierId] = {
        ...group,
        supplierProfile: freshProfile || group.supplierProfile,
        supplierName: freshProfile?.business_name || group.supplierName,
      };
    });
    return updated;
  }, [groupedBySupplier, freshSupplierProfiles]);

  // Initialize pickup status for new suppliers (considering delivery_option)
  useEffect(() => {
    const newStatus = { ...supplierPickupStatus };
    let changed = false;
    Object.entries(groupedWithFreshData).forEach(([supplierId, group]) => {
      const deliveryOption = (group.supplierProfile as any)?.delivery_option || "with_fee";
      
      if (!(supplierId in newStatus)) {
        // إذا كان المورد لا يوفر توصيل، اجعله pickup تلقائياً
        if (deliveryOption === "no_delivery") {
          newStatus[supplierId] = true;
        } else if (deliveryOption === "minimum_only") {
          // تحقق إذا كان يتجاوز الحد الأدنى
          const supplierSubtotal = group.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
          const minimumOrderAmount = group.supplierProfile?.minimum_order_amount || 0;
          newStatus[supplierId] = supplierSubtotal < minimumOrderAmount;
        } else {
          newStatus[supplierId] = false;
        }
        changed = true;
      } else if (deliveryOption === "no_delivery" && !newStatus[supplierId]) {
        // تأكد أن الموردين بدون توصيل دائماً pickup
        newStatus[supplierId] = true;
        changed = true;
      }
    });
    // Clean up suppliers no longer in cart
    Object.keys(newStatus).forEach((supplierId) => {
      if (!(supplierId in groupedWithFreshData)) {
        delete newStatus[supplierId];
        changed = true;
      }
    });
    if (changed) {
      setSupplierPickupStatus(newStatus);
    }
  }, [groupedWithFreshData, supplierPickupStatus]);

  // Check if all suppliers are pickup (to hide branch selector)
  const allSuppliersPickup = useMemo(() => {
    const supplierIds = Object.keys(groupedWithFreshData);
    return supplierIds.length > 0 && supplierIds.every((id) => supplierPickupStatus[id] === true);
  }, [groupedWithFreshData, supplierPickupStatus]);

  // Check if any supplier has delivery
  const anySupplierDelivery = useMemo(() => {
    return Object.values(supplierPickupStatus).some((isPickup) => !isPickup);
  }, [supplierPickupStatus]);

  // Auto-select default branch when branches load (مع مراعاة تقييد فروع المستخدم الفرعي)
  useEffect(() => {
    if (availableBranchesForUser.length === 0) return;

    const selectedIsValid =
      !!selectedBranchId && availableBranchesForUser.some((b) => b.id === selectedBranchId);

    // إذا كان هناك فرع محدد وصالح ضمن الفروع المتاحة، لا تغيّر شيئاً
    if (selectedIsValid) return;

    // اختر الافتراضي ضمن الفروع المتاحة، وإلا أول فرع متاح
    const nextBranch =
      availableBranchesForUser.find((b) => b.is_default) ?? availableBranchesForUser[0];

    if (nextBranch) {
      setSelectedBranchId(nextBranch.id);
      setDeliveryAddress(nextBranch.google_maps_url || nextBranch.address || "");
    }
  }, [availableBranchesForUser, selectedBranchId]);

  const handleBranchChange = (branchId: string, address: string) => {
    setSelectedBranchId(branchId);
    setDeliveryAddress(address);
  };

  const handleSupplierPickupChange = (supplierId: string, isPickup: boolean) => {
    setSupplierPickupStatus((prev) => ({
      ...prev,
      [supplierId]: isPickup,
    }));
  };

  const subtotal = getSubtotal();

  // Calculate delivery fees per supplier (only if not pickup for that supplier)
  // Product delivery fees are ALWAYS added, supplier default fee depends on minimum order amount
  const supplierDeliveryFees = useMemo(() => {
    const fees: Record<string, { fee: number; reason: string; isFree: boolean; productFees: number; supplierFee: number }> = {};

    Object.entries(groupedWithFreshData).forEach(([supplierId, group]) => {
      const isSupplierPickup = supplierPickupStatus[supplierId] || false;

      // If pickup for this supplier, no delivery fee
      if (isSupplierPickup) {
        fees[supplierId] = { fee: 0, reason: "", isFree: false, productFees: 0, supplierFee: 0 };
        return;
      }

      const supplierProfile = group.supplierProfile;
      const minimumOrderAmount = supplierProfile?.minimum_order_amount || 0;
      const defaultDeliveryFee = supplierProfile?.default_delivery_fee || 0;

      // Calculate product-level delivery fees (always applied)
      const productDeliveryFees = group.items.reduce((sum, item) => {
        const productFee = item.product.delivery_fee || 0;
        return sum + productFee;
      }, 0);

      const supplierSubtotal = group.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      let supplierFee = 0;
      let reason = "";
      let isFree = false;

      if (minimumOrderAmount > 0 && supplierSubtotal < minimumOrderAmount) {
        supplierFee = defaultDeliveryFee;
        reason = t("cart.belowMinimum", { amount: minimumOrderAmount }) || `أقل من الحد الأدنى (${minimumOrderAmount} ر.س)`;
      } else if (minimumOrderAmount > 0 && supplierSubtotal >= minimumOrderAmount) {
        reason = t("cart.freeDeliverySupplier") || "رسوم المورد معفاة";
        isFree = true;
      }

      const totalFee = productDeliveryFees + supplierFee;
      fees[supplierId] = { 
        fee: totalFee, 
        reason: productDeliveryFees > 0 ? t("cart.includesProductFees") || "تشمل رسوم المنتجات" : reason,
        isFree,
        productFees: productDeliveryFees,
        supplierFee
      };
    });
    return fees;
  }, [groupedWithFreshData, t, supplierPickupStatus]);

  const totalDeliveryFee = Object.values(supplierDeliveryFees).reduce((sum, { fee }) => sum + fee, 0);
  const total = subtotal + totalDeliveryFee;

  const handleCheckout = async () => {
    if (!user) {
      toast.error(t("cart.loginRequired") || "يجب تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }

    if (userRole !== "restaurant") {
      toast.error(t("cart.restaurantOnly") || "فقط المطاعم يمكنها إنشاء طلبات");
      return;
    }

    if (items.length === 0) {
      toast.error(t("cart.empty"));
      return;
    }

    // التحقق من شروط التوصيل لكل مورد
    for (const [supplierId, group] of Object.entries(groupedWithFreshData)) {
      const isSupplierPickup = supplierPickupStatus[supplierId] || false;
      const deliveryOption = (group.supplierProfile as any)?.delivery_option || "with_fee";
      const minimumOrderAmount = group.supplierProfile?.minimum_order_amount || 0;
      const supplierSubtotal = group.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      // إذا اختار التوصيل ولكن المورد لا يوفره
      if (!isSupplierPickup && deliveryOption === "no_delivery") {
        toast.error(t("cart.supplierNoDelivery", { name: group.supplierName }) || `المورد ${group.supplierName} لا يوفر خدمة التوصيل`);
        return;
      }

      // إذا اختار التوصيل ولكن لم يتجاوز الحد الأدنى
      if (!isSupplierPickup && deliveryOption === "minimum_only" && supplierSubtotal < minimumOrderAmount) {
        toast.error(t("cart.supplierMinimumNotMet", { name: group.supplierName, amount: minimumOrderAmount }) || `يجب أن يتجاوز طلبك من ${group.supplierName} الحد الأدنى ${minimumOrderAmount} ريال للتوصيل`);
        return;
      }
    }

    try {
      await createOrder.mutateAsync({
        items,
        deliveryAddress: allSuppliersPickup ? undefined : deliveryAddress || undefined,
        notes: notes || undefined,
        branchId: allSuppliersPickup ? undefined : selectedBranchId || undefined,
        supplierDeliveryFees,
        supplierPickupStatus,
        // إضافة معلومات منشئ الطلب إذا كان موظفاً
        createdByUserId: subUserContext?.isSubUser ? user?.id : undefined,
        createdByName: subUserContext?.isSubUser ? subUserName || undefined : undefined,
      });

      clearCart();
      toast.success(t("cart.orderSuccess") || "تم إنشاء الطلب بنجاح!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(t("cart.orderError") || "حدث خطأ أثناء إنشاء الطلب");
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("cart.empty")}</h2>
            <p className="text-muted-foreground mb-6">{t("cart.emptyMessage")}</p>
            <Link to="/products">
              <Button variant="hero">
                {t("cart.browseProducts")}
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-8">{t("cart.title")}</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(groupedWithFreshData).map(([supplierId, group]) => {
                const supplierSubtotal = group.items.reduce(
                  (sum, item) => sum + item.product.price * item.quantity,
                  0
                );
                return (
                  <SupplierCartSection
                    key={supplierId}
                    supplierId={supplierId}
                    group={group}
                    isPickup={supplierPickupStatus[supplierId] || false}
                    onPickupChange={(isPickup) => handleSupplierPickupChange(supplierId, isPickup)}
                    deliveryFeeInfo={supplierDeliveryFees[supplierId] || { fee: 0, reason: "", isFree: false }}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                    supplierSubtotal={supplierSubtotal}
                  />
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border p-6 sticky top-24 space-y-6">
                <h3 className="font-bold text-xl">{t("cart.orderSummary")}</h3>

                {/* Branch Selector - Only show if any supplier has delivery AND feature is enabled */}
                {anySupplierDelivery && canUseBranches && (
                  <BranchSelector
                    selectedBranchId={selectedBranchId}
                    onBranchChange={handleBranchChange}
                    customAddress={deliveryAddress}
                    onCustomAddressChange={setDeliveryAddress}
                  />
                )}
                
                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("cart.notes")}
                    <span className="text-muted-foreground text-xs ms-2">
                      ({notes.length}/{maxNotesChars})
                    </span>
                  </label>
                  <Textarea
                    placeholder={t("cart.notesPlaceholder")}
                    value={notes}
                    onChange={(e) => {
                      if (e.target.value.length <= maxNotesChars) {
                        setNotes(e.target.value);
                      }
                    }}
                    maxLength={maxNotesChars}
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  {/* Supplier subtotals */}
                  {Object.entries(groupedWithFreshData).map(([supplierId, group]) => {
                    const supplierSubtotal = group.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
                    const isSupplierPickup = supplierPickupStatus[supplierId] || false;
                    const supplierFee = isSupplierPickup ? 0 : supplierDeliveryFees[supplierId]?.fee || 0;

                    return (
                      <div key={supplierId} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{group.supplierName}</span>
                          <span>
                            {supplierSubtotal.toFixed(2)} {t("common.sar")}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            {isSupplierPickup ? (
                              <>
                                <Warehouse className="h-3 w-3" />
                                {t("cart.pickupFromWarehouse")}
                              </>
                            ) : (
                              <>
                                <Truck className="h-3 w-3" />
                                {t("cart.deliveryFee")}
                              </>
                            )}
                          </span>
                          <span className={isSupplierPickup ? "text-green-600" : supplierFee > 0 ? "text-amber-600" : ""}>
                            {isSupplierPickup ? t("cart.freeDelivery") : `${supplierFee.toFixed(2)} ${t("common.sar")}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Total */}
                  <div className="border-t border-border pt-4 flex justify-between">
                    <span className="font-bold">{t("cart.total")}</span>
                    <span className="font-bold text-xl text-primary">
                      {total.toFixed(2)} {t("common.sar")}
                    </span>
                  </div>
                </div>

                <Button variant="hero" className="w-full" size="lg" onClick={handleCheckout} disabled={createOrder.isPending}>
                  {createOrder.isPending ? t("cart.processingOrder") : t("cart.checkout")}
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                {/* Save as Template Button - Only show if feature is enabled */}
                {canUseTemplates && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowSaveTemplate(true)}
                  >
                    <Save className="h-4 w-4 me-2" />
                    {t("templates.saveAsTemplate")}
                  </Button>
                )}

                <p className="text-xs text-center text-muted-foreground">{t("cart.orderSplitNote")}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        open={showSaveTemplate}
        onOpenChange={setShowSaveTemplate}
        items={items}
      />
    </div>
  );
};

export default Cart;
