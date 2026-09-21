import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { schemeKeys } from '../keys';
import { PaginatedSchemes, SchemeFilter, SchemeItem } from '../models/schemes.model';
import { schemesApi, CatalogVersionInfo, DeltaSyncResult } from '../repositories/schemes.api';
import { mmkvStorage } from '../../../core/storage/mmkv';

// MMKV keys for last-synced timestamps
export const SYNC_TS_SCHEMES = 'sync_ts_schemes_list';
export const SYNC_TS_CATEGORIES = 'sync_ts_categories_list';

/**
 * Hook to fetch schemes from FastAPI backend with TanStack Query caching.
 * Follows blueprint §5.3: Server state via TanStack Query.
 */
export function useSchemesQuery(filter?: Partial<SchemeFilter>) {
  return useQuery<SchemeItem[], Error>({
    queryKey: schemeKeys.list(filter as unknown as Record<string, unknown>),
    queryFn: async () => {
      const result = await schemesApi.getSchemes(filter);
      if (!result.ok) {
        throw result.error;
      }
      mmkvStorage.set(SYNC_TS_SCHEMES, String(Date.now()));
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
  });
}

/**
 * Infinite query hook for paginated scheme loading and real-time backend search.
 * Loads 50 schemes per page and triggers fetchNextPage on scroll.
 */
export function useInfiniteSchemesQuery(filter?: Partial<SchemeFilter>, pageSize: number = 50) {
  return useInfiniteQuery<PaginatedSchemes, Error>({
    queryKey: schemeKeys.infinite(filter as unknown as Record<string, unknown>),
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const result = await schemesApi.getSchemesPaginated(filter, pageParam as number, pageSize);
      if (!result.ok) {
        throw result.error;
      }
      // Record sync time on first page load
      if ((pageParam as number) === 0) {
        mmkvStorage.set(SYNC_TS_SCHEMES, String(Date.now()));
      }
      return result.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.skip + lastPage.items.length : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single scheme's full details and requirements.
 */
export function useSchemeDetailQuery(idOrSlug: string) {
  return useQuery<SchemeItem, Error>({
    queryKey: schemeKeys.detail(idOrSlug),
    queryFn: async () => {
      const result = await schemesApi.getSchemeById(idOrSlug);
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: Boolean(idOrSlug),
  });
}

/**
 * Hook to fetch live categories with scheme counts.
 * Categories change very rarely (only when admin adds a new scheme category),
 * so we use a 24-hour staleTime matching the backend Valkey TTL.
 */
export function useCategoriesQuery() {
  return useQuery<Array<{ category: string; count: number }>, Error>({
    queryKey: schemeKeys.categories(),
    queryFn: async () => {
      const result = await schemesApi.getCategories();
      if (!result.ok) {
        throw result.error;
      }
      mmkvStorage.set(SYNC_TS_CATEGORIES, String(Date.now()));
      return result.data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours — categories barely ever change
  });
}

/**
 * Hook to check cloud catalog version watermark.
 * Detects if the Cloud Admin has updated schemes.
 */
export function useCatalogVersionQuery() {
  return useQuery<CatalogVersionInfo, Error>({
    queryKey: ['schemes', 'catalog-version'],
    queryFn: async () => {
      const result = await schemesApi.checkCatalogVersion();
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 60 * 1000, // Check once a minute
    refetchOnMount: true,
  });
}

/**
 * Mutation hook to execute delta sync from Cloud into local SQLite.
 */
export function useDeltaSyncMutation() {
  const queryClient = useQueryClient();

  return useMutation<DeltaSyncResult, Error, void>({
    mutationFn: async () => {
      const result = await schemesApi.syncDeltaFromCloud();
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schemeKeys.all });
      queryClient.invalidateQueries({ queryKey: ['schemes', 'catalog-version'] });
    },
  });
}
