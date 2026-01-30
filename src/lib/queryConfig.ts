// Query configuration for React Query optimization
// Centralized staleTime and gcTime settings

export const QUERY_STALE_TIMES = {
  // Static data that rarely changes
  STATIC: 10 * 60 * 1000, // 10 minutes
  
  // Semi-static data (categories, regions, site settings)
  SEMI_STATIC: 5 * 60 * 1000, // 5 minutes
  
  // User-specific data (profile, favorites)
  USER_DATA: 2 * 60 * 1000, // 2 minutes
  
  // Dynamic data (orders, products)
  DYNAMIC: 30 * 1000, // 30 seconds
  
  // Real-time data (notifications, stats)
  REALTIME: 15 * 1000, // 15 seconds
} as const;

export const QUERY_GC_TIMES = {
  // Keep static data longer in cache
  STATIC: 30 * 60 * 1000, // 30 minutes
  
  // Standard cache time
  STANDARD: 10 * 60 * 1000, // 10 minutes
  
  // Short-lived cache
  SHORT: 5 * 60 * 1000, // 5 minutes
} as const;

// Default query options for different types of data
export const staticQueryOptions = {
  staleTime: QUERY_STALE_TIMES.STATIC,
  gcTime: QUERY_GC_TIMES.STATIC,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
};

export const semiStaticQueryOptions = {
  staleTime: QUERY_STALE_TIMES.SEMI_STATIC,
  gcTime: QUERY_GC_TIMES.STANDARD,
  refetchOnWindowFocus: false,
};

export const userDataQueryOptions = {
  staleTime: QUERY_STALE_TIMES.USER_DATA,
  gcTime: QUERY_GC_TIMES.STANDARD,
  refetchOnWindowFocus: false,
};

export const dynamicQueryOptions = {
  staleTime: QUERY_STALE_TIMES.DYNAMIC,
  gcTime: QUERY_GC_TIMES.SHORT,
};

export const realtimeQueryOptions = {
  staleTime: QUERY_STALE_TIMES.REALTIME,
  gcTime: QUERY_GC_TIMES.SHORT,
};
