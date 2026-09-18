import { SocialPlatform } from "@prisma/client";
import { facebookConnector } from "./connectors/facebook";
import { instagramConnector } from "./connectors/instagram";
import { linkedInConnector } from "./connectors/linkedin";
import { whatsAppChannelConnector } from "./connectors/whatsapp";
import { xConnector } from "./connectors/x";
import { youtubeConnector } from "./connectors/youtube";
import { SocialConnector } from "./types";

/**
 * Registry for all INFURIZZ social platform connectors.
 * Implements the Provider/Factory pattern for clean extensibility.
 */
class ConnectorRegistry {
  private connectors: Map<SocialPlatform, SocialConnector> = new Map();

  constructor() {
    this.register(instagramConnector);
    this.register(youtubeConnector);
    this.register(xConnector);
    this.register(facebookConnector);
    this.register(linkedInConnector);
    this.register(whatsAppChannelConnector);
  }

  public register(connector: SocialConnector): void {
    this.connectors.set(connector.platform, connector);
  }

  public get(platform: SocialPlatform): SocialConnector {
    const connector = this.connectors.get(platform);
    if (!connector) {
      throw new Error(`No connector registered for platform: ${platform}`);
    }
    return connector;
  }

  public getAll(): SocialConnector[] {
    return Array.from(this.connectors.values());
  }

  public getSupportedPlatforms(): {
    platform: SocialPlatform;
    name: string;
    isConfigured: boolean;
  }[] {
    return this.getAll().map((c) => ({
      platform: c.platform,
      name: c.name,
      isConfigured: c.isConfigured,
    }));
  }
}

export const connectorRegistry = new ConnectorRegistry();
