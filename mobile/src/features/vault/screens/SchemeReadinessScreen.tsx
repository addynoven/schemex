import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useVaultStore } from '../store/vault.store';
import { ReadinessMeter } from '../components/ReadinessMeter';
import { RequiredDocsList } from '../components/RequiredDocsList';
import { VaultDocumentCard } from '../components/VaultDocumentCard';
import { UploadDocSheet } from '../components/UploadDocSheet';
import { DocumentSavedModal } from '../components/DocumentSavedModal';
import { mapBackendReadiness } from '../repositories/vault.api';
import {
  useDeleteDocumentMutation,
  useSchemeReadinessQuery,
  useUploadDocumentMutation,
} from '../hooks/useVaultQuery';
import { useInfiniteSchemesQuery } from '@/features/schemes/hooks/useSchemesQuery';
import {
  DocumentUploadPayload,
  formatFileSize,
  type SchemeReadiness,
} from '../models/vault.model';
import { spacing } from '@/core/theme/spacing';
import { toastService } from '@/core/components/Toast';

const EMPTY_READINESS: SchemeReadiness = {
  schemeId: '',
  schemeName: '',
  ministry: '',
  requiredDocuments: [],
  presentCount: 0,
  totalCount: 0,
  percentage: 0,
  isReady: false,
};

interface SchemeReadinessScreenProps {
  onBack?: () => void;
}

