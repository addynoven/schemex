import { create } from 'zustand';
import {
  formatFileSize,
  getCanonicalDocumentType,
  isSameDocumentType,
  VaultDevScreen,
  VaultDocument,
  VaultDocumentCategory,
} from '../models/vault.model';
import { inferCategory, type BackendVaultDocument } from '../repositories/vault.api';

interface VaultState {
  documents: VaultDocument[];
  selectedSchemeId: string;
  activeDevScreen: VaultDevScreen;
  uploadModalVisible: boolean;
  savedModalVisible: boolean;
  lastSavedDocTitle: string;
  targetDocTitle?: string;
  targetCategory?: VaultDocumentCategory;

  // Actions
  setDevScreen: (screen: VaultDevScreen) => void;
  selectScheme: (schemeId: string) => void;
  openUploadSheet: (title?: string, category?: VaultDocumentCategory) => void;
  closeUploadSheet: () => void;
  saveDocumentDirect: (params: {
    title: string;
    category?: VaultDocumentCategory;
    fileName?: string;
    fileSize?: string;
    mimeType?: string;
    fileUri?: string;
    downloadUrl?: string;
  }) => void;
  closeSavedModal: () => void;
  addDocument: (doc: VaultDocument) => void;
  deleteDocument: (id: string) => void;
  syncServerDocuments: (serverDocs: BackendVaultDocument[]) => void;
  resetToInitial: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  documents: [],
  selectedSchemeId: '',
  activeDevScreen: '1_open_vault',
  uploadModalVisible: false,
  savedModalVisible: false,
  lastSavedDocTitle: '',
  targetDocTitle: undefined,
  targetCategory: undefined,

  setDevScreen: (screen: VaultDevScreen) => {
    const baseModal = {
      uploadModalVisible: false,
      savedModalVisible: false,
    };
    if (screen === '3_upload_document') {
      set({ activeDevScreen: screen, ...baseModal, uploadModalVisible: true });
    } else if (screen === '5_document_saved') {
      set({ activeDevScreen: screen, ...baseModal, savedModalVisible: true });
    } else {
      set({ activeDevScreen: screen, ...baseModal });
    }
  },

  selectScheme: (schemeId: string) => {
    set({ selectedSchemeId: schemeId });
  },

  openUploadSheet: (title?: string, category?: VaultDocumentCategory) => {
    const finalCategory = category || (title ? inferCategory(title) : undefined);
    set({
      uploadModalVisible: true,
      targetDocTitle: title || '',
      lastSavedDocTitle: title || '',
      targetCategory: finalCategory,
    });
  },

  closeUploadSheet: () => {
    set({ uploadModalVisible: false });
  },

  saveDocumentDirect: ({
    title,
    category,
    fileName,
    fileSize,
    mimeType,
    fileUri,
    downloadUrl,
  }) => {
    const rawTitle = title.trim() || 'Document';
    const canonicalTitle = getCanonicalDocumentType(rawTitle);
    const finalCategory = category || inferCategory(canonicalTitle);
    const finalFileName =
      fileName || `${canonicalTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`;

    set((state) => {
      // Find existing document of the same canonical type
      const existingDoc = state.documents.find((d) =>
        isSameDocumentType(d.title, canonicalTitle)
      );

      const newDoc: VaultDocument = {
        id: existingDoc ? existingDoc.id : `doc-${Date.now()}`,
        title: canonicalTitle,
        fileName: finalFileName,
        fileSize: fileSize || '0 KB',
        mimeType: mimeType || 'application/pdf',
        category: finalCategory,
        uploadDate: 'Just now',
        isVerified: true,
        fileUri,
        downloadUrl,
      };

      // Strip out ANY prior documents that match this canonical type to prevent duplicates
      const remainingDocs = state.documents.filter(
        (d) => !isSameDocumentType(d.title, canonicalTitle)
      );

      return {
        uploadModalVisible: false,
        savedModalVisible: true,
        lastSavedDocTitle: canonicalTitle,
        targetDocTitle: undefined,
        targetCategory: undefined,
        documents: [newDoc, ...remainingDocs],
      };
    });
  },

  closeSavedModal: () => {
    set({ savedModalVisible: false, activeDevScreen: '6_updated_readiness' });
  },

  addDocument: (doc: VaultDocument) => {
    set((state) => {
      const canonicalTitle = getCanonicalDocumentType(doc.title);
      const existingDoc = state.documents.find((d) =>
        isSameDocumentType(d.title, canonicalTitle)
      );

      const updatedDoc: VaultDocument = {
        ...doc,
        id: existingDoc ? existingDoc.id : doc.id,
        title: canonicalTitle,
      };

      const remaining = state.documents.filter(
        (d) => !isSameDocumentType(d.title, canonicalTitle)
      );

      return { documents: [updatedDoc, ...remaining] };
    });
  },

  deleteDocument: (id: string) => {
    set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
  },

  syncServerDocuments: (serverDocs: BackendVaultDocument[]) => {
    if (!serverDocs || !Array.isArray(serverDocs)) return;

    // Deduplicate incoming server documents by canonical document type (keeping newest)
    const canonicalMap = new Map<string, BackendVaultDocument>();
    for (const doc of serverDocs) {
      const canonical = getCanonicalDocumentType(doc.document_type);
      const existing = canonicalMap.get(canonical);
      if (!existing || doc.id > existing.id) {
        canonicalMap.set(canonical, doc);
      }
    }

    const mapped: VaultDocument[] = Array.from(canonicalMap.values()).map((doc) => ({
      id: String(doc.id),
      title: doc.document_type,
      fileName: doc.file_name,
      fileSize: formatFileSize(doc.file_size_bytes),
      mimeType: doc.mime_type,
      category: inferCategory(doc.document_type),
      uploadDate: 'Synced',
      isVerified: doc.is_verified,
      downloadUrl: doc.download_url || undefined,
    }));
    set({ documents: mapped });
  },

  resetToInitial: () => {
    set({
      documents: [],
      selectedSchemeId: '',
      activeDevScreen: '1_open_vault',
      uploadModalVisible: false,
      savedModalVisible: false,
      lastSavedDocTitle: '',
      targetDocTitle: undefined,
      targetCategory: undefined,
    });
  },
}));
