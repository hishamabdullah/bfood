import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "restaurant" | "supplier";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  profile: {
    full_name: string;
    business_name: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: {
    fullName: string;
    businessName: string;
    phone: string;
    role: UserRole;
  }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// عميل بدون أنواع للاستعلامات المخصصة (حتى تتحدث الأنواع)
const supabaseUntyped = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // جلب الدور
      const { data: roleData } = await supabaseUntyped
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleData) {
        setUserRole(roleData.role as UserRole);
      }

      // جلب الملف الشخصي
      const { data: profileData } = await supabaseUntyped
        .from("profiles")
        .select("full_name, business_name, phone, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as AuthContextType["profile"]);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    // إعداد مستمع حالة المصادقة أولاً
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // استخدام setTimeout لتجنب deadlock
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // ثم جلب الجلسة الحالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    userData: {
      fullName: string;
      businessName: string;
      phone: string;
      role: UserRole;
    }
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      if (data.user) {
        // إنشاء الملف الشخصي
        const { error: profileError } = await supabaseUntyped
          .from("profiles")
          .insert({
            user_id: data.user.id,
            full_name: userData.fullName,
            business_name: userData.businessName,
            phone: userData.phone,
          });

        if (profileError) throw profileError;

        // إنشاء الدور
        const { error: roleError } = await supabaseUntyped
          .from("user_roles")
          .insert({
            user_id: data.user.id,
            role: userData.role,
          });

        if (roleError) throw roleError;
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
