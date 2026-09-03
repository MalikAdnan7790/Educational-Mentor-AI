"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export interface UseSpeechOptions {
  language: string;
  rate?: number;
  preset?: string | null;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export interface UseSpeechReturn {
  isSpeaking: boolean;
  isPaused: boolean;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  replay: () => void;
  supported: boolean;
  hasUrduVoice: boolean;
  useServerTts: boolean;
}

function findVoice(language: string): { voice: SpeechSynthesisVoice | null; hasUrdu: boolean } {
  if (typeof speechSynthesis === "undefined") return { voice: null, hasUrdu: false };

  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return { voice: null, hasUrdu: false };

  const hasUrdu = voices.some((v) => v.lang.startsWith("ur"));

  const exact = voices.find((v) => v.lang === language);
  if (exact) return { voice: exact, hasUrdu };

  const prefix = language.split("-")[0];
  const partial = voices.find((v) => v.lang.startsWith(prefix));
  if (partial) return { voice: partial, hasUrdu };

  const english = voices.find((v) => v.lang.startsWith("en")) || voices[0];
  return { voice: english ?? null, hasUrdu };
}

function speakBrowser(
  text: string,
  voice: SpeechSynthesisVoice | null,
  rate: number,
  language: string,
  onEnd: () => void,
  onError: (err: string) => void,
) {
  const sentences = text
    .split(/(?<=[.!?۔])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let idx = 0;

  function next() {
    if (idx >= sentences.length) {
      onEnd();
      return;
    }
    const utt = new SpeechSynthesisUtterance(sentences[idx]!);
    if (voice) utt.voice = voice;
    utt.rate = rate;
    utt.lang = language;
    utt.onend = () => {
      idx++;
      setTimeout(next, 80);
    };
    utt.onerror = (e) => {
      if (e.error !== "canceled") onError(`Speech error: ${e.error}`);
    };
    speechSynthesis.speak(utt);
  }

  next();
}

export function useSpeech({
  language,
  rate = 1,
  preset = null,
  onEnd,
  onError,
}: UseSpeechOptions): UseSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(true);
  const [hasUrduVoice, setHasUrduVoice] = useState(false);
  const [useServerTts, setUseServerTts] = useState(true);

  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTextRef = useRef<string>("");
  const onEndRef = useRef(onEnd);
  const onErrorRef = useRef(onError);

  onEndRef.current = onEnd;
  onErrorRef.current = onError;

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

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    speechSynthesis?.cancel();
  }, []);

  const finish = useCallback(() => {
    setIsSpeaking(false);
    setIsPaused(false);
    cleanup();
    onEndRef.current?.();
  }, [cleanup]);

  const speakServer = useCallback(
    async (text: string) => {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, preset, speed: rate }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "tts_failed" }));
        throw new Error(err.error || "tts_failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.playbackRate = rate;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        finish();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        throw new Error("audio_playback_failed");
      };

      await audio.play();
    },
    [preset, rate, finish],
  );

  const speakBrowserFn = useCallback(
    (text: string) => {
      if (typeof speechSynthesis === "undefined") return;
      speechSynthesis.cancel();
      speakBrowser(text, voice, rate, language, finish, (err) => onErrorRef.current?.(err));
    },
    [voice, rate, language, finish],
  );

  const speak = useCallback(
    (text: string) => {
      cleanup();
      lastTextRef.current = text;
      setIsSpeaking(true);
      setIsPaused(false);

      if (useServerTts) {
        speakServer(text).catch(() => {
          setUseServerTts(false);
          speakBrowserFn(text);
        });
      } else {
        speakBrowserFn(text);
      }
    },
    [cleanup, speakServer, speakBrowserFn, useServerTts],
  );

  const pause = useCallback(() => {
    if (audioRef.current && isSpeaking) {
      audioRef.current.pause();
      setIsPaused(true);
    } else if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (audioRef.current && isPaused) {
      void audioRef.current.play();
      setIsPaused(false);
    } else if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  const cancel = useCallback(() => {
    lastTextRef.current = "";
    finish();
  }, [finish]);

  const replay = useCallback(() => {
    if (lastTextRef.current) {
      speak(lastTextRef.current);
    }
  }, [speak]);

  return {
    isSpeaking,
    isPaused,
    speak,
    pause,
    resume,
    cancel,
    replay,
    supported,
    hasUrduVoice,
    useServerTts,
  };
}
