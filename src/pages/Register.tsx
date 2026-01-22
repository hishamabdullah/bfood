import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Mail, Lock, User, Phone, Store, Truck, Loader2, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { saudiRegions, supplyCategories } from "@/data/saudiRegions";

type UserType = "restaurant" | "supplier";

const Register = () => {
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get("type") as UserType) || "restaurant";
  
  const [userType, setUserType] = useState<UserType>(initialType);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    password: "",
    region: "",
  });

  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
      toast({
        title: "كلمة المرور قصيرة",
        description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (userType === "supplier" && !formData.region) {
      toast({
        title: "المنطقة مطلوبة",
        description: "يرجى اختيار منطقتك",
        variant: "destructive",
      });
      return;
    }

    if (userType === "supplier" && selectedCategories.length === 0) {
      toast({
        title: "مجالات التوريد مطلوبة",
        description: "يرجى اختيار مجال توريد واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(formData.email, formData.password, {
      fullName: formData.name,
      businessName: formData.businessName,
      phone: formData.phone,
      role: userType,
      region: userType === "supplier" ? formData.region : undefined,
      supplyCategories: userType === "supplier" ? selectedCategories : undefined,
    });

    if (error) {
      toast({
        title: "خطأ في التسجيل",
        description: error.message === "User already registered"
          ? "هذا البريد الإلكتروني مسجل مسبقاً"
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "مرحباً بك في BFOOD!",
      });
      navigate("/dashboard");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
            <span className="text-2xl font-bold text-primary-foreground">B</span>
          </div>
          <span className="text-2xl font-bold text-foreground">BFOOD</span>
        </Link>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-elevated p-8 animate-scale-in">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">إنشاء حساب جديد</h1>
            <p className="text-muted-foreground">انضم إلى منصة BFOOD اليوم</p>
          </div>

          {/* User Type Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setUserType("restaurant")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                userType === "restaurant"
                  ? "bg-card shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              disabled={isLoading}
            >
              <Store className="h-5 w-5" />
              مطعم
            </button>
            <button
              type="button"
              onClick={() => setUserType("supplier")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                userType === "supplier"
                  ? "bg-card shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              disabled={isLoading}
            >
              <Truck className="h-5 w-5" />
              مورد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  placeholder="أدخل اسمك الكامل"
                  className="pr-10"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="businessName">
                {userType === "restaurant" ? "اسم المطعم" : "اسم الشركة/المتجر"}
              </Label>
              <div className="relative">
                {userType === "restaurant" ? (
                  <Store className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                ) : (
                  <Truck className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                )}
                <Input
                  id="businessName"
                  name="businessName"
                  placeholder={userType === "restaurant" ? "اسم المطعم" : "اسم الشركة"}
                  className="pr-10"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Supplier Region */}
            {userType === "supplier" && (
              <div className="space-y-2">
                <Label>المنطقة</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <MapPin className="h-5 w-5 text-muted-foreground ml-2" />
                    <SelectValue placeholder="اختر منطقتك" />
                  </SelectTrigger>
                  <SelectContent>
                    {saudiRegions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Supplier Categories */}
            {userType === "supplier" && (
              <div className="space-y-2">
                <Label>مجالات التوريد (اختر واحد أو أكثر)</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                  {supplyCategories.map((category) => (
                    <div key={category} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={category}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                        disabled={isLoading}
                      />
                      <label
                        htmlFor={category}
                        className="text-sm cursor-pointer"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  className="pr-10"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الجوال</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="05XXXXXXXX"
                  className="pr-10"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-10 pl-10"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري إنشاء الحساب...
                </>
              ) : (
                "إنشاء الحساب"
              )}
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-muted-foreground mt-6">
            لديك حساب بالفعل؟{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              سجّل دخولك
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
