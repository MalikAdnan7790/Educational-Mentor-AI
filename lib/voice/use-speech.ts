"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export interface UseSpeechOptions {
  language: string; // BCP-47
  rate?: number;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export interface UseSpeechReturn {
  isSpeaking: boolean;
  speak: (text: string) => void;
  cancel: () => void;
  supported: boolean;
  hasUrduVoice: boolean;
}

function findVoice(language: string): { voice: SpeechSynthesisVoice | null; hasUrdu: boolean } {
  if (typeof speechSynthesis === "undefined") return { voice: null, hasUrdu: false };

  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return { voice: null, hasUrdu: false };

  const hasUrdu = voices.some((v) => v.lang.startsWith("ur"));

  // Preference chain: exact match → language prefix → English fallback
  const exact = voices.find((v) => v.lang === language);
  if (exact) return { voice: exact, hasUrdu };

  const prefix = language.split("-")[0];
  const partial = voices.find((v) => v.lang.startsWith(prefix));
  if (partial) return { voice: partial, hasUrdu };

  const english = voices.find((v) => v.lang.startsWith("en")) || voices[0];
  return { voice: english ?? null, hasUrdu };
}

export function useSpeech({ language, rate = 1, onEnd, onError }: UseSpeechOptions): UseSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const [hasUrduVoice, setHasUrduVoice] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  const queueRef = useRef<string[]>([]);
  const speakingRef = useRef(false);

  // Load voices (they load async on most browsers)
  useEffect(() => {
    if (typeof speechSynthesis === "undefined") {
      setSupported(false);
      return;
    }

    const loadVoices = () => {
      const result = findVoice(language);
      setVoice(result.voice);
      setHasUrduVoice(result.hasUrdu);
    };

    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [language]);

  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0) {
      speakingRef.current = false;
      setIsSpeaking(false);
      onEnd?.();
      return;
    }

    const text = queueRef.current.shift()!;
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.lang = language;

    utterance.onend = () => {
      // Small delay before next sentence for natural pacing
      setTimeout(() => processQueue(), 100);
    };

    utterance.onerror = (event) => {
      if (event.error !== "canceled") {
        onError?.(`Speech error: ${event.error}`);
      }
      speakingRef.current = false;
      setIsSpeaking(false);
    };

    speechSynthesis.speak(utterance);
  }, [voice, rate, language, onEnd, onError]);

  const speak = useCallback(
    (text: string) => {
      if (typeof speechSynthesis === "undefined") return;

      // Cancel any current speech
      speechSynthesis.cancel();

      // Split into sentences (handles both English . and Urdu ۔)
      const sentences = text
        .split(/(?<=[.!?۔])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      queueRef.current = sentences;
      speakingRef.current = true;
      setIsSpeaking(true);
      processQueue();
    },
    [processQueue],
  );

  const cancel = useCallback(() => {
    if (typeof speechSynthesis === "undefined") return;
    queueRef.current = [];
    speechSynthesis.cancel();
    speakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, cancel, supported, hasUrduVoice };
}
