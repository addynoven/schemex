import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  CATEGORY_LABELS,
  DocumentUploadPayload,
  PRESET_DOCUMENTS_BY_CATEGORY,
  UploadMethod,
  VaultDocumentCategory,
} from '../models/vault.model';
import { spacing } from '@/core/theme/spacing';

interface UploadDocSheetProps {
  visible: boolean;
  onClose: () => void;
  defaultTitle?: string;
  defaultCategory?: VaultDocumentCategory;
  isUploading?: boolean;
  onUpload: (params: DocumentUploadPayload) => void | Promise<void>;
}

const CATEGORIES: VaultDocumentCategory[] = [
  'identity',
  'income',
  'land',
  'bank',
  'other',
];

export const UploadDocSheet: React.FC<UploadDocSheetProps> = ({
  visible,
  onClose,
  defaultTitle = '',
  defaultCategory = 'identity',
  isUploading = false,
  onUpload,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<VaultDocumentCategory>(defaultCategory);
  const [docTitle, setDocTitle] = useState(defaultTitle);

  useEffect(() => {
    if (visible) {
      setSelectedCategory(defaultCategory || 'identity');
      setDocTitle(defaultTitle || '');
    }
  }, [visible, defaultCategory, defaultTitle]);

  const presets = PRESET_DOCUMENTS_BY_CATEGORY[selectedCategory] || [];

  const handleSelectPreset = (name: string) => {
    setDocTitle(name);
  };

  const handleTakePhoto = async () => {
    if (isUploading) return;
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos of documents.'
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const finalTitle = docTitle.trim() || presets[0] || 'Document';
        const ext = asset.mimeType?.includes('png') ? 'png' : 'jpg';
        const fileName =
          asset.fileName ||
          `${finalTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${ext}`;
        onUpload({
          title: finalTitle,
          category: selectedCategory,
          method: 'camera',
          fileUri: asset.uri,
          fileName,
          mimeType: asset.mimeType || 'image/jpeg',
          fileSize: asset.fileSize,
        });
      }
    } catch (e) {
      console.warn('Camera launch error:', e);
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  const handlePickGallery = async () => {
    if (isUploading) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Media library permission is required to select documents from your photos.'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const finalTitle = docTitle.trim() || presets[0] || 'Document';
        const ext = asset.mimeType?.includes('png') ? 'png' : 'jpg';
        const fileName =
          asset.fileName ||
          `${finalTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${ext}`;
        onUpload({
          title: finalTitle,
          category: selectedCategory,
          method: 'gallery',
          fileUri: asset.uri,
          fileName,
          mimeType: asset.mimeType || 'image/jpeg',
          fileSize: asset.fileSize,
        });
      }
    } catch (e) {
      console.warn('Gallery picker error:', e);
      Alert.alert('Gallery Error', 'Could not open photo gallery.');
    }
  };

  const handlePickDocument = async () => {
    if (isUploading) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const finalTitle = docTitle.trim() || presets[0] || 'Document';
        onUpload({
          title: finalTitle,
          category: selectedCategory,
          method: 'file',
          fileUri: asset.uri,
          fileName:
            asset.name ||
            `${finalTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
          mimeType: asset.mimeType || 'application/pdf',
          fileSize: asset.size,
        });
      }
    } catch (e) {
      console.warn('Document picker error:', e);
      Alert.alert('Document Error', 'Could not open document picker.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerTitle}>Add Document to Vault</Text>
                  <Text style={styles.headerSub}>
                    Select category & type of document
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <FontAwesome name="times" size={14} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* 1. Category Selection */}
                <Text style={styles.sectionLabel}>1. Document Category</Text>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((cat) => {
                    const info = CATEGORY_LABELS[cat];
                    const isSelected = selectedCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryChip,
                          isSelected && styles.categoryChipActive,
                        ]}
                        onPress={() => {
                          setSelectedCategory(cat);
                          // Suggest first preset if user hasn't typed custom name
                          if (!docTitle || presets.includes(docTitle)) {
                            setDocTitle(PRESET_DOCUMENTS_BY_CATEGORY[cat][0]);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <FontAwesome
                          name={info.icon as any}
                          size={13}
                          color={isSelected ? '#047857' : '#64748B'}
                        />
                        <Text
                          style={[
                            styles.categoryText,
                            isSelected && styles.categoryTextActive,
                          ]}
                        >
                          {info.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2. Document Name / Presets */}
                <Text style={styles.sectionLabel}>2. Document Name</Text>
                <View style={styles.presetsRow}>
                  {presets.map((preset) => {
                    const isSelected = docTitle.trim().toLowerCase() === preset.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={preset}
                        style={[
                          styles.presetPill,
                          isSelected && styles.presetPillActive,
                        ]}
                        onPress={() => handleSelectPreset(preset)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.presetText,
                            isSelected && styles.presetTextActive,
                          ]}
                        >
                          {preset}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom Name Input */}
                <View style={styles.inputBox}>
                  <FontAwesome name="pencil" size={13} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    value={docTitle}
                    onChangeText={setDocTitle}
                    placeholder="Or type custom document name..."
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                {/* 3. Upload Source Method */}
                <Text style={styles.sectionLabel}>3. Select Upload Source</Text>

                {isUploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="large" color="#047857" />
                    <Text style={styles.uploadingText}>
                      Uploading securely to your vault...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.optionsList}>
                    {/* Camera */}
                    <TouchableOpacity
                      style={styles.optionCard}
                      onPress={handleTakePhoto}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionLeft}>
                        <View style={styles.optionIconBox}>
                          <FontAwesome name="camera" size={17} color="#059669" />
                        </View>
                        <View>
                          <Text style={styles.optionTitle}>Take Photo</Text>
                          <Text style={styles.optionSub}>
                            Snap photo using camera
                          </Text>
                        </View>
                      </View>
                      <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
                    </TouchableOpacity>

                    {/* Gallery */}
                    <TouchableOpacity
                      style={styles.optionCard}
                      onPress={handlePickGallery}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionLeft}>
                        <View style={styles.optionIconBox}>
                          <FontAwesome name="image" size={17} color="#059669" />
                        </View>
                        <View>
                          <Text style={styles.optionTitle}>Choose from Gallery</Text>
                          <Text style={styles.optionSub}>
                            Select image from photo album
                          </Text>
                        </View>
                      </View>
                      <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
                    </TouchableOpacity>

                    {/* File */}
                    <TouchableOpacity
                      style={styles.optionCard}
                      onPress={handlePickDocument}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionLeft}>
                        <View style={styles.optionIconBox}>
                          <FontAwesome name="file-pdf-o" size={17} color="#059669" />
                        </View>
                        <View>
                          <Text style={styles.optionTitle}>Upload Document File</Text>
                          <Text style={styles.optionSub}>
                            Select PDF or document file
                          </Text>
                        </View>
                      </View>
                      <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
    marginBottom: spacing.xs + 2,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryTextActive: {
    color: '#047857',
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.xs + 4,
  },
  presetPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetPillActive: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  presetTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  optionsList: {
    gap: spacing.xs + 2,
    marginTop: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  uploadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  uploadingText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
  },
});
