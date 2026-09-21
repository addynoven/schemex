import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useSchemesStore } from '../store/useSchemesStore';
import {
  useInfiniteSchemesQuery,
  useCatalogVersionQuery,
  useDeltaSyncMutation,
  SYNC_TS_SCHEMES,
} from '../hooks/useSchemesQuery';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { DiscoveryHeroBanner } from '../components/DiscoveryHeroBanner';
import { CategoryGrid } from '../components/CategoryGrid';
import { SchemeFilterBar } from '../components/SchemeFilterBar';
import { SchemeListItem } from '../components/SchemeListItem';
import { SavedSchemeModal } from '../components/SavedSchemeModal';
import { SavedSummaryBanner } from '../components/SavedSummaryBanner';
import { SearchEmptyState } from '../components/SearchEmptyState';
import { ProfileMenuModal, LogoutConfirmModal, useProfileStore } from '@/features/profile';
import { SchemeFilter } from '../models/schemes.model';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';
import { mmkvStorage } from '@/core/storage/mmkv';

// ─── Last-synced age helper ────────────────────────────────────────────────────

function formatSyncAge(tsMs: number | null): string {
  if (!tsMs) return '';
  const diffMs = Date.now() - tsMs;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function useLastSynced(mmkvKey: string): string {
  const [label, setLabel] = useState(() => {
    const raw = mmkvStorage.getString(mmkvKey);
    return raw ? formatSyncAge(Number(raw)) : '';
  });

  useEffect(() => {
    // Refresh the label every 60 s while screen is mounted
    const interval = setInterval(() => {
      const raw = mmkvStorage.getString(mmkvKey);
      setLabel(raw ? formatSyncAge(Number(raw)) : '');
    }, 60_000);
    return () => clearInterval(interval);
  }, [mmkvKey]);

  return label;
}

interface SchemesScreenProps {
  onOpenProfileMenu?: () => void;
}

export const SchemesScreen: React.FC<SchemesScreenProps> = ({ onOpenProfileMenu }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSearching, setIsSearching] = useState(false);
  const { currentUser } = useAuthStore();
  const lastSyncedLabel = useLastSynced(SYNC_TS_SCHEMES);

  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedBenefitType,
    setSelectedBenefitType,
    selectedJurisdiction,
    setSelectedJurisdiction,
    bookmarkedIds,
    toggleBookmark,
    isSaveModalVisible,
    lastSavedSchemeTitle,
    closeSaveModal,
    syncServerSchemes,
    getSavedSchemes,
    resetFilters,
  } = useSchemesStore();

  // 300ms Debounce for live search
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Construct query filter sent to FastAPI backend
  const queryFilter: SchemeFilter = useMemo(
    () => ({
      query: debouncedQuery,
      category: selectedCategory,
      benefitType: selectedBenefitType,
      jurisdiction: selectedJurisdiction,
      sort: 'relevant',
    }),
    [debouncedQuery, selectedCategory, selectedBenefitType, selectedJurisdiction]
  );

  // Live TanStack Infinite Query: hits backend /schemes?search=...&category=...&state=...
  const {
    data: infiniteData,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteSchemesQuery(queryFilter, 50);

  // Cloud catalog version check & delta sync
  const { data: versionInfo } = useCatalogVersionQuery();
  const { mutateAsync: triggerDeltaSync, isPending: isSyncing } = useDeltaSyncMutation();

  const handleRefresh = async () => {
    try {
      if (versionInfo?.isUpdateAvailable) {
        await triggerDeltaSync();
      }
    } catch {
      // Delta sync error shouldn't block local cache refresh
    }
    await refetch();
  };

  const liveSchemes = useMemo(() => {
    if (!infiniteData?.pages) return [];
    return infiniteData.pages.flatMap((page) => page.items);
  }, [infiniteData]);

  const totalCount = infiniteData?.pages?.[0]?.total ?? liveSchemes.length;

  useEffect(() => {
    if (liveSchemes && liveSchemes.length > 0) {
      syncServerSchemes(liveSchemes);
    }
  }, [liveSchemes, syncServerSchemes]);

  // Schemes to display
  const schemesToDisplay = useMemo(() => {
    if (activeTab === 'saved') {
      const saved = getSavedSchemes();
      if (selectedBenefitType !== 'all') {
        return saved.filter((s) => s.benefitType === selectedBenefitType);
      }
      return saved;
    }
    return liveSchemes || [];
  }, [activeTab, getSavedSchemes, liveSchemes, selectedBenefitType]);

  const savedCount = activeTab === 'saved' ? schemesToDisplay.length : bookmarkedIds.size;

  const handleSchemePress = (schemeId: string) => {
    router.push({
      pathname: '/schemes/[id]',
      params: { id: schemeId },
    });
  };

  const handleCategorySelect = (catId: any) => {
    setSelectedCategory(catId);
    setIsSearching(true);
  };

  const handleBrowseAll = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBenefitType('all');
    setSelectedJurisdiction('All India');
    setIsSearching(true);
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setIsSearching(true);
  };

  const showDiscoveryHome =
    !isSearching &&
    searchQuery.trim() === '' &&
    selectedCategory === 'all' &&
    selectedJurisdiction === 'All India' &&
    activeTab === 'browse';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.logoRow}
            onPress={() => {
              setIsSearching(false);
              setActiveTab('browse');
              resetFilters();
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Schemes"
          >
            <View style={styles.leafIcon}>
              <FontAwesome name="leaf" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Schemes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          {isSyncing ? (
            <View style={styles.syncBadgeSyncing} accessibilityLabel="Syncing updates from cloud">
              <ActivityIndicator size="small" color="#475569" style={{ marginRight: 4, transform: [{ scale: 0.7 }] }} />
              <Text style={styles.syncBadgeSyncingText}>Syncing...</Text>
            </View>
          ) : versionInfo?.isUpdateAvailable ? (
            <TouchableOpacity
              style={styles.syncBadgeUpdate}
              onPress={() => triggerDeltaSync()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Update available. Tap to sync."
            >
              <FontAwesome name="cloud-download" size={10} color="#D97706" style={{ marginRight: 4 }} />
              <Text style={styles.syncBadgeUpdateText}>Update Available</Text>
            </TouchableOpacity>
          ) : isFetching && !isLoading ? (
            <ActivityIndicator size="small" color={palette.emerald700} style={{ marginRight: 6 }} />
          ) : (
            <TouchableOpacity
              style={styles.syncBadge}
              onPress={() => triggerDeltaSync()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Data up to date${lastSyncedLabel ? ` • ${lastSyncedLabel}` : ''}`}
            >
              <FontAwesome name="check-circle" size={10} color="#059669" style={{ marginRight: 3 }} />
              <Text style={styles.syncBadgeText}>{lastSyncedLabel || 'Up to date'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => {
              if (onOpenProfileMenu) {
                onOpenProfileMenu();
              } else {
                useProfileStore.getState().openMenu();
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Open profile menu"
          >
            {currentUser?.avatarUrl ? (
              <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
                ]}
              >
                <FontAwesome name="user" size={15} color="#047857" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Switcher: Explore Schemes vs Saved Schemes */}
      <View style={styles.tabSegmentContainer}>
        <TouchableOpacity
          style={[styles.tabSegmentBtn, activeTab === 'browse' && styles.tabSegmentBtnActive]}
          onPress={() => {
            setActiveTab('browse');
          }}
          activeOpacity={0.8}
        >
          <FontAwesome
            name="compass"
            size={14}
            color={activeTab === 'browse' ? '#0D7A5F' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabSegmentText,
              activeTab === 'browse' && styles.tabSegmentTextActive,
            ]}
          >
            Explore Schemes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabSegmentBtn, activeTab === 'saved' && styles.tabSegmentBtnActive]}
          onPress={() => {
            setActiveTab('saved');
            setIsSearching(false);
          }}
          activeOpacity={0.8}
        >
          <FontAwesome
            name="bookmark"
            size={13}
            color={activeTab === 'saved' ? '#0D7A5F' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabSegmentText,
              activeTab === 'saved' && styles.tabSegmentTextActive,
            ]}
          >
            Saved ({savedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar Input */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          {isSearching ? (
            <TouchableOpacity
              onPress={() => {
                setIsSearching(false);
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back to discovery"
            >
              <FontAwesome name="arrow-left" size={14} color="#0D7A5F" />
            </TouchableOpacity>
          ) : (
            <FontAwesome name="search" size={15} color="#94A3B8" style={styles.searchIcon} />
          )}

          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'saved'
                ? 'Search saved schemes...'
                : 'Search schemes, benefits, or keywords...'
            }
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.length > 0) {
                setIsSearching(true);
              }
            }}
            onFocus={() => {
              setIsSearching(true);
            }}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FontAwesome name="times-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Screen Mode 1: Discovery Home */}
      {showDiscoveryHome ? (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading || isSyncing}
              onRefresh={handleRefresh}
              tintColor={palette.emerald900}
              colors={[palette.emerald900]}
            />
          }
        >
          {/* Discovery Hero Banner */}
          <DiscoveryHeroBanner />

          {/* Category Grid */}
          <CategoryGrid onSelectCategory={handleCategorySelect} />

          {/* Browse all schemes prompt */}
          <TouchableOpacity
            style={styles.promptCard}
            onPress={handleBrowseAll}
            activeOpacity={0.8}
          >
            <Image
              source={require('@/../assets/schemes/farmer_turban.png')}
              style={styles.promptAvatar}
            />
            <View style={styles.promptTextContainer}>
              <Text style={styles.promptTitle}>Browse All Schemes</Text>
              <Text style={styles.promptSubtitle}>
                View all available Central & State schemes with full filters.
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={13} color="#94A3B8" />
          </TouchableOpacity>

          {/* Popular Schemes Preview Section */}
          <View style={styles.previewSection}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Featured Schemes</Text>
              <TouchableOpacity onPress={handleBrowseAll} activeOpacity={0.7}>
                <Text style={styles.viewAllText}>View All ({schemesToDisplay.length}) →</Text>
              </TouchableOpacity>
            </View>

            {schemesToDisplay.slice(0, 3).map((item) => (
              <SchemeListItem
                key={item.id}
                scheme={item}
                onPress={handleSchemePress}
                onToggleBookmark={toggleBookmark}
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        /* Screen Mode 2: Search & Filtered Scheme List */
        <View style={styles.listContainer}>
          {/* Filter Bar with Jurisdiction, Categories, Benefit Types */}
          <SchemeFilterBar
            selectedJurisdiction={selectedJurisdiction}
            onSelectJurisdiction={setSelectedJurisdiction}
            selectedBenefitType={selectedBenefitType}
            onSelectBenefitType={setSelectedBenefitType}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            resultsCount={activeTab === 'saved' ? savedCount : totalCount}
            userState={currentUser?.state}
            onResetFilters={handleResetFilters}
          />

          <FlatList
            data={schemesToDisplay}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (activeTab !== 'saved' && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={isLoading || isSyncing}
                onRefresh={handleRefresh}
                tintColor={palette.emerald900}
                colors={[palette.emerald900]}
              />
            }
            renderItem={({ item }) => (
              <SchemeListItem
                scheme={item}
                onPress={handleSchemePress}
                onToggleBookmark={toggleBookmark}
              />
            )}
            ListFooterComponent={
              activeTab === 'saved' ? (
                <SavedSummaryBanner count={savedCount} />
              ) : isFetchingNextPage ? (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={palette.emerald900} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={palette.emerald700} />
                  <Text style={styles.loadingText}>Fetching matching schemes...</Text>
                </View>
              ) : searchQuery.trim() !== '' ? (
                <SearchEmptyState
                  query={searchQuery}
                  onBrowseAll={handleBrowseAll}
                  onSelectSuggestion={handleSelectSuggestion}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <FontAwesome name="folder-open-o" size={40} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No schemes found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try clearing your filters or choosing another state or category.
                  </Text>
                  <TouchableOpacity
                    style={styles.clearFiltersBtn}
                    onPress={handleResetFilters}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.clearFiltersText}>Reset All Filters</Text>
                  </TouchableOpacity>
                </View>
              )
            }
          />
        </View>
      )}

      {/* Confirmation Modal when Saved */}
      <SavedSchemeModal
        visible={isSaveModalVisible}
        schemeTitle={lastSavedSchemeTitle}
        onClose={closeSaveModal}
      />
      <ProfileMenuModal />
      <LogoutConfirmModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leafIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.emerald600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  syncBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065F46',
  },
  syncBadgeUpdate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  syncBadgeUpdateText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  syncBadgeSyncing: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  syncBadgeSyncingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: palette.emerald500,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  tabSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 3,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabSegmentText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabSegmentTextActive: {
    color: '#0D7A5F',
    fontWeight: '700',
  },
  searchBarWrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    height: 42,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  backButton: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  contentScroll: {
    flex: 1,
  },
  contentInner: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  promptAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: spacing.sm,
  },
  promptTextContainer: {
    flex: 1,
  },
  promptTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  promptSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  previewSection: {
    marginTop: spacing.xs,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D7A5F',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  clearFiltersBtn: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
});
