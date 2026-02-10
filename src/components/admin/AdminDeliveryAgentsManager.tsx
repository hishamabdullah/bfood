import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Edit2, Trash2, Phone, Building2, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useDeliveryAgents,
  useCreateDeliveryAgent,
  useUpdateDeliveryAgent,
  useDeleteDeliveryAgent,
  type DeliveryAgent,
} from "@/hooks/useDeliveryAgents";
import { Loader2 } from "lucide-react";

const emptyForm = {
  name: "",
  phone: "",
  bank_name: "",
  bank_account_name: "",
  bank_iban: "",
  is_active: true,
};

export default function AdminDeliveryAgentsManager() {
  const { t } = useTranslation();
  const { data: agents, isLoading } = useDeliveryAgents();
  const createAgent = useCreateDeliveryAgent();
  const updateAgent = useUpdateDeliveryAgent();
  const deleteAgent = useDeleteDeliveryAgent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<DeliveryAgent | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditingAgent(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (agent: DeliveryAgent) => {
    setEditingAgent(agent);
    setForm({
      name: agent.name,
      phone: agent.phone || "",
      bank_name: agent.bank_name || "",
      bank_account_name: agent.bank_account_name || "",
      bank_iban: agent.bank_iban || "",
      is_active: agent.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;

    if (editingAgent) {
      await updateAgent.mutateAsync({
        id: editingAgent.id,
        ...form,
        phone: form.phone || null,
        bank_name: form.bank_name || null,
        bank_account_name: form.bank_account_name || null,
        bank_iban: form.bank_iban || null,
      });
    } else {
      await createAgent.mutateAsync({
        ...form,
        phone: form.phone || null,
        bank_name: form.bank_name || null,
        bank_account_name: form.bank_account_name || null,
        bank_iban: form.bank_iban || null,
      });
    }
    setDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">مناديب التوصيل</h2>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة مندوب
        </Button>
      </div>

      {agents?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            لا يوجد مناديب توصيل. أضف مندوباً جديداً.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {agents?.map((agent) => (
            <Card key={agent.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                  <Badge variant={agent.is_active ? "default" : "secondary"} className="gap-1">
                    {agent.is_active ? (
                      <><UserCheck className="h-3 w-3" /> نشط</>
                    ) : (
                      <><UserX className="h-3 w-3" /> غير نشط</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {agent.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span dir="ltr">{agent.phone}</span>
                  </div>
                )}
                {agent.bank_name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span>{agent.bank_name}</span>
                  </div>
                )}
                {agent.bank_iban && (
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    IBAN: {agent.bank_iban}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(agent)} className="gap-1">
                    <Edit2 className="h-3 w-3" />
                    تعديل
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-1">
                        <Trash2 className="h-3 w-3" />
                        حذف
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف المندوب</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من حذف المندوب "{agent.name}"؟
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteAgent.mutate(agent.id)}>
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAgent ? "تعديل المندوب" : "إضافة مندوب جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الاسم *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="اسم المندوب"
              />
            </div>
            <div>
              <Label>رقم الجوال</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
            </div>
            <div>
              <Label>اسم البنك</Label>
              <Input
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                placeholder="مثال: الراجحي"
              />
            </div>
            <div>
              <Label>اسم صاحب الحساب</Label>
              <Input
                value={form.bank_account_name}
                onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
                placeholder="اسم صاحب الحساب البنكي"
              />
            </div>
            <div>
              <Label>رقم الآيبان</Label>
              <Input
                value={form.bank_iban}
                onChange={(e) => setForm({ ...form, bank_iban: e.target.value })}
                placeholder="SA..."
                dir="ltr"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>نشط</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!form.name.trim() || createAgent.isPending || updateAgent.isPending}
              className="w-full"
            >
              {(createAgent.isPending || updateAgent.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              )}
              {editingAgent ? "حفظ التعديلات" : "إضافة المندوب"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
