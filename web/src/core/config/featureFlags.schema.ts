import { z } from "zod";

export const featureFlagsSchema = z.object({
  enableVoiceInterface: z.boolean().default(true),
  enableMultiMemberHousehold: z.boolean().default(true),
  enableRealtimeChatStream: z.boolean().default(true),
  enableSocialOAuth: z.boolean().default(true),
});

export type FeatureFlags = z.infer<typeof featureFlagsSchema>;

export const defaultFeatureFlags: FeatureFlags = {
  enableVoiceInterface: true,
  enableMultiMemberHousehold: true,
  enableRealtimeChatStream: true,
  enableSocialOAuth: true,
};
