import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "INFURIZZ — Creator Marketplace & Brand Collaboration Platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#efeae2",
          padding: "70px 80px",
          position: "relative",
        }}
      >
        {/* Subtle decorative grid borders */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            right: 24,
            bottom: 24,
            border: "1px solid rgba(22, 20, 17, 0.15)",
            pointerEvents: "none",
            display: "flex",
          }}
        />

        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#161411",
              display: "flex",
              alignItems: "center",
            }}
          >
            INFURIZZ
          </div>
          <div
            style={{
              fontSize: 14,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#6f2e2a",
              fontWeight: 600,
              display: "flex",
            }}
          >
            Creator Marketplace &amp; Identity Layer
          </div>
        </div>

        {/* Hero Title & Positioning */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 64,
              lineHeight: 1.1,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: "#161411",
            }}
          >
            <span>One Creator.</span>
            <span>Multiple Platforms.</span>
            <span>One Identity.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              lineHeight: 1.4,
              color: "#5c5549",
              maxWidth: 820,
              fontStyle: "italic",
            }}
          >
            Discover verified creators, launch transparent briefs, and build structured brand collaborations.
          </div>
        </div>

        {/* Footer badges */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(22, 20, 17, 0.2)",
            paddingTop: 24,
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: "#161411",
              display: "flex",
              gap: 20,
              fontWeight: 500,
            }}
          >
            <span>Verified Storefronts</span>
            <span>·</span>
            <span>Multi-Platform Analytics</span>
            <span>·</span>
            <span>Transparent Briefs</span>
          </div>
          <div
            style={{
              fontSize: 16,
              color: "#6f2e2a",
              fontWeight: 600,
              letterSpacing: "0.05em",
              display: "flex",
            }}
          >
            infurizzv1.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
