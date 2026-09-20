import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

interface EmailLoginViewProps {
  email: string;
  password: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  onChangeEmail: (email: string) => void;
  onChangePassword: (password: string) => void;
  onLogin: () => void;
  onSelectGoogle: () => void;
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
}

export const EmailLoginView: React.FC<EmailLoginViewProps> = ({
  email,
  password,
  isLoading,
  errorMessage,
  onChangeEmail,
  onChangePassword,
  onLogin,
  onSelectGoogle,
  onSwitchToSignUp,
  onForgotPassword,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !isLoading;

  return (
    <View style={styles.container}>
      {/* 1. Continue with Google */}
      <TouchableOpacity
        style={styles.socialBtn}
        onPress={onSelectGoogle}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        <FontAwesome name="google" size={16} color="#DB4437" style={styles.socialIcon} />
        <Text style={styles.socialText}>Continue with Google</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR WITH EMAIL</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Error Message */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <FontAwesome name="exclamation-circle" size={14} color="#DC2626" style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Email Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="envelope-o" size={14} color="#94A3B8" style={styles.fieldIcon} />
          <TextInput
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={onChangeEmail}
            placeholder="citizen@example.gov.in"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      {/* Password Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="lock" size={16} color="#94A3B8" style={styles.fieldIcon} />
          <TextInput
            style={styles.input}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={onChangePassword}
            placeholder="Enter your password"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeBtn}
            activeOpacity={0.7}
          >
            <FontAwesome
              name={showPassword ? 'eye-slash' : 'eye'}
              size={15}
              color="#64748B"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Forgot Password */}
      <TouchableOpacity
        style={styles.forgotBtn}
        onPress={onForgotPassword}
        activeOpacity={0.7}
      >
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.submitBtn, canSubmit && styles.submitBtnActive]}
        onPress={onLogin}
        disabled={!canSubmit}
        activeOpacity={0.85}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitBtnText}>Log In</Text>
        )}
      </TouchableOpacity>

      {/* Footer link */}
      <TouchableOpacity
        style={styles.footerLink}
        onPress={onSwitchToSignUp}
        activeOpacity={0.7}
      >
        <Text style={styles.footerText}>
          New to Scheme App?{' '}
          <Text style={styles.footerLinkBold}>Create an account</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  socialIcon: {
    marginRight: spacing.sm,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    color: '#DC2626',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#0F172A',
  },
  eyeBtn: {
    padding: 6,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: spacing.md,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.emerald700,
  },
  submitBtn: {
    backgroundColor: '#94A3B8',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnActive: {
    backgroundColor: palette.emerald700,
    shadowColor: palette.emerald700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  footerLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  footerLinkBold: {
    color: palette.emerald700,
    fontWeight: '700',
  },
});
