import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useHasFeature } from "@/hooks/useRestaurantAccess";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BranchesManager } from "@/components/branches/BranchesManager";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";

const Branches = () => {
  const { t } = useTranslation();
  const { user, userRole, loading, isApproved } = useAuth();
  const { hasFeature, isLoading: featureLoading } = useHasFeature("can_use_branches");
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (userRole !== "restaurant") {
        navigate("/dashboard");
      } else if (!isApproved) {
        navigate("/pending-approval");
      }
    }
  }, [user, loading, userRole, isApproved, navigate]);

  if (loading || featureLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userRole !== "restaurant" || !isApproved) {
    return null;
  }

  // Show feature disabled message
  if (!hasFeature) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("subscription.featureDisabled")}</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t("subscription.branchesDisabled")}
            </p>
            <Link to="/dashboard">
              <Button variant="hero">{t("nav.dashboard")}</Button>
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{t("nav.branches")}</h1>
            <p className="text-muted-foreground">
              أضف وأدر فروع مطعمك لتسهيل عملية التوصيل
            </p>
          </div>
          <BranchesManager />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Branches;