export const SchemeReadinessScreen: React.FC<SchemeReadinessScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const [schemePickerVisible, setSchemePickerVisible] = useState(false);
  const [schemeSearchQuery, setSchemeSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [pickerCategory, setPickerCategory] = useState<string>('all');
  const [selectedSchemeMeta, setSelectedSchemeMeta] = useState<{
    id: string;
    name: string;
    ministry: string;
  } | null>(null);

  // Debounce search — queries backend across all 4,000+ schemes
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(schemeSearchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [schemeSearchQuery]);

  // Infinite scroll — 50 schemes per page from backend
  const {
    data: infiniteData,
    isLoading: isLoadingSchemes,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteSchemesQuery(
    {
      query: debouncedQuery || undefined,
      category: pickerCategory !== 'all' ? pickerCategory : undefined,
    },
    50
  );

  const serverSchemes = useMemo(() => {
    if (!infiniteData?.pages) return [];
    return infiniteData.pages.flatMap((page) => page.items);
  }, [infiniteData]);

  const totalCount = infiniteData?.pages?.[0]?.total ?? serverSchemes.length;

  const availableSchemes = useMemo(
    () => serverSchemes.map((s) => ({ id: s.id, name: s.title, ministry: s.ministry, category: s.category })),
    [serverSchemes]
  );

  const {
    documents,
    uploadModalVisible,
    savedModalVisible,
    lastSavedDocTitle,
    targetDocTitle,
    targetCategory,
    selectScheme,
    openUploadSheet,
    closeUploadSheet,
    saveDocumentDirect,
    closeSavedModal,
    deleteDocument,
  } = useVaultStore();

  const currentScheme = useMemo(() => {
    if (selectedSchemeMeta) return selectedSchemeMeta;
    return availableSchemes[0] ?? { id: '', name: 'Select a Scheme', ministry: '' };
  }, [selectedSchemeMeta, availableSchemes]);

  // Query backend readiness directly by scheme ID or slug
  const { data: backendReadiness, isLoading: isLoadingReadiness } =
    useSchemeReadinessQuery(currentScheme.id);

  // Map backend response to UI model; fall back to empty state while loading
  const readiness: SchemeReadiness = useMemo(() => {
    if (backendReadiness && currentScheme.id) {
      return mapBackendReadiness(backendReadiness, currentScheme.ministry);
    }
    return { ...EMPTY_READINESS, schemeName: currentScheme.name, ministry: currentScheme.ministry };
  }, [backendReadiness, currentScheme]);

  const is100 = readiness.percentage >= 100 || readiness.isReady;

  const uploadDocMutation = useUploadDocumentMutation();
  const deleteDocMutation = useDeleteDocumentMutation();
  const [isUploading, setIsUploading] = useState(false);

  const handleDeleteDocument = async (id: string) => {
    try {
      deleteDocument(id);
      const numId = parseInt(id, 10);
      if (!isNaN(numId) && numId > 0) {
        await deleteDocMutation.mutateAsync(numId);
      }
      toastService.show('Document deleted permanently', 'info');
    } catch (error) {
      console.warn('Failed to delete document:', error);
      toastService.show('Failed to delete document from server', 'error');
    }
  };

  const handleUpload = async (params: DocumentUploadPayload) => {
    try {
      setIsUploading(true);
      let downloadUrl: string | undefined = undefined;
      if (params.fileUri) {
        const uploadedDoc = await uploadDocMutation.mutateAsync({
          uri: params.fileUri,
          fileName:
            params.fileName ||
            `${params.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`,
          mimeType: params.mimeType || 'image/jpeg',
          documentType: params.title,
        });
        downloadUrl = uploadedDoc?.download_url || undefined;
      }
      saveDocumentDirect({
        title: params.title,
        category: params.category,
        fileName: params.fileName,
        fileSize: formatFileSize(params.fileSize),
        mimeType: params.mimeType,
        fileUri: params.fileUri,
        downloadUrl,
      });
      toastService.show(`${params.title} uploaded successfully!`, 'success');
    } catch (error) {
      console.warn('Document upload error:', error);
      Alert.alert(
        'Upload Failed',
        'Could not upload document to secure vault. Please check your network and try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyNow = () => {
    toastService.show(`Redirecting to ${currentScheme.name} official portal...`, 'info');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (onBack) {
                onBack();
              } else {
                useVaultStore.getState().setDevScreen('1_open_vault');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <FontAwesome name="chevron-left" size={15} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Document Vault</Text>
        </View>

        <View style={styles.securityBadge}>
          <FontAwesome name="lock" size={11} color="#047857" style={{ marginRight: 4 }} />
          <Text style={styles.securityText}>S3 Encrypted</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Scheme Selector */}
        <View style={styles.selectorSection}>
          <Text style={styles.selectorLabel}>Select a scheme to check readiness</Text>
          <TouchableOpacity
            style={styles.selectorCard}
            onPress={() => setSchemePickerVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.selectorLeft}>
              <View style={styles.schemeIconBox}>
                <FontAwesome name="leaf" size={16} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.schemeName} numberOfLines={1}>
                  {currentScheme.name}
                </Text>
                <Text style={styles.ministryName} numberOfLines={1}>
                  {currentScheme.ministry}
                </Text>
              </View>
            </View>
            <FontAwesome name="chevron-down" size={12} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Readiness Meter Gauge — shows spinner while backend is fetching */}
        {isLoadingReadiness && !!currentScheme.id ? (
          <View style={styles.readinessLoadingBox}>
            <ActivityIndicator size="small" color="#047857" />
            <Text style={styles.readinessLoadingText}>Checking your documents...</Text>
          </View>
        ) : (
          <ReadinessMeter readiness={readiness} />
        )}

        {/* 100% Success Banner Callout */}
        {is100 && !isLoadingReadiness && (
          <View style={styles.successCallout}>
            <View style={styles.successCheckCircle}>
              <FontAwesome name="check" size={12} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.successCalloutTitle}>All documents ready!</Text>
              <Text style={styles.successCalloutSub}>
                You can now apply for this scheme with 1-click.
              </Text>
            </View>
          </View>
        )}

        {/* Required Documents Checklist */}
        {!isLoadingReadiness && (
          <RequiredDocsList
            documents={readiness.requiredDocuments}
            onUploadMissing={(doc) => openUploadSheet(doc.name, doc.category)}
          />
        )}


        {/* Primary Action Button */}
        {is100 ? (
          <TouchableOpacity
            style={[styles.primaryActionBtn, styles.applyBtn]}
            onPress={handleApplyNow}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionText}>Apply Now</Text>
            <FontAwesome name="arrow-right" size={14} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => openUploadSheet()}
            activeOpacity={0.85}
          >
            <FontAwesome name="cloud-upload" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryActionText}>Upload Document</Text>
          </TouchableOpacity>
        )}

        {/* Your Documents Section */}
        <View style={styles.docsSection}>
          <Text style={styles.sectionHeader}>Your Documents ({documents.length})</Text>
          {documents.map((doc) => (
            <VaultDocumentCard
              key={doc.id}
              document={doc}
              onDelete={handleDeleteDocument}
            />
          ))}
        </View>
      </ScrollView>

      {/* Scheme Picker Modal */}
      <Modal visible={schemePickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setSchemePickerVisible(false);
              setSchemeSearchQuery('');
            }}
          />
          <View style={styles.schemePickerSheet}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Choose Scheme for Readiness</Text>
                <Text style={styles.sheetSubtitle}>
                  {isLoadingSchemes && availableSchemes.length === 0
                    ? 'Loading schemes...'
                    : `${totalCount.toLocaleString()} schemes available`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => {
                  setSchemePickerVisible(false);
                  setSchemeSearchQuery('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Close scheme picker"
              >
                <FontAwesome name="times" size={13} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.schemeSearchBox}>
              <FontAwesome name="search" size={13} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.schemeSearchInput}
                placeholder="Search schemes or ministry..."
                placeholderTextColor="#94A3B8"
                value={schemeSearchQuery}
                onChangeText={setSchemeSearchQuery}
                clearButtonMode="while-editing"
              />
              {schemeSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSchemeSearchQuery('')}>
                  <FontAwesome name="times-circle" size={13} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter Chips */}
            <View style={styles.pickerCategoryWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pickerCategoryRow}
              >
                {[
                  { id: 'all', label: 'All' },
                  { id: 'Healthcare', label: 'Healthcare' },
                  { id: 'Education', label: 'Education' },
                  { id: 'Women & Child', label: 'Women & Child' },
                  { id: 'Business & Finance', label: 'Business & Loans' },
                  { id: 'Agriculture', label: 'Agriculture' },
                  { id: 'Social Welfare', label: 'Social Welfare' },
                ].map((cat) => {
                  const isActive = pickerCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.pickerCategoryChip,
                        isActive && styles.pickerCategoryChipActive,
                      ]}
                      onPress={() => setPickerCategory(cat.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerCategoryText,
                          isActive && styles.pickerCategoryTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Infinite Scrollable Schemes List */}
            <FlatList
              data={availableSchemes}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              style={styles.schemesScroll}
              contentContainerStyle={styles.schemesScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.5}
              renderItem={({ item }) => {
                const isSelected = item.id === currentScheme.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.schemeChoice,
                      isSelected && styles.schemeChoiceActive,
                    ]}
                    onPress={() => {
                      setSelectedSchemeMeta({ id: item.id, name: item.name, ministry: item.ministry });
                      selectScheme(item.id);
                      setSchemePickerVisible(false);
                      setSchemeSearchQuery('');
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.schemeChoiceTitle} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <View style={styles.schemeChoiceMetaRow}>
                        <Text style={styles.schemeChoiceSub} numberOfLines={1}>
                          {item.ministry}
                        </Text>
                        {item.category ? (
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{item.category}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    {isSelected ? (
                      <View style={styles.activeCheckCircle}>
                        <FontAwesome name="check" size={11} color="#FFFFFF" />
                      </View>
                    ) : (
                      <FontAwesome name="chevron-right" size={11} color="#CBD5E1" />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#047857" />
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      Loading more schemes...
                    </Text>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                !isLoadingSchemes ? (
                  <View style={styles.emptySearch}>
                    <FontAwesome name="search" size={24} color="#CBD5E1" style={{ marginBottom: 8 }} />
                    <Text style={styles.emptySearchText}>
                      No schemes match "{debouncedQuery || schemeSearchQuery}"
                    </Text>
                  </View>
                ) : (
                  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#047857" />
                  </View>
                )
              }
            />
          </View>
        </View>
      </Modal>

      {/* Upload Bottom Sheet */}
      <UploadDocSheet
        visible={uploadModalVisible}
        onClose={closeUploadSheet}
        defaultTitle={targetDocTitle}
        defaultCategory={targetCategory}
        isUploading={isUploading}
        onUpload={handleUpload}
      />

      {/* Document Saved Confetti Modal */}
      <DocumentSavedModal
        visible={savedModalVisible}
        documentTitle={lastSavedDocTitle}
        onClose={closeSavedModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  readinessLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  readinessLoadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
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
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#BBF7D0',
  },
  securityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  selectorSection: {
    marginBottom: spacing.sm,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    paddingRight: 8,
  },
  schemeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schemeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  ministryName: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  successCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  successCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCalloutTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#064E3B',
  },
  successCalloutSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#064E3B',
    borderRadius: 14,
    paddingVertical: 14,
    marginVertical: spacing.md,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  applyBtn: {
    backgroundColor: '#059669',
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  docsSection: {
    marginTop: spacing.xs,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  schemePickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schemeSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: spacing.sm,
  },
  schemeSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  schemesScroll: {
    flexGrow: 0,
  },
  schemesScrollContent: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  emptySearch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptySearchText: {
    fontSize: 13,
    color: '#64748B',
  },
  schemeChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  schemeChoiceActive: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  schemeChoiceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  schemeChoiceSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  activeCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCategoryWrapper: {
    marginBottom: spacing.xs,
  },
  pickerCategoryRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 4,
  },
  pickerCategoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerCategoryChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  pickerCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  pickerCategoryTextActive: {
    color: '#065F46',
  },
  schemeChoiceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#475569',
  },
});
