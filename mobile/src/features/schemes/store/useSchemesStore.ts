import { create } from 'zustand';
import { SchemeCategory, BenefitType, SchemeItem, SchemeFilter } from '../models/schemes.model';

// Lazy MMKV storage interface to keep tests and SSR clean
interface BookmarkStorage {
  getBookmarks(): string[];
  saveBookmarks(ids: string[]): void;
}

class MMKVBookmarkStorage implements BookmarkStorage {
  private key = 'user_bookmarked_scheme_ids';

  getBookmarks(): string[] {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { mmkvStorage } = require('@/core/storage/mmkv');
      const data = mmkvStorage.getString(this.key);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Fallback
    }
    return [];
  }

  saveBookmarks(ids: string[]): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { mmkvStorage } = require('@/core/storage/mmkv');
      mmkvStorage.set(this.key, JSON.stringify(ids));
    } catch {
      // Ignore in non-native test environments
    }
  }
}

const defaultStorage = new MMKVBookmarkStorage();

export interface SchemesState {
  activeTab: 'browse' | 'saved';
  searchQuery: string;
  selectedCategory: SchemeCategory;
  selectedBenefitType: BenefitType;
  selectedJurisdiction: string;
  sortBy: 'relevant' | 'benefit' | 'popular';
  bookmarkedIds: Set<string>;
  isSaveModalVisible: boolean;
  lastSavedSchemeTitle: string;
  serverSchemes: SchemeItem[];
  /** Controls whether the full filter/search list view is shown (vs. Discovery home) */
  isSearching: boolean;

  // Actions
  setActiveTab: (tab: 'browse' | 'saved') => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: SchemeCategory) => void;
  setSelectedBenefitType: (type: BenefitType) => void;
  setSelectedJurisdiction: (jurisdiction: string) => void;
  setSortBy: (sort: 'relevant' | 'benefit' | 'popular') => void;
  setIsSearching: (value: boolean) => void;
  toggleBookmark: (schemeId: string, schemeTitle?: string) => void;
  closeSaveModal: () => void;
  resetFilters: () => void;
  resetToDiscovery: () => void;
  syncServerSchemes: (items: SchemeItem[]) => void;
  getFilteredSchemes: () => SchemeItem[];
  getSavedSchemes: () => SchemeItem[];
}

export function filterSchemesList(
  schemes: SchemeItem[],
  filter: SchemeFilter,
  bookmarkedIds: Set<string>
): SchemeItem[] {
  return schemes
    .map((scheme) => ({
      ...scheme,
      isBookmarked: bookmarkedIds.has(scheme.id),
    }))
    .filter((scheme) => {
      if (filter.category !== 'all' && scheme.category !== filter.category) {
        return false;
      }
      if (filter.benefitType !== 'all' && scheme.benefitType !== filter.benefitType) {
        return false;
      }
      if (filter.query.trim().length > 0) {
        const q = filter.query.toLowerCase().trim();
        const matchTitle = scheme.title.toLowerCase().includes(q);
        const matchMinistry = scheme.ministry.toLowerCase().includes(q);
        const matchSummary = scheme.benefitSummary.toLowerCase().includes(q);
        const matchTags = scheme.tags.some((tag) => tag.toLowerCase().includes(q));
        const matchCat = scheme.category.toLowerCase().includes(q);
        if (!matchTitle && !matchMinistry && !matchSummary && !matchTags && !matchCat) {
          return false;
        }
      }
      if (filter.jurisdiction !== 'All India' && scheme.jurisdiction !== 'All India' && scheme.jurisdiction !== filter.jurisdiction) {
        return false;
      }
      return true;
    });
}

export const useSchemesStore = create<SchemesState>((set, get) => {
  const initialBookmarks = new Set(defaultStorage.getBookmarks());

  return {
    activeTab: 'browse',
    searchQuery: '',
    selectedCategory: 'all',
    selectedBenefitType: 'all',
    selectedJurisdiction: 'All India',
    sortBy: 'relevant',
    bookmarkedIds: initialBookmarks,
    isSaveModalVisible: false,
    lastSavedSchemeTitle: '',
    serverSchemes: [],
    isSearching: false,

    setActiveTab: (activeTab) => set({ activeTab }),

    setSearchQuery: (searchQuery) => set({ searchQuery }),

    setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

    setSelectedBenefitType: (selectedBenefitType) => set({ selectedBenefitType }),

    setSelectedJurisdiction: (selectedJurisdiction) => set({ selectedJurisdiction }),

    setSortBy: (sortBy) => set({ sortBy }),

    setIsSearching: (isSearching) => set({ isSearching }),

    resetToDiscovery: () =>
      set({
        isSearching: false,
        searchQuery: '',
        selectedCategory: 'all',
        selectedBenefitType: 'all',
        selectedJurisdiction: 'All India',
        activeTab: 'browse',
      }),

    toggleBookmark: (schemeId, schemeTitle) => {
      const current = new Set(get().bookmarkedIds);
      const isAdding = !current.has(schemeId);

      if (isAdding) {
        current.add(schemeId);
        defaultStorage.saveBookmarks(Array.from(current));
        set({
          bookmarkedIds: current,
          isSaveModalVisible: true,
          lastSavedSchemeTitle: schemeTitle || 'Scheme',
        });
      } else {
        current.delete(schemeId);
        defaultStorage.saveBookmarks(Array.from(current));
        set({ bookmarkedIds: current });
      }
    },

    closeSaveModal: () => set({ isSaveModalVisible: false }),

    resetFilters: () =>
      set({
        searchQuery: '',
        selectedCategory: 'all',
        selectedBenefitType: 'all',
        selectedJurisdiction: 'All India',
      }),

    syncServerSchemes: (items: SchemeItem[]) => {
      set({ serverSchemes: items });
    },

    getFilteredSchemes: () => {
      const { serverSchemes, searchQuery, selectedCategory, selectedBenefitType, selectedJurisdiction, sortBy, bookmarkedIds } = get();
      return filterSchemesList(
        serverSchemes,
        {
          query: searchQuery,
          category: selectedCategory,
          benefitType: selectedBenefitType,
          jurisdiction: selectedJurisdiction,
          sort: sortBy,
        },
        bookmarkedIds
      );
    },

    getSavedSchemes: () => {
      const { serverSchemes, bookmarkedIds, searchQuery, selectedBenefitType } = get();
      let saved = serverSchemes
        .filter((scheme) => bookmarkedIds.has(scheme.id))
        .map((s) => ({ ...s, isBookmarked: true }));

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        saved = saved.filter(
          (s: SchemeItem) =>
            s.title.toLowerCase().includes(q) ||
            s.ministry.toLowerCase().includes(q) ||
            s.benefitSummary.toLowerCase().includes(q)
        );
      }

      if (selectedBenefitType !== 'all') {
        saved = saved.filter((s: SchemeItem) => s.benefitType === selectedBenefitType);
      }

      return saved;
    },
  };
});
