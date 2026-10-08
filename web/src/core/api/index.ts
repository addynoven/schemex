export {
  fetchPopularSchemes,
  searchSchemesPaginated,
  searchSchemes,
  listSchemesPaginated,
  getSchemeCategories,
  getSchemeBySlug,
  checkEligibility,
  citizenRegister,
  citizenLogin,
  citizenGetMe,
  updateCitizenProfile,
  uploadVaultDocument,
  listVaultDocuments,
  deleteVaultDocument,
  getSchemeDocumentReadiness,
  adminLogin,
  adminGetMe,
  adminListSchemes,
  adminCreateScheme,
  adminUpdateScheme,
  adminDeleteScheme,
  listChatSessions,
  createChatSession,
  getChatSession,
  updateChatSessionTitle,
  deleteChatSession,
  sendChatMessage,
  streamChatMessage,
} from "@/lib/api";

export type { PaginatedResult } from "@/lib/api";

export * from "./client";
export * from "./httpClient";
export * from "./entityMappers";
