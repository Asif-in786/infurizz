"use client";

export function DisconnectPlatformButton({ platformName }: { platformName: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(`Disconnect ${platformName}?`)) {
          e.preventDefault();
        }
      }}
      className="text-xs text-muted hover:text-oxblood underline"
    >
      Disconnect Platform
    </button>
  );
}
