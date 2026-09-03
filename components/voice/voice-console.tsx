"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Avatar } from "./avatar";
import { MicButton } from "./mic-button";
import { Transcript } from "./transcript";
import { VoiceControls } from "./voice-controls";
import { CapabilityBanner } from "./capability-banner";
import { useRecognition } from "@/lib/voice/use-recognition";
import { useSpeech } from "@/lib/voice/use-speech";
import { streamMessage } from "@/lib/stream-client";

type VoiceState = "idle" | "listening" | "processing" | "thinking" | "speaking" | "error";

interface TranscriptMessage {
  role: "user" | "assistant";
  text: string;
  isRTL?: boolean;
}

interface VoiceConsoleProps {
  conversationId: string;
  language: "EN" | "UR" | "ROMAN_UR";
  mode: "DEPENDENT" | "GUIDED" | "ADAPTIVE" | "INDEPENDENT";
  avatarGender: "MALE" | "FEMALE";
  voiceRate: number;
}

const LANG_MAP: Record<string, string> = {
  EN: "en-US",
  UR: "ur-PK",
  ROMAN_UR: "en-US", // Roman Urdu spoken as English STT
};

export function VoiceConsole({
  conversationId,
  language,
  mode,
  avatarGender,
  voiceRate: initialRate,
}: VoiceConsoleProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rate, setRate] = useState(initialRate);
  const [isMuted, setIsMuted] = useState(false);
  const [voicePreset, setVoicePreset] = useState("FRIENDLY");
  const lastReplyRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const bcpLang = LANG_MAP[language] ?? "en-US";
  const isRTL = language === "UR";

  const handleFinalTranscript = useCallback(
    async (transcript: string) => {
      if (!transcript.trim()) return;

      // Stop listening while processing
      setState("processing");

      // Add user message
      setMessages((prev) => [...prev, { role: "user", text: transcript, isRTL }]);

      // Stream mentor reply
      setState("thinking");
      let fullText = "";

      try {
        abortRef.current = new AbortController();
        await streamMessage(
          `/api/conversations/${conversationId}/messages`,
          { content: transcript },
          {
            onDelta: (delta) => {
              fullText += delta;
              setState("speaking");
            },
            onDone: (text) => {
              fullText = text;
              lastReplyRef.current = text;

              setMessages((prev) => [
                ...prev,
                { role: "assistant", text, isRTL },
              ]);

              // Speak if not muted
              if (!isMuted) {
                speak(text);
              } else {
                setState("idle");
              }
            },
            onError: (err) => {
              setError(err);
              setState("error");
            },
          },
          abortRef.current.signal,
        );
      } catch {
        setError("Failed to get response. Please try again.");
        setState("error");
      }
    },
    [conversationId, isRTL, isMuted],
  );

  const {
    isListening,
    interimTranscript,
    start: startListening,
    stop: stopListening,
    supported: sttSupported,
  } = useRecognition({
    language: bcpLang,
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        stopListening();
        handleFinalTranscript(transcript);
      }
    },
    onError: (err) => {
      setError(err);
      setState("error");
    },
  });

  const {
    isSpeaking,
    isPaused,
    speak,
    cancel: cancelSpeech,
    pause,
    resume,
    replay: hookReplay,
    supported: ttsSupported,
    hasUrduVoice,
  } = useSpeech({
    language: bcpLang,
    rate,
    preset: voicePreset,
    onEnd: () => {
      setTimeout(() => {
        setState("idle");
      }, 250);
    },
    onError: () => {
      setState("idle");
    },
  });

  // Sync speaking state
  useEffect(() => {
    if (isSpeaking && state !== "speaking") setState("speaking");
  }, [isSpeaking]);

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
      setState("idle");
    } else if (state === "speaking") {
      // Tap to interrupt
      cancelSpeech();
      setState("idle");
      setTimeout(() => startListening(), 250);
    } else {
      setError(null);
      setState("listening");
      startListening();
    }
  }, [isListening, state, startListening, stopListening, cancelSpeech]);

  const handleReplay = useCallback(() => {
    if (lastReplyRef.current && !isMuted) {
      cancelSpeech();
      hookReplay();
    }
  }, [isMuted, cancelSpeech, hookReplay]);

  const avatarState =
    state === "listening" ? "listening"
    : state === "thinking" || state === "processing" ? "thinking"
    : state === "speaking" ? "speaking"
    : "idle";

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      <CapabilityBanner
        sttSupported={sttSupported}
        ttsSupported={ttsSupported}
        hasUrduVoice={hasUrduVoice}
        language={bcpLang}
      />

      {/* Avatar */}
      <Avatar gender={avatarGender} state={avatarState} className="h-32 w-32 sm:h-40 sm:w-40" />

      {/* Status text */}
      <p className="text-sm font-medium text-ink-500 text-center">
        {state === "idle" && "Tap the microphone to start"}
        {state === "listening" && <span className="text-sky-600">Listening...</span>}
        {state === "processing" && <span className="text-amber-600">Processing...</span>}
        {state === "thinking" && <span className="text-purple-600">Thinking...</span>}
        {state === "speaking" && <span className="text-mint-600">Speaking... (tap mic to interrupt)</span>}
        {state === "error" && <span className="text-coral-600">{error}</span>}
      </p>

      {/* Mic button */}
      <MicButton
        isListening={isListening}
        onClick={handleMicClick}
        disabled={!sttSupported && state !== "speaking"}
      />

      {/* Controls */}
      <VoiceControls
        rate={rate}
        onRateChange={setRate}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((m) => !m)}
        onReplay={handleReplay}
        canReplay={!!lastReplyRef.current}
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        onPause={pause}
        onResume={resume}
        preset={voicePreset}
        onPresetChange={setVoicePreset}
      />

      {/* Transcript */}
      {(messages.length > 0 || interimTranscript) && (
        <div className="w-full rounded-2xl border-2 border-ink-100 bg-white p-4">
          <Transcript
            messages={messages}
            interimTranscript={interimTranscript}
            isRTL={isRTL}
          />
        </div>
      )}
    </div>
  );
}
