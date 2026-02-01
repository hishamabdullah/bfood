import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, User, LogOut, Package, Heart, MapPin, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import NotificationBell from "./NotificationBell";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userRole, profile, signOut } = useAuth();
  const { getItemCount } = useCart();
  const { data: siteSettings } = useSiteSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const itemCount = getItemCount();
  
  const isSupplier = userRole === "supplier";
  const isRestaurant = userRole === "restaurant";

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      // Force page reload to clear all state - this always runs
      window.location.href = "/";
    }
  };

  const headerLogoUrl = siteSettings?.header_logo_url;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo - goes to dashboard if logged in, otherwise home */}
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          {headerLogoUrl ? (
            <img 
              src={headerLogoUrl} 
              alt="BFOOD" 
              className="h-10 w-10 rounded-xl object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <span className="text-xl font-bold text-primary-foreground leading-none">B</span>
            </div>
          )}
          <span className="text-xl font-bold text-foreground">BFOOD</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {/* المطعم فقط يرى المنتجات والموردين وطلباتي وإدارة الفروع */}
          {isRestaurant && (
            <>
              <Link to="/products" className="text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.products")}
              </Link>
              <Link to="/suppliers" className="text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.suppliers")}
              </Link>
              <Link to="/orders" className="text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.myOrders")}
              </Link>
              <Link to="/branches" className="text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.branches")}
              </Link>
              <Link to="/templates" className="text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.templates")}
              </Link>
            </>
          )}
          {/* المورد يرى فقط لوحة التحكم */}
          {isSupplier && (
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.dashboard")}
            </Link>
          )}
          {/* غير المسجلين لا يرون أي روابط */}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />
          
          {/* جرس الإشعارات للموردين */}
          {isSupplier && <NotificationBell />}
          
          {isRestaurant && (
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-secondary text-xs text-secondary-foreground flex items-center justify-center">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" />
                  {profile?.full_name || t("common.profile")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    {t("nav.dashboard")}
                  </Link>
                </DropdownMenuItem>
                {isRestaurant && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="cursor-pointer">
                        <Package className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {t("nav.myOrders")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favorites" className="cursor-pointer">
                        <Heart className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {t("nav.favorites")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/templates" className="cursor-pointer">
                        <FileText className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {t("nav.templates")}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    {t("common.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t("common.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline">{t("common.login")}</Button>
              </Link>
              <Link to="/register">
                <Button variant="hero">{t("common.register")}</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="md:hidden flex items-center gap-2">
          {/* Language Switcher */}
          <LanguageSwitcher />
          
          {/* جرس الإشعارات للموردين */}
          {isSupplier && <NotificationBell />}
          
          {/* السلة للمطاعم */}
          {isRestaurant && (
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-secondary text-xs text-secondary-foreground flex items-center justify-center">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Button>
            </Link>
          )}
          
          {/* Mobile Menu Button */}
          <button
            className="p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <nav className="container py-4 flex flex-col gap-4">
            {/* المطعم فقط يرى المنتجات والموردين وطلباتي وإدارة الفروع */}
            {isRestaurant && (
              <>
                <Link 
                  to="/products" 
                  className="py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("nav.products")}
                </Link>
                <Link 
                  to="/suppliers" 
                  className="py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("nav.suppliers")}
                </Link>
                <Link 
                  to="/orders" 
                  className="py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("nav.myOrders")}
                </Link>
                <Link 
                  to="/branches" 
                  className="py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("nav.branches")}
                </Link>
                <Link 
                  to="/templates" 
                  className="py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("nav.templates")}
                </Link>
              </>
            )}
            {/* المورد يرى فقط لوحة التحكم */}
            {isSupplier && (
              <Link 
                to="/dashboard" 
                className="py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.dashboard")}
              </Link>
            )}
            
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">{t("nav.dashboard")}</Button>
                  </Link>
                  {isRestaurant && (
                    <>
                      <Link to="/orders" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full gap-2">
                          <Package className="h-4 w-4" />
                          {t("nav.myOrders")}
                        </Button>
                      </Link>
                      <Link to="/favorites" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full gap-2">
                          <Heart className="h-4 w-4" />
                          {t("nav.favorites")}
                        </Button>
                      </Link>
                      <Link to="/templates" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full gap-2">
                          <FileText className="h-4 w-4" />
                          {t("nav.templates")}
                        </Button>
                      </Link>
                    </>
                  )}
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">{t("common.profile")}</Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full text-destructive"
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                    {t("common.logout")}
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">{t("common.login")}</Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="hero" className="w-full">{t("common.register")}</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
