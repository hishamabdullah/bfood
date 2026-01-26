import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BranchesManager } from "@/components/branches/BranchesManager";
import { Loader2 } from "lucide-react";

const Branches = () => {
  const { t } = useTranslation();
  const { user, userRole, loading, isApproved } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userRole !== "restaurant" || !isApproved) {
    return null;
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
