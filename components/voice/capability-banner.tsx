"use client";

import { AlertTriangle, Volume2, Languages } from "lucide-react";

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
      <div className="flex items-start gap-3 rounded-2xl border-2 border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-700">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral-400/15 text-coral-500">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">Speech recognition not supported</p>
          <p className="mt-0.5 text-coral-600">
            Please use Chrome or Edge for the voice teacher experience.
            You can still type your questions using the text input below.
          </p>
        </div>
      </div>
    );
  }

  if (!ttsSupported) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-500">
          <Volume2 className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">Text-to-speech unavailable</p>
          <p className="mt-0.5 text-amber-600">
            You'll see text responses instead of hearing them.
          </p>
        </div>
      </div>
    );
  }

  if ((language === "ur-PK" || language === "ur") && !hasUrduVoice) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border-2 border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/15 text-sky-500">
          <Languages className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">No Urdu voice found</p>
          <p className="mt-0.5 text-sky-600">
            Responses will be spoken in English. For Urdu voice support, try Microsoft Edge or install an Urdu language pack.
            Text responses will still appear in Urdu.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
