import { z } from "zod";

/**
 * INFURIZZ Environment Variable Schema & Validator
 * Validates critical runtime configuration on application startup.
 */
const envSchema = z.object({
  // Runtime Environment
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("3000"),
  APP_URL: z.string().url().default("http://localhost:3000"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional().default(""),

  // Authentication
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET must be at least 16 characters in production").default("dev-secret-key-infurizz-local-testing-only-12345"),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),

  // Social Connectors Configuration
  ENABLE_MOCK_SOCIAL_DATA: z
    .string()
    .default("true")
    .transform((val) => val === "true" || val === "1"),

  // Optional External API Credentials (used when ENABLE_MOCK_SOCIAL_DATA is false)
  INSTAGRAM_CLIENT_ID: z.string().optional().default(""),
  INSTAGRAM_CLIENT_SECRET: z.string().optional().default(""),
  FACEBOOK_APP_ID: z.string().optional().default(""),
  FACEBOOK_APP_SECRET: z.string().optional().default(""),
  YOUTUBE_API_KEY: z.string().optional().default(""),
  YOUTUBE_CLIENT_ID: z.string().optional().default(""),
  YOUTUBE_CLIENT_SECRET: z.string().optional().default(""),
  X_API_KEY: z.string().optional().default(""),
  X_API_SECRET: z.string().optional().default(""),
  X_BEARER_TOKEN: z.string().optional().default(""),
  LINKEDIN_CLIENT_ID: z.string().optional().default(""),
  LINKEDIN_CLIENT_SECRET: z.string().optional().default(""),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional().default(""),
  WHATSAPP_ACCESS_TOKEN: z.string().optional().default(""),

  // Optional AI Gateway
  AI_GATEWAY_API_KEY: z.string().optional().default(""),
  AI_MODEL: z.string().optional().default("gemini-1.5-pro"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables detected:");
    console.error(result.error.flatten().fieldErrors);
    throw new Error("Invalid application environment configuration.");
  }

  return result.data;
}

export const env = validateEnv();
