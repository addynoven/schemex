import React, { useState } from 'react';
import {
  Image,
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
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';
import { toastService } from '@/core/components/Toast';

export const EditProfileScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, setFullName, setEmail, setStateLocation } = useAuthStore();

  const [name, setName] = useState(currentUser?.fullName || '');
  const [emailVal, setEmailVal] = useState(currentUser?.email || '');
  const [stateVal, setStateVal] = useState(currentUser?.state || 'Maharashtra');

  const handleSave = () => {
    setFullName(name);
    setEmail(emailVal);
    setStateLocation(stateVal);
    toastService.show('Profile updated successfully', 'success');
    router.back();
  };

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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.initialAvatarCircle}>
              <Text style={styles.initialAvatarText}>
                {(name || 'C').charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={emailVal}
            onChangeText={setEmailVal}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.verifiedInputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value="+91 9876543210"
              editable={false}
            />
            <View style={styles.verifiedBadge}>
              <FontAwesome name="check-circle" size={12} color="#16A34A" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>State</Text>
          <TouchableOpacity
            style={styles.dropdownInput}
            onPress={() => setStateVal(stateVal === 'Maharashtra' ? 'Delhi' : 'Maharashtra')}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownText}>{stateVal}</Text>
            <FontAwesome name="chevron-down" size={12} color="#64748B" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    padding: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  initialAvatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#DCFCE7',
    borderWidth: 2.5,
    borderColor: palette.emerald600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialAvatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.emerald800,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    height: 46,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  verifiedInputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  dropdownInput: {
    height: 46,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 14,
    color: '#0F172A',
  },
  saveBtn: {
    backgroundColor: palette.emerald700,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
