import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 300_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Never auto-retry mutations — many are destructive (permanent deletes).
      retry: 0,
    },
  },
});
