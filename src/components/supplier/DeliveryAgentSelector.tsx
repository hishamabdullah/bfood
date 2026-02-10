import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Truck, UserRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useDeliveryAgents, useAssignDeliveryAgent } from "@/hooks/useDeliveryAgents";

interface DeliveryAgentSelectorProps {
  orderId: string;
  supplierId: string;
  currentDeliveryType?: string;
  currentAgentId?: string | null;
  currentAgentName?: string | null;
}

export default function DeliveryAgentSelector({
  orderId,
  supplierId,
  currentDeliveryType = "self",
  currentAgentId,
  currentAgentName,
}: DeliveryAgentSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState(currentDeliveryType);
  const [agentId, setAgentId] = useState<string>(currentAgentId || "");
  const { data: agents, isLoading } = useDeliveryAgents(true);
  const assignAgent = useAssignDeliveryAgent();

  useEffect(() => {
    setDeliveryType(currentDeliveryType);
    setAgentId(currentAgentId || "");
  }, [currentDeliveryType, currentAgentId]);

  const handleSave = async () => {
    await assignAgent.mutateAsync({
      orderId,
      supplierId,
      deliveryType: deliveryType as "self" | "agent",
      deliveryAgentId: deliveryType === "agent" ? agentId : null,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Truck className="h-3 w-3" />
          {currentDeliveryType === "agent" && currentAgentName
            ? `مندوب: ${currentAgentName}`
            : "طريقة التوصيل"}
          {currentDeliveryType === "agent" && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">مندوب</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>اختيار طريقة التوصيل</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <RadioGroupItem value="self" id="self" />
              <Label htmlFor="self" className="flex items-center gap-2 cursor-pointer flex-1">
                <Truck className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">توصيل ذاتي</p>
                  <p className="text-xs text-muted-foreground">توصيل الطلب بنفسك</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <RadioGroupItem value="agent" id="agent" />
              <Label htmlFor="agent" className="flex items-center gap-2 cursor-pointer flex-1">
                <UserRound className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">توصيل مندوب</p>
                  <p className="text-xs text-muted-foreground">تعيين مندوب توصيل خارجي</p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {deliveryType === "agent" && (
            <div>
              <Label className="mb-2 block">اختر المندوب</Label>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : agents?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا يوجد مناديب متاحين
                </p>
              ) : (
                <Select value={agentId} onValueChange={setAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مندوب التوصيل" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents?.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <span>{agent.name}</span>
                          {agent.phone && (
                            <span className="text-xs text-muted-foreground" dir="ltr">
                              ({agent.phone})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={
              assignAgent.isPending ||
              (deliveryType === "agent" && !agentId)
            }
            className="w-full"
          >
            {assignAgent.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            حفظ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
