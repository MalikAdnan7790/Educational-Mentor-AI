"use client";

interface CapabilityBannerProps {
  sttSupported: boolean;
  ttsSupported: boolean;
  hasUrduVoice: boolean;
  language: string;
}

export function CapabilityBanner({
  sttSupported,
  ttsSupported,
  hasUrduVoice,
  language,
}: CapabilityBannerProps) {
  if (!sttSupported) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        Speech recognition is not supported in this browser. Please use Chrome or Edge for the voice teacher experience.
        You can still type your questions using the text input below.
      </div>
    );
  }

  if (!ttsSupported) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
        Text-to-speech is not available in this browser. You'll see text responses instead of hearing them.
      </div>
    );
  }

  if ((language === "ur-PK" || language === "ur") && !hasUrduVoice) {
    return (
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
        No Urdu voice found on this device. Responses will be spoken in English.
        For Urdu voice support, try Microsoft Edge or install an Urdu language pack.
        Text responses will still appear in Urdu.
      </div>
    );
  }

  return null;
}
