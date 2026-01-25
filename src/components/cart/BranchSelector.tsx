 import { useState } from "react";
 import { useTranslation } from "react-i18next";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
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
     if (value === "add_new") {
       setIsAddDialogOpen(true);
       return;
     }
 
     const branch = branches.find((b) => b.id === value);
     if (branch) {
       const address = branch.google_maps_url || branch.address || "";
       onBranchChange(branch.id, address);
     }
   };
 
   const selectedBranch = branches.find((b) => b.id === selectedBranchId);
 
   return (
     <div className="space-y-3">
       <div>
         <Label className="flex items-center gap-2 mb-2">
           <Building2 className="h-4 w-4" />
           {t("cart.deliveryBranch")}
         </Label>
 
         {isLoading ? (
           <div className="h-10 bg-muted animate-pulse rounded-md" />
         ) : (
           <Select value={selectedBranchId} onValueChange={handleBranchSelect}>
             <SelectTrigger className="w-full bg-background">
               <SelectValue placeholder={t("cart.selectBranch")} />
             </SelectTrigger>
             <SelectContent className="bg-popover border border-border shadow-lg z-50">
               {branches.map((branch) => (
                 <SelectItem key={branch.id} value={branch.id} className="cursor-pointer">
                   <div className="flex items-center gap-2">
                     <span>{branch.name}</span>
                     {branch.is_default && (
                       <span className="text-xs text-muted-foreground">
                         ({t("common.default") || "افتراضي"})
                       </span>
                     )}
                   </div>
                 </SelectItem>
               ))}
               
               {/* إضافة فرع جديد - آخر خيار */}
               <SelectItem value="add_new" className="cursor-pointer text-primary border-t border-border mt-1 pt-2">
                 <div className="flex items-center gap-2">
                   <Plus className="h-4 w-4" />
                   <span>{t("cart.addNewBranch")}</span>
                 </div>
               </SelectItem>
             </SelectContent>
           </Select>
         )}
       </div>
 
       {/* عرض تفاصيل الفرع المختار */}
       {!isLoading && selectedBranch && (
         <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
           {selectedBranch.address && (
             <p className="flex items-center gap-2 text-muted-foreground">
               <MapPin className="h-4 w-4 shrink-0" />
               <span>{selectedBranch.address}</span>
             </p>
           )}
           {selectedBranch.google_maps_url && (
             <a
               href={selectedBranch.google_maps_url}
               target="_blank"
               rel="noopener noreferrer"
               className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
             >
               <MapPin className="h-3 w-3" />
               {t("cart.viewOnMap")}
             </a>
           )}
         </div>
       )}
 
       {/* حقل العنوان اليدوي - يظهر فقط إذا لم تكن هناك فروع */}
       {!isLoading && branches.length === 0 && (
         <div>
           <Label className="mb-2 block text-sm">
             {t("cart.deliveryAddress")}
           </Label>
           <Input
             placeholder={t("cart.enterAddressOrLink")}
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
     </div>
   );
 };
