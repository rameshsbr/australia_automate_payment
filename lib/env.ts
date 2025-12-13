export type RuntimeEnv = "SANDBOX" | "LIVE";

export const env = {
  dbUrl: process.env.DATABASE_URL!,
  provider: {
    LIVE: {
      base: process.env.PROVIDER_LIVE_BASE_URL!,
      key: process.env.PROVIDER_LIVE_API_KEY!
    },
    SANDBOX: {
      base: process.env.PROVIDER_SANDBOX_BASE_URL!,
      key: process.env.PROVIDER_SANDBOX_API_KEY!
    }
  },
  publicApiBase: process.env.PUBLIC_API_BASE_URL!,
  webhookSecret: process.env.WEBHOOK_SECRET!
};
