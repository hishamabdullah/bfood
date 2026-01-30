import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Package, ChevronLeft } from "lucide-react";

interface RestaurantCustomPriceCardProps {
  restaurantId: string;
  businessName: string;
  fullName: string;
  customerCode?: string;
  productCount: number;
}

export default function RestaurantCustomPriceCard({
  restaurantId,
  businessName,
  fullName,
  customerCode,
  productCount,
}: RestaurantCustomPriceCardProps) {
  return (
    <Link to={`/supplier/custom-prices/${restaurantId}`}>
      <Card className="group hover:shadow-md transition-all hover:border-primary/50 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {customerCode && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    {customerCode}
                  </span>
                )}
                <h3 className="font-semibold truncate">
                  {businessName || fullName}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>{productCount} منتج مخصص</span>
              </div>
            </div>

            {/* Badge & Arrow */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="shrink-0">
                {productCount}
              </Badge>
              <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors rtl:rotate-180" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
