import React, { useEffect, useRef } from 'react';
import {
  BackHandler,
  FlatList,
  LogBox,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { toastService } from '@/core/components/Toast';
import { useKeyboard } from '@/core/hooks/useKeyboard';

LogBox.ignoreAllLogs();
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AdvisorHeader } from '../components/AdvisorHeader';
import { WelcomeCard } from '../components/WelcomeCard';
import { PromptChips } from '../components/PromptChips';
import { MessageBubble } from '../components/MessageBubble';
import { ThinkingIndicator } from '../components/ThinkingIndicator';
import { ChatInputBar } from '../components/ChatInputBar';
import { VoiceListeningModal } from '../components/VoiceListeningModal';
import { ChatHistoryDrawer } from '../components/ChatHistoryDrawer';
import { useAdvisorStore } from '../store/useAdvisorStore';
import type { ChatMessage } from '../models/advisor.model';
import { ProfileMenuModal, LogoutConfirmModal, useProfileStore } from '@/features/profile';

export function AdvisorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();

  const {
    messages,
    inputText,
    isThinking,
    thinkingSteps,
    isListening,
    isHistoryOpen,
    promptChips,
    errorMessage,
    clearError,
    retryLastQuery,
    openHistory,
    closeHistory,
    loadSessions,
    setInputText,
    startVoiceInput,
    stopVoiceInput,
    sendMessage,
    loadPromptChips,
  } = useAdvisorStore();

  useEffect(() => {
    void loadPromptChips();
    void loadSessions();
  }, [loadPromptChips, loadSessions]);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (isKeyboardVisible && hasMessages) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  }, [isKeyboardVisible, hasMessages]);

  // Priority: close history drawer → stop voice listening → fall through
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isHistoryOpen) {
        closeHistory();
        return true;
      }
      if (isListening) {
        stopVoiceInput();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isHistoryOpen, isListening, closeHistory, stopVoiceInput]);

  const handleSchemePress = (schemeId: string) => {
    router.push({
      pathname: '/schemes/[id]',
      params: { id: schemeId },
    });
  };

  const handleVaultPress = () => {
    router.push('/(tabs)/vault');
  };

  const handleProfilePress = () => {
    useProfileStore.getState().openMenu();
  };

  const handleNotificationPress = () => {
    toastService.show('You have 2 new welfare notifications', 'info', 2000);
  };

  const handleAttachPress = () => {
    toastService.show('Upload document from your Vault or device', 'info', 2000);
  };

  const handlePromptSelect = (queryText: string) => {
    void sendMessage(queryText);
  };

  const handleFollowUpSelect = (promptText: string) => {
    void sendMessage(promptText);
  };

  const handleMoreTopics = () => {
    router.push('/(tabs)/schemes');
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.keyboardAvoid}>
        {/* Top Header */}
        <AdvisorHeader
          onProfilePress={handleProfilePress}
          onNotificationPress={handleNotificationPress}
          onHistoryPress={openHistory}
        />

        {/* Loud Error Banner for Server / Rate Limit / Timeout Failures */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <FontAwesome name="exclamation-circle" size={20} color="#DC2626" style={styles.errorIcon} />
            <View style={styles.errorContentCol}>
              <Text style={styles.errorTitle}>Consultation Failed</Text>
              <Text style={styles.errorMessageText}>{errorMessage}</Text>
              <View style={styles.errorActionRow}>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => void retryLastQuery()}
                  activeOpacity={0.8}
                >
                  <FontAwesome name="refresh" size={11} color="#FFFFFF" />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={clearError}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dismissButtonText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Chat / Content Scroll Area */}
        <View style={styles.scrollArea}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => {
              if (hasMessages) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
            ListHeaderComponent={
              !hasMessages ? (
                <View style={styles.welcomeSection}>
                  <WelcomeCard />
                  <PromptChips
                    chips={promptChips}
                    onSelect={handlePromptSelect}
                    onMoreTopics={handleMoreTopics}
                  />
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                onSchemePress={handleSchemePress}
                onVaultPress={handleVaultPress}
                onFollowUpPress={handleFollowUpSelect}
                onViewAllPress={handleMoreTopics}
              />
            )}
            ListFooterComponent={
              isThinking ? <ThinkingIndicator steps={thinkingSteps} /> : null
            }
          />
        </View>

        {/* Bottom Chat Input Bar */}
        <ChatInputBar
          value={inputText}
          onChangeText={setInputText}
          onSubmit={() => void sendMessage()}
          onVoicePress={startVoiceInput}
          onAttachPress={handleAttachPress}
          disabled={isThinking}
        />

        {/* Voice Listening Modal */}
        <VoiceListeningModal
          visible={isListening}
          onClose={() => stopVoiceInput()}
          onFinish={(transcription) => stopVoiceInput(transcription)}
        />
        <ProfileMenuModal />
        <LogoutConfirmModal />
        <ChatHistoryDrawer />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  welcomeSection: {
    marginBottom: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    padding: spacing.md,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'flex-start',
  },
  errorIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  errorContentCol: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  errorMessageText: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  errorActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: 5,
    paddingHorizontal: spacing.xs,
  },
  dismissButtonText: {
    color: '#7F1D1D',
    fontSize: 12,
    fontWeight: '500',
  },
});
