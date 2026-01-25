 import { useState } from "react";
 import { useTranslation } from "react-i18next";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Button } from "@/components/ui/button";
 import { Card } from "@/components/ui/card";
 import { useBranches } from "@/hooks/useBranches";
 import { BranchFormDialog } from "@/components/branches/BranchFormDialog";
 import { Building2, Plus, MapPin } from "lucide-react";
 
 interface BranchSelectorProps {
   selectedBranchId: string;
   onBranchChange: (branchId: string, address: string) => void;
   customAddress: string;
   onCustomAddressChange: (address: string) => void;
 }
 
 export const BranchSelector = ({
   selectedBranchId,
   onBranchChange,
   customAddress,
   onCustomAddressChange,
 }: BranchSelectorProps) => {
   const { t } = useTranslation();
   const { data: branches = [], isLoading } = useBranches();
   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
 
   const handleBranchSelect = (value: string) => {
     const branch = branches.find((b) => b.id === value);
     if (branch) {
       const address = branch.google_maps_url || branch.address || "";
       onBranchChange(branch.id, address);
     }
   };
 
   if (isLoading) {
     return (
       <Card className="p-4">
         <div className="animate-pulse space-y-3">
           <div className="h-4 w-24 bg-muted rounded" />
           <div className="h-10 bg-muted rounded" />
         </div>
       </Card>
     );
   }
 
   const selectedBranch = branches.find((b) => b.id === selectedBranchId);
 
   return (
     <Card className="p-4 space-y-4">
       <div>
         <Label className="flex items-center gap-2 mb-3 text-base font-semibold">
           <Building2 className="h-5 w-5 text-primary" />
           {t("cart.deliveryBranch") || "فرع التوصيل"}
         </Label>
 
         {branches.length > 0 ? (
           <div className="flex gap-2">
             <Select value={selectedBranchId} onValueChange={handleBranchSelect}>
               <SelectTrigger className="flex-1 bg-background">
                 <SelectValue placeholder={t("cart.selectBranch") || "اختر فرع التوصيل"} />
               </SelectTrigger>
               <SelectContent className="bg-popover border border-border shadow-lg z-50">
                 {branches.map((branch) => (
                   <SelectItem key={branch.id} value={branch.id} className="cursor-pointer">
                     <div className="flex items-center gap-2">
                       <Building2 className="h-4 w-4 text-muted-foreground" />
                       <span className="font-medium">{branch.name}</span>
                       {branch.is_default && (
                         <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                           {t("common.default") || "افتراضي"}
                         </span>
                       )}
                     </div>
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
 
             <Button
               type="button"
               variant="outline"
               size="icon"
               onClick={() => setIsAddDialogOpen(true)}
               className="shrink-0"
               title={t("cart.addNewBranch") || "إضافة فرع جديد"}
             >
               <Plus className="h-5 w-5" />
             </Button>
           </div>
         ) : (
           <div className="space-y-3">
             <div className="p-3 rounded-lg bg-muted/50 border border-dashed border-border text-center text-sm text-muted-foreground">
               {t("cart.noBranches") || "لا توجد فروع محفوظة"}
             </div>
             <Button
               type="button"
               variant="outline"
               onClick={() => setIsAddDialogOpen(true)}
               className="w-full"
             >
               <Plus className="h-4 w-4 ml-2" />
               {t("cart.addNewBranch") || "إضافة فرع جديد"}
             </Button>
           </div>
         )}
       </div>
 
       {selectedBranch && (
         <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
           <p className="text-sm font-semibold text-foreground">{selectedBranch.name}</p>
           {selectedBranch.address && (
             <p className="text-sm text-muted-foreground flex items-start gap-2">
               <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
               <span>{selectedBranch.address}</span>
             </p>
           )}
           {selectedBranch.google_maps_url && (
             <a
               href={selectedBranch.google_maps_url}
               target="_blank"
               rel="noopener noreferrer"
               className="text-sm text-primary hover:underline inline-flex items-center gap-1"
             >
               <MapPin className="h-3 w-3" />
               {t("cart.viewOnMap") || "عرض على الخريطة"}
             </a>
           )}
         </div>
       )}
 
       {!selectedBranchId && branches.length === 0 && (
         <div>
           <Label className="mb-2 block text-sm font-medium">
             {t("cart.deliveryAddress") || "عنوان التوصيل"}
           </Label>
           <Input
             placeholder={t("cart.enterAddressOrLink") || "أدخل رابط قوقل ماب أو العنوان"}
             value={customAddress}
             onChange={(e) => onCustomAddressChange(e.target.value)}
             className="bg-background"
             dir="ltr"
           />
         </div>
       )}
 
       <BranchFormDialog
         open={isAddDialogOpen}
         onOpenChange={setIsAddDialogOpen}
         branch={null}
       />
     </Card>
   );
 };
