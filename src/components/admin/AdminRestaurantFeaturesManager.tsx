import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Search,
  Settings2,
  Power,
  PowerOff,
  ShoppingCart,
  FileText,
  Building2,
  Heart,
  BarChart3,
  Tag,
  Crown,
  Calendar,
} from "lucide-react";
import {
  useAllRestaurantsWithFeatures,
  useUpdateRestaurantFeatures,
  useToggleRestaurantActive,
  RestaurantWithFeatures,
  RestaurantFeatures,
} from "@/hooks/useRestaurantFeatures";

const subscriptionTypes = [
  { value: "basic", label: "أساسي", color: "bg-gray-500" },
  { value: "standard", label: "عادي", color: "bg-blue-500" },
  { value: "premium", label: "متميز", color: "bg-amber-500" },
  { value: "enterprise", label: "مؤسسات", color: "bg-purple-500" },
];

const AdminRestaurantFeaturesManager = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantWithFeatures | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedFeatures, setEditedFeatures] = useState<Partial<RestaurantFeatures>>({});

  const { data: restaurants, isLoading } = useAllRestaurantsWithFeatures();
  const updateFeatures = useUpdateRestaurantFeatures();
  const toggleActive = useToggleRestaurantActive();

  const filteredRestaurants = restaurants?.filter(
    (r) =>
      r.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customer_code?.includes(searchQuery) ||
      r.phone?.includes(searchQuery)
  );

  const openEditDialog = (restaurant: RestaurantWithFeatures) => {
    setSelectedRestaurant(restaurant);
    setEditedFeatures({
      is_active: restaurant.features?.is_active ?? true,
      can_order: restaurant.features?.can_order ?? true,
      can_use_templates: restaurant.features?.can_use_templates ?? false,
      can_use_branches: restaurant.features?.can_use_branches ?? false,
      can_use_favorites: restaurant.features?.can_use_favorites ?? true,
      can_view_analytics: restaurant.features?.can_view_analytics ?? false,
      can_use_custom_prices: restaurant.features?.can_use_custom_prices ?? false,
      max_orders_per_month: restaurant.features?.max_orders_per_month ?? null,
      subscription_type: restaurant.features?.subscription_type ?? "basic",
      subscription_end_date: restaurant.features?.subscription_end_date ?? null,
      notes: restaurant.features?.notes ?? null,
    });
    setIsDialogOpen(true);
  };

  const handleSaveFeatures = async () => {
    if (!selectedRestaurant) return;

    await updateFeatures.mutateAsync({
      restaurant_id: selectedRestaurant.user_id,
      features: editedFeatures,
    });

    setIsDialogOpen(false);
    setSelectedRestaurant(null);
  };

  const handleToggleActive = async (restaurant: RestaurantWithFeatures) => {
    const currentStatus = restaurant.features?.is_active ?? true;
    await toggleActive.mutateAsync({
      restaurant_id: restaurant.user_id,
      is_active: !currentStatus,
    });
  };

  const getSubscriptionBadge = (type: string) => {
    const sub = subscriptionTypes.find((s) => s.value === type) || subscriptionTypes[0];
    return (
      <Badge className={`${sub.color} text-white`}>
        <Crown className="h-3 w-3 ml-1" />
        {sub.label}
      </Badge>
    );
  };

  const getFeatureCount = (restaurant: RestaurantWithFeatures) => {
    if (!restaurant.features) return 2; // القيم الافتراضية: can_order + can_use_favorites
    let count = 0;
    if (restaurant.features.can_order) count++;
    if (restaurant.features.can_use_templates) count++;
    if (restaurant.features.can_use_branches) count++;
    if (restaurant.features.can_use_favorites) count++;
    if (restaurant.features.can_view_analytics) count++;
    if (restaurant.features.can_use_custom_prices) count++;
    return count;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            إدارة اشتراكات وميزات المطاعم
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم أو رقم العميل أو الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المطعم</TableHead>
                  <TableHead className="text-right">رقم العميل</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الاشتراك</TableHead>
                  <TableHead className="text-right">الميزات</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestaurants?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد مطاعم
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRestaurants?.map((restaurant) => {
                    const isActive = restaurant.features?.is_active ?? true;
                    return (
                      <TableRow key={restaurant.user_id} className={!isActive ? "opacity-50" : ""}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{restaurant.business_name}</p>
                            <p className="text-sm text-muted-foreground">{restaurant.full_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{restaurant.customer_code || "-"}</Badge>
                        </TableCell>
                        <TableCell>
                          {isActive ? (
                            <Badge className="bg-green-500 text-white">
                              <Power className="h-3 w-3 ml-1" />
                              نشط
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <PowerOff className="h-3 w-3 ml-1" />
                              معطل
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getSubscriptionBadge(restaurant.features?.subscription_type || "basic")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getFeatureCount(restaurant)} ميزات</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(restaurant)}
                            >
                              <Settings2 className="h-4 w-4 ml-1" />
                              إدارة
                            </Button>
                            <Button
                              variant={isActive ? "destructive" : "default"}
                              size="sm"
                              onClick={() => handleToggleActive(restaurant)}
                              disabled={toggleActive.isPending}
                            >
                              {isActive ? (
                                <>
                                  <PowerOff className="h-4 w-4 ml-1" />
                                  تعطيل
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 ml-1" />
                                  تفعيل
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Features Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              إدارة ميزات: {selectedRestaurant?.business_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* حالة الحساب */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Power className="h-5 w-5 text-green-500" />
                <div>
                  <Label className="text-base font-medium">حالة الحساب</Label>
                  <p className="text-sm text-muted-foreground">
                    تعطيل الحساب يمنع المطعم من الوصول لأي ميزة
                  </p>
                </div>
              </div>
              <Switch
                checked={editedFeatures.is_active ?? true}
                onCheckedChange={(checked) =>
                  setEditedFeatures({ ...editedFeatures, is_active: checked })
                }
              />
            </div>

            {/* نوع الاشتراك */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                نوع الاشتراك
              </Label>
              <Select
                value={editedFeatures.subscription_type || "basic"}
                onValueChange={(value) =>
                  setEditedFeatures({ ...editedFeatures, subscription_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subscriptionTypes.map((sub) => (
                    <SelectItem key={sub.value} value={sub.value}>
                      {sub.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* تاريخ انتهاء الاشتراك */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                تاريخ انتهاء الاشتراك
              </Label>
              <Input
                type="date"
                value={editedFeatures.subscription_end_date?.split("T")[0] || ""}
                onChange={(e) =>
                  setEditedFeatures({
                    ...editedFeatures,
                    subscription_end_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
              />
            </div>

            {/* الميزات */}
            <div className="space-y-4">
              <h4 className="font-medium text-lg">الميزات المتاحة</h4>

              <div className="grid gap-4">
                {/* إمكانية الطلب */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="font-medium">إمكانية الطلب</Label>
                      <p className="text-sm text-muted-foreground">السماح للمطعم بإنشاء طلبات</p>
                    </div>
                  </div>
                  <Switch
                    checked={editedFeatures.can_order ?? true}
                    onCheckedChange={(checked) =>
                      setEditedFeatures({ ...editedFeatures, can_order: checked })
                    }
                  />
                </div>

                {/* القوالب */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <Label className="font-medium">قوالب الطلبات</Label>
                      <p className="text-sm text-muted-foreground">حفظ واستخدام قوالب للطلبات المتكررة</p>
                    </div>
                  </div>
                  <Switch
                    checked={editedFeatures.can_use_templates ?? false}
                    onCheckedChange={(checked) =>
                      setEditedFeatures({ ...editedFeatures, can_use_templates: checked })
                    }
                  />
                </div>

                {/* الفروع */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-orange-500" />
                    <div>
                      <Label className="font-medium">إدارة الفروع</Label>
                      <p className="text-sm text-muted-foreground">إضافة وإدارة فروع متعددة</p>
                    </div>
                  </div>
                  <Switch
                    checked={editedFeatures.can_use_branches ?? false}
                    onCheckedChange={(checked) =>
                      setEditedFeatures({ ...editedFeatures, can_use_branches: checked })
                    }
                  />
                </div>

                {/* المفضلة */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-red-500" />
                    <div>
                      <Label className="font-medium">المفضلة</Label>
                      <p className="text-sm text-muted-foreground">حفظ المنتجات والموردين في المفضلة</p>
                    </div>
                  </div>
                  <Switch
                    checked={editedFeatures.can_use_favorites ?? true}
                    onCheckedChange={(checked) =>
                      setEditedFeatures({ ...editedFeatures, can_use_favorites: checked })
                    }
                  />
                </div>

                {/* التحليلات */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    <div>
                      <Label className="font-medium">التحليلات والإحصائيات</Label>
                      <p className="text-sm text-muted-foreground">عرض تقارير وإحصائيات مفصلة</p>
                    </div>
                  </div>
                  <Switch
                    checked={editedFeatures.can_view_analytics ?? false}
                    onCheckedChange={(checked) =>
                      setEditedFeatures({ ...editedFeatures, can_view_analytics: checked })
                    }
                  />
                </div>

                {/* الأسعار المخصصة */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-purple-500" />
                    <div>
                      <Label className="font-medium">الأسعار المخصصة</Label>
                      <p className="text-sm text-muted-foreground">عرض الأسعار المخصصة من الموردين</p>
                    </div>
                  </div>
                  <Switch
                    checked={editedFeatures.can_use_custom_prices ?? false}
                    onCheckedChange={(checked) =>
                      setEditedFeatures({ ...editedFeatures, can_use_custom_prices: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* الحد الأقصى للطلبات */}
            <div className="space-y-2">
              <Label>الحد الأقصى للطلبات شهرياً (اتركه فارغاً لعدد غير محدود)</Label>
              <Input
                type="number"
                min="0"
                placeholder="غير محدود"
                value={editedFeatures.max_orders_per_month ?? ""}
                onChange={(e) =>
                  setEditedFeatures({
                    ...editedFeatures,
                    max_orders_per_month: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </div>

            {/* ملاحظات */}
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                placeholder="ملاحظات خاصة بهذا المطعم..."
                value={editedFeatures.notes ?? ""}
                onChange={(e) =>
                  setEditedFeatures({ ...editedFeatures, notes: e.target.value || null })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveFeatures} disabled={updateFeatures.isPending}>
              {updateFeatures.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ التغييرات"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRestaurantFeaturesManager;
