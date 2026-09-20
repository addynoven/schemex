import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../store/useProfileStore';
import { LogoutConfirmModal } from '../components/LogoutConfirmModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';
import { toastService } from '@/core/components/Toast';

export const SettingsScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, openLogoutConfirm } = useProfileStore();
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <FontAwesome name="chevron-left" size={16} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {/* Language */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/onboarding')}
            activeOpacity={0.7}
          >
            <FontAwesome name="globe" size={18} color="#334155" style={styles.rowIcon} />
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Language</Text>
              <Text style={styles.rowSubtitle}>
                {settings.language === 'en' ? 'English (Change)' : 'हिंदी (बदलें)'}
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
          </TouchableOpacity>

          {/* Notifications */}
          <View style={styles.row}>
            <FontAwesome name="bell-o" size={18} color="#334155" style={styles.rowIcon} />
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Notifications</Text>
              <Text style={styles.rowSubtitle}>Scheme alerts, application updates</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(val) => updateSettings({ notificationsEnabled: val })}
              trackColor={{ false: '#CBD5E1', true: palette.emerald600 }}
            />
          </View>

          {/* Auth Verification Channel */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              const next = settings.authNotificationChannel === 'email' ? 'in_app' : 'email';
              updateSettings({ authNotificationChannel: next });
              toastService.show(`Verification channel set to ${next === 'email' ? 'Email' : 'In-App'}`, 'info');
            }}
            activeOpacity={0.7}
          >
            <FontAwesome name="shield" size={18} color="#334155" style={styles.rowIcon} />
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Security & Verification</Text>
              <Text style={styles.rowSubtitle}>
                {settings.authNotificationChannel === 'email' ? 'Email Magic Link' : 'In-App Token'}
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
          </TouchableOpacity>

          {/* Privacy & Data */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => toastService.show('Privacy & Data management', 'info')}
            activeOpacity={0.7}
          >
            <FontAwesome name="lock" size={18} color="#334155" style={styles.rowIcon} />
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Privacy & Data</Text>
              <Text style={styles.rowSubtitle}>Manage your data, download or delete</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowPasswordModal(true)}
            activeOpacity={0.7}
          >
            <FontAwesome name="key" size={18} color="#334155" style={styles.rowIcon} />
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Change Password</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={openLogoutConfirm}
          activeOpacity={0.7}
        >
          <FontAwesome name="sign-out" size={16} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => setShowDeleteModal(true)}
          activeOpacity={0.7}
        >
          <FontAwesome name="trash-o" size={16} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      <LogoutConfirmModal />
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirmDelete={() => router.replace('/onboarding')}
      />
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
  content: {
    padding: spacing.md,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowIcon: {
    width: 28,
  },
  rowTextCol: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});
