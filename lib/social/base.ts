import type {
  ISocialProviderAdapter,
  ProviderAccountResult,
  ProviderCapabilityContract,
  ProviderLifecycleStatus,
  SupportedPlatform,
} from "./types";

export abstract class BaseSocialProviderAdapter implements ISocialProviderAdapter {
  constructor(
    public readonly platform: SupportedPlatform,
    public readonly displayName: string,
    public readonly status: ProviderLifecycleStatus,
    public readonly capabilities: ProviderCapabilityContract,
  ) {}

  abstract isConfigured(): boolean;

  get isOAuthConfigured(): boolean {
    return this.isConfigured();
  }

  async getAuthorizationUrl(..._args: unknown[]): Promise<string | null> {
    void _args;
    return null;
  }

  async handleCallback(..._args: unknown[]): Promise<{ success: boolean; account?: ProviderAccountResult; error?: string }> {
    void _args;
    return {
      success: false,
      error: `${this.displayName} API integration is not active yet in this environment.`,
    };
  }

  async fetchMetrics(..._args: unknown[]): Promise<null> {
    void _args;
    // Under strict product rules, we never synthesize or fabricate metrics.
    return null;
  }
}

export class UnconfiguredProviderAdapter extends BaseSocialProviderAdapter {
  isConfigured(): boolean {
    return false;
  }
}
