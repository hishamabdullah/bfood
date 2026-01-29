import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/withTimeout";
import { firstOrNull } from "@/contexts/auth/normalize";
import { waitForAuthReady } from "@/contexts/auth/waitForAuthReady";

// مفاتيح التخزين المؤقت
const CACHE_KEYS = {
  PROFILE: "lovable_user_profile",
  ROLE: "lovable_user_role",
  USER_ID: "lovable_user_id",
  IS_APPROVED: "lovable_is_approved",
  CACHED_AT: "lovable_user_cached_at",
} as const;

// مدة صلاحية الكاش لتقليل استدعاءات الـ API (مع إبقاء عرض البيانات فوراً)
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

// حفظ البيانات في sessionStorage
const saveToCache = (userId: string, role: string | null, profile: any, isApproved: boolean) => {
  try {
    sessionStorage.setItem(CACHE_KEYS.USER_ID, userId);
    if (role) sessionStorage.setItem(CACHE_KEYS.ROLE, role);
    else sessionStorage.removeItem(CACHE_KEYS.ROLE);

    if (profile) sessionStorage.setItem(CACHE_KEYS.PROFILE, JSON.stringify(profile));
    else sessionStorage.removeItem(CACHE_KEYS.PROFILE);

    sessionStorage.setItem(CACHE_KEYS.IS_APPROVED, String(isApproved));
    sessionStorage.setItem(CACHE_KEYS.CACHED_AT, String(Date.now()));
  } catch {
    // تجاهل أخطاء التخزين
  }
};

// قراءة البيانات من sessionStorage
const loadFromCache = (userId: string) => {
  try {
    const cachedUserId = sessionStorage.getItem(CACHE_KEYS.USER_ID);
    if (cachedUserId !== userId) return null;

    const role = sessionStorage.getItem(CACHE_KEYS.ROLE);
    const profileStr = sessionStorage.getItem(CACHE_KEYS.PROFILE);
    const isApproved = sessionStorage.getItem(CACHE_KEYS.IS_APPROVED) === "true";
    const profile = profileStr ? JSON.parse(profileStr) : null;

    const cachedAtRaw = sessionStorage.getItem(CACHE_KEYS.CACHED_AT);
    const cachedAt = cachedAtRaw ? Number(cachedAtRaw) : 0;
    const isStale = !cachedAt || Date.now() - cachedAt > CACHE_TTL_MS;

    return { role, profile, isApproved, cachedAt, isStale };
  } catch {
    return null;
  }
};

