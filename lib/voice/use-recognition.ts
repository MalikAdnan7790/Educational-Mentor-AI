"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export interface UseRecognitionOptions {
  language: string; // BCP-47, e.g. "en-US", "ur-PK"
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export interface UseRecognitionReturn {
  isListening: boolean;
  interimTranscript: string;
  start: () => void;
  stop: () => void;
  supported: boolean;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access denied. Please allow microphone access in your browser settings.",
  "no-speech": "No speech detected. Try speaking closer to the microphone.",
  "audio-capture": "No microphone found. Please connect a microphone.",
  "network": "Network error during speech recognition. Check your connection.",
  "aborted": "Speech recognition was stopped.",
};

export function useRecognition({ language, onResult, onError }: UseRecognitionOptions): UseRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartCountRef = useRef(0);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      restartCountRef.current = 0;
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          onResult(transcript.trim(), true);
          setInterimTranscript("");
        } else {
          interim += transcript;
        }
      }

      if (interim) setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      const msg = ERROR_MESSAGES[event.error] || `Speech error: ${event.error}`;
      if (event.error !== "aborted" && event.error !== "no-speech") {
        onError?.(msg);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");

      // Auto-restart if we should still be listening
      if (shouldListenRef.current) {
        restartCountRef.current++;
        // Storm guard: don't restart more than 5 times in rapid succession
        if (restartCountRef.current > 5) {
          shouldListenRef.current = false;
          onError?.("Speech recognition is having trouble. Please try again.");
          return;
        }
        const delay = Math.min(1000 * restartCountRef.current, 3000);
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldListenRef.current) {
            try {
              recognition.start();
              setIsListening(true);
            } catch {
              // Already started
            }
          }
        }, delay);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      try { recognition.stop(); } catch {}
    };
  }, [language]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    shouldListenRef.current = true;
    restartCountRef.current = 0;

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      // Already started
    }
  }, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    const recognition = recognitionRef.current;
    if (recognition) {
      try { recognition.stop(); } catch {}
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  return { isListening, interimTranscript, start, stop, supported };
}
