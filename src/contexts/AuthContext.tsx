import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const clearAuthStorage = () => {
  // Ensure persisted sessions are cleared even if the network sign-out hangs.
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key) continue;
      const isSupabaseAuthTokenKey = key.startsWith("sb-") && key.endsWith("-auth-token");
      if (isSupabaseAuthTokenKey || key === "supabase.auth.token") {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage errors (e.g., in private mode)
  }
};

type UserRole = "admin" | "restaurant" | "supplier";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  isApproved: boolean;
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
    region?: string;
    supplyCategories?: string[];
  }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Cache لمنع جلب البيانات المكررة
  const [lastFetchedUserId, setLastFetchedUserId] = useState<string | null>(null);

  const fetchUserData = useCallback(async (userId: string, force = false): Promise<void> => {
    // تخطي إذا كانت البيانات موجودة مسبقاً (ما لم يكن force)
    if (!force && lastFetchedUserId === userId && userRole !== null) {
      return;
    }

    try {
      const [roleResult, profileResult] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name, business_name, phone, avatar_url, is_approved")
          .eq("user_id", userId)
          .maybeSingle()
      ]);

      const { data: roleData } = roleResult;
      const { data: profileData } = profileResult;

      let approved = false;
      let fetchedRole: UserRole | null = null;
      
      if (roleData) {
        fetchedRole = roleData.role as UserRole;
        if (fetchedRole === "admin" || fetchedRole === "supplier") {
          approved = true;
        }
      }

      if (profileData) {
        if (fetchedRole === "restaurant") {
          approved = profileData.is_approved === true;
        } else if (fetchedRole === "admin" || fetchedRole === "supplier") {
          approved = true;
        }
      }
      
      setUserRole(fetchedRole);
      setIsApproved(approved);
      setLastFetchedUserId(userId);
      
      if (profileData) {
        setProfile({
          full_name: profileData.full_name,
          business_name: profileData.business_name,
          phone: profileData.phone,
          avatar_url: profileData.avatar_url,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, [lastFetchedUserId, userRole]);

  useEffect(() => {
    if (initialized) return;
    
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      // حماية: إنهاء التحميل بعد 5 ثوان كحد أقصى (بدلاً من 10)
      timeoutId = setTimeout(() => {
        if (isMounted && !initialized) {
          console.warn("Auth initialization timeout - forcing completion");
          setLoading(false);
          setInitialized(true);
        }
      }, 5000);

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          try {
            await fetchUserData(initialSession.user.id, true);
          } catch (fetchError) {
            console.error("Error fetching user data:", fetchError);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        // دائماً أنهي التحميل حتى لو حدث خطأ
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(false);
          setInitialized(true);
        }
      }
    };
    
    initializeAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;
        
        // تخطي إذا كنا في منتصف عملية تسجيل الدخول
        if (isSigningIn) return;
        
        // تخطي إذا كان نفس المستخدم (لمنع التكرار)
        if (newSession?.user?.id === user?.id && event !== 'SIGNED_OUT') {
          return;
        }
        
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          try {
            // استخدم force=true فقط إذا تغير المستخدم
            await fetchUserData(newSession.user.id, true);
          } catch (fetchError) {
            console.error("Error fetching user data on auth change:", fetchError);
          }
        } else {
          setUserRole(null);
          setProfile(null);
          setIsApproved(false);
          setLastFetchedUserId(null);
        }
        
        // دائماً أنهي التحميل
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [initialized, fetchUserData, isSigningIn]);

  const signUp = async (
    email: string,
    password: string,
    userData: {
      fullName: string;
      businessName: string;
      phone: string;
      role: UserRole;
      region?: string;
      supplyCategories?: string[];
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
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            user_id: data.user.id,
            full_name: userData.fullName,
            business_name: userData.businessName,
            phone: userData.phone,
            region: userData.region || null,
            supply_categories: userData.supplyCategories || null,
          } as any);

        if (profileError) throw profileError;

        // إنشاء الدور
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: data.user.id,
            role: userData.role,
          } as any);

        if (roleError) throw roleError;

        // تحديث الحالة مباشرة بعد التسجيل
        setUserRole(userData.role);
        setProfile({
          full_name: userData.fullName,
          business_name: userData.businessName,
          phone: userData.phone,
          avatar_url: null,
        });
        // الموردين معتمدون تلقائياً، المطاعم تحتاج موافقة
        setIsApproved(userData.role === "supplier");
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsSigningIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        // تحديث الحالة والبيانات بالتوازي لتسريع العملية
        setUser(data.user);
        setSession(data.session);
        
        // جلب البيانات مع timeout للحماية من التعليق
        const fetchWithTimeout = Promise.race([
          fetchUserData(data.user.id),
          new Promise<void>((resolve) => setTimeout(resolve, 3000))
        ]);
        
        await fetchWithTimeout;
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      const signOutPromise = supabase.auth.signOut();
      signOutPromise.catch((error) => {
        console.error("Sign out error:", error);
      });

      // Never let UI hang on sign-out; proceed even if request stalls.
      await Promise.race([
        signOutPromise,
        new Promise<void>((resolve) => setTimeout(resolve, 1500)),
      ]);
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      // Force-clear persisted session locally as a safety net.
      clearAuthStorage();
      setUser(null);
      setSession(null);
      setUserRole(null);
      setProfile(null);
      setIsApproved(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        isApproved,
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
