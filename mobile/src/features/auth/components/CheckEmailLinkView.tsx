import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { palette } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';

interface CheckEmailLinkViewProps {
  email: string;
  onCheckVerification: () => Promise<boolean>;
  onResendLink: () => Promise<boolean>;
  onBackToLogin: () => void;
}

export const CheckEmailLinkView: React.FC<CheckEmailLinkViewProps> = ({
  email,
  onCheckVerification,
  onResendLink,
  onBackToLogin,
}) => {
  const [cooldown, setCooldown] = useState(30);
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOpenEmailApp = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('message://');
      } else {
        await Linking.openURL('mailto:');
      }
    } catch {
      await Linking.openURL('mailto:');
    }
  };

  const handleCheck = async () => {
    setIsChecking(true);
    setFeedback(null);
    const verified = await onCheckVerification();
    setIsChecking(false);
    if (!verified) {
      setFeedback('Activation link not clicked yet. Please open your email and tap the verification link.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setFeedback(null);
    const ok = await onResendLink();
    setIsResending(false);
    if (ok) {
      setCooldown(45);
      setFeedback('A fresh activation link has been sent to your inbox.');
    } else {
      setFeedback('Failed to resend activation link. Please try again shortly.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <FontAwesome name="envelope-open" size={36} color={palette.emerald700} />
      </View>

      <Text style={styles.title}>Check Your Email</Text>
      <Text style={styles.subtitle}>
        We sent an account activation link to:
      </Text>
      <View style={styles.emailBadge}>
        <FontAwesome name="envelope" size={13} color="#475569" style={{ marginRight: 6 }} />
        <Text style={styles.emailText}>{email}</Text>
      </View>

      <Text style={styles.instructionText}>
        Tap the activation link in your email to verify your citizen profile and access all benefits.
      </Text>

      {feedback && (
        <View style={styles.feedbackBanner}>
          <FontAwesome name="info-circle" size={14} color="#0369A1" style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      )}

      {/* Action: Open Email App */}
      <TouchableOpacity
        style={styles.openAppBtn}
        onPress={handleOpenEmailApp}
        activeOpacity={0.85}
      >
        <FontAwesome name="external-link" size={15} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.openAppBtnText}>Open Email App</Text>
      </TouchableOpacity>

      {/* Action: I've Verified My Email */}
      <TouchableOpacity
        style={styles.checkBtn}
        onPress={handleCheck}
        disabled={isChecking}
        activeOpacity={0.85}
      >
        {isChecking ? (
          <ActivityIndicator size="small" color={palette.emerald700} />
        ) : (
          <>
            <FontAwesome name="check-circle" size={16} color={palette.emerald700} style={{ marginRight: 8 }} />
            <Text style={styles.checkBtnText}>I've Verified My Email</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Action: Resend Link */}
      <View style={styles.resendRow}>
        {cooldown > 0 ? (
          <Text style={styles.cooldownText}>
            Resend available in{' '}
            <Text style={styles.cooldownSeconds}>00:{cooldown < 10 ? `0${cooldown}` : cooldown}</Text>
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResend} disabled={isResending} activeOpacity={0.7}>
            <Text style={styles.resendActiveText}>
              {isResending ? 'Sending...' : 'Didn’t receive it? Resend Link'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Back to Login */}
      <TouchableOpacity style={styles.backBtn} onPress={onBackToLogin} activeOpacity={0.7}>
        <Text style={styles.backBtnText}>Use a different email or log in</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: palette.emerald700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  emailText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  instructionText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    padding: 10,
    marginBottom: spacing.md,
    width: '100%',
  },
  feedbackText: {
    flex: 1,
    fontSize: 12.5,
    color: '#0369A1',
    lineHeight: 17,
  },
  openAppBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.emerald700,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: spacing.sm,
    shadowColor: palette.emerald700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  openAppBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: palette.emerald700,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  checkBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.emerald700,
  },
  resendRow: {
    marginBottom: spacing.lg,
  },
  cooldownText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  cooldownSeconds: {
    fontWeight: '700',
    color: palette.emerald700,
  },
  resendActiveText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.emerald700,
  },
  backBtn: {
    padding: 6,
  },
  backBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
});