// مسح التخزين المؤقت
const clearCache = () => {
  try {
    Object.values(CACHE_KEYS).forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // تجاهل
  }
};

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
  // مسح الكاش أيضاً
  clearCache();
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
    city?: string;
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

  // Allow a single auto-retry per user (helps transient refresh auth hydration issues)
  const hasAutoRetriedRef = useRef<Record<string, boolean>>({});

  // Cache لمنع جلب البيانات المكررة - استخدام useRef لتجنب إعادة إنشاء الدالة
  const lastFetchedUserIdRef = useRef<string | null>(null);

  const SESSION_TIMEOUT_MS = 3000;
  const USERDATA_TIMEOUT_MS = 10000;

  const fetchUserData = useCallback(async (userId: string, force = false): Promise<void> => {
    // تخطي إذا كانت البيانات موجودة مسبقاً (ما لم يكن force)
    if (!force && lastFetchedUserIdRef.current === userId) {
      return;
    }

    // جلب البيانات من الكاش أولاً للعرض الفوري (حتى لو force=true)
    const cachedData = loadFromCache(userId);
    if (cachedData) {
      if (cachedData.role) setUserRole(cachedData.role as UserRole);
      setIsApproved(Boolean(cachedData.isApproved));
      if (cachedData.profile) setProfile(cachedData.profile);
      lastFetchedUserIdRef.current = userId;

      // إذا الكاش حديث وما فيه force، لا داعي لطلب API الآن
      if (!force && cachedData.isStale === false) {
        return;
      }
      // وإلا نكمل طلب بيانات حديثة من الخادم (قد تكون بطيئة بعد Refresh)
    }

    try {
      // ✅ Fix: after Refresh, wait briefly for the persisted session to be fully ready
      // before running PostgREST queries that depend on the auth header.
      await waitForAuthReady(userId);

      const [roleResult, profileResult] = await withTimeout(
        Promise.all([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("full_name, business_name, phone, avatar_url, is_approved")
            .eq("user_id", userId)
            .maybeSingle(),
        ]),
        USERDATA_TIMEOUT_MS,
        "fetchUserData timeout"
      );

      if (roleResult.error) throw roleResult.error;
      if (profileResult.error) throw profileResult.error;

      // بعض بيئات PostgREST قد تُرجع data كمصفوفة حتى مع maybeSingle.
      // نطبّعها هنا لضمان أن role/profile لا تبقى null بعد Refresh.
      const roleData = firstOrNull<any>((roleResult as any).data);
      const profileData = firstOrNull<any>((profileResult as any).data);

      let approved = false;
      let fetchedRole: UserRole | null = null;
      
      if (roleData?.role) {
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
      // لا نُثبّت الكاش إلا إذا نجحت الاستعلامات
      lastFetchedUserIdRef.current = userId;
      
      const newProfile = profileData
        ? {
            full_name: profileData.full_name ?? "",
            business_name: profileData.business_name ?? "",
            phone: profileData.phone ?? null,
            avatar_url: profileData.avatar_url ?? null,
          }
        : null;

      // حدّث الحالة حتى لو null لضمان عدم بقاء بيانات قديمة/ناقصة.
      setProfile(newProfile);

      // حفظ البيانات في الكاش للاستخدام عند التحديث
      saveToCache(userId, fetchedRole, newProfile, approved);
    } catch (error) {
      // لا نثبت الكاش عند الفشل حتى نسمح بإعادة المحاولة
      lastFetchedUserIdRef.current = null;
      console.error("Error fetching user data:", error);

      // ✅ Auto-retry once (covers transient 401/permission issues during refresh hydration)
      if (!hasAutoRetriedRef.current[userId]) {
        hasAutoRetriedRef.current[userId] = true;
        setTimeout(() => {
          fetchUserData(userId, true).catch(() => {
            // ignore
          });
        }, 700);
      }
    }
  }, []);

  useEffect(() => {
    if (initialized) return;
    
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      // حماية: إنهاء التحميل بعد 5 ثوان كحد أقصى
      timeoutId = setTimeout(() => {
        if (isMounted && !initialized) {
          console.warn("Auth initialization timeout - forcing completion");
          setLoading(false);
          setInitialized(true);

          // محاولة خلفية سريعة لمزامنة بيانات المستخدم (بدون تعليق الواجهة)
          withTimeout(supabase.auth.getSession(), 2000, "getSession (fallback) timeout")
            .then(({ data }) => {
              const fallbackUser = data.session?.user;
              if (fallbackUser) {
                fetchUserData(fallbackUser.id, true);
              }
            })
            .catch(() => {
              // ignore
            });
        }
      }, 5000);

      try {
        let initialSession: Session | null = null;
        try {
          const sessionResult = await withTimeout(
            supabase.auth.getSession(),
            SESSION_TIMEOUT_MS,
            "getSession timeout"
          );
          initialSession = sessionResult.data.session ?? null;
        } catch (sessionError) {
          console.warn("Auth getSession timed out:", sessionError);
        }
        
        if (!isMounted) return;
        
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          // ★ جلب البيانات من الكاش فوراً للعرض السريع
          const cachedData = loadFromCache(initialSession.user.id);
          if (cachedData) {
            if (cachedData.role) setUserRole(cachedData.role as UserRole);
            setIsApproved(Boolean(cachedData.isApproved));
            if (cachedData.profile) {
              setProfile(cachedData.profile);
            }
          }
          
          try {
            // جلب البيانات الحديثة من الخادم
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
          lastFetchedUserIdRef.current = null;
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
      city?: string;
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
            city: userData.city || null,
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
        const newProfile = {
          full_name: userData.fullName,
          business_name: userData.businessName,
          phone: userData.phone,
          avatar_url: null,
        };
        setProfile(newProfile);
        // الموردين معتمدون تلقائياً، المطاعم تحتاج موافقة
        const approved = userData.role === "supplier";
        setIsApproved(approved);

        // احفظ في الكاش لتظهر البيانات فوراً بعد أي Refresh
        lastFetchedUserIdRef.current = data.user.id;
        saveToCache(data.user.id, userData.role, newProfile, approved);
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
          new Promise<void>((resolve) => setTimeout(resolve, 8000))
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
