import { z } from 'zod';

export const AuthModeSchema = z.enum(['login', 'signup']);
export type AuthMode = z.infer<typeof AuthModeSchema>;

export const AuthStageSchema = z.enum([
  'login',
  'signup',
  'check_email_link',
  'complete_profile',
  'success',
]);
export type AuthStage = z.infer<typeof AuthStageSchema>;

export const UserProfileSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  state: z.string().default('Maharashtra'),
  avatarUrl: z.string().optional(),
  authProvider: z.enum(['email', 'google', 'phone']).optional(),
  citizenUid: z.string().optional(),
  isPhoneVerified: z.boolean().default(true),
  isEmailVerified: z.boolean().default(false),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;
