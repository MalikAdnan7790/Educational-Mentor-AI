"use client";

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { MessageSquare, AlertCircle, X } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { Composer } from "./composer";
import { ModeSelector } from "./mode-selector";
import { PedagogicalModeSelector, type PedagogicalModeValue } from "./pedagogical-mode-selector";
import { SubjectChips } from "./subject-chips";
import { ExplainBackModal } from "./explain-back-modal";
import { streamMessage } from "@/lib/stream-client";
import type { TeacherActionId } from "@/lib/teacher-actions";

export interface ChatViewHandle {
  send: (content: string, imageBase64?: string, teacherAction?: TeacherActionId) => void;
}

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  language?: string | null;
  wasFullExplanation?: boolean;
}

interface Subject {
  key: string;
  name: string;
}

interface ChatViewProps {
  mode: string;
  onModeChange: (mode: string) => void;
  isAiFree: boolean;
  onAiFreeChange: (isAiFree: boolean) => void;
  language: string;
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
  initialMessages?: Message[];
  subjects: Subject[];
  subjectKey: string | null;
  topic: string | null;
  onSubjectChange: (key: string | null) => void;
  onTopicChange: (topic: string | null) => void;
  pedagogicalMode: PedagogicalModeValue | null;
  onPedagogicalModeChange: (mode: PedagogicalModeValue | null) => void;
}

export const ChatView = forwardRef<ChatViewHandle, ChatViewProps>(function ChatView({
  mode,
  onModeChange,
  isAiFree,
  onAiFreeChange,
  language,
  conversationId,
  onConversationCreated,
  initialMessages,
  subjects,
  subjectKey,
  topic,
  onSubjectChange,
  onTopicChange,
  pedagogicalMode,
  onPedagogicalModeChange,
}, ref) {
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<{ message: string; retryContent?: string; retryImage?: string; retryAction?: TeacherActionId } | null>(null);
  const [explainBackTarget, setExplainBackTarget] = useState<{
    topic: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const msgIdCounter = useRef(0);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Escape key cancels streaming
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isStreaming) {
        abortRef.current?.abort();
        setIsStreaming(false);
        setStreamingText("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isStreaming]);

  const handleSend = useCallback(
    async (content: string, imageBase64?: string, teacherAction?: TeacherActionId) => {
      setError(null);

      // If no conversation yet, create one
      let activeId = conversationId;
      if (!activeId) {
        try {
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "TEXT",
              mode,
              isAiFree,
              language,
              subjectKey: subjectKey ?? undefined,
              topic: topic ?? undefined,
              pedagogicalMode: pedagogicalMode ?? undefined,
            }),
          });
          if (!res.ok) {
            const response = (await res.json().catch(() => null)) as {
              error?: string;
              details?: {
                formErrors?: string[];
                fieldErrors?: Record<string, string[]>;
              };
            } | null;
            const detail =
              response?.details?.formErrors?.[0] ??
              Object.values(response?.details?.fieldErrors ?? {}).flat()[0] ??
              response?.error;
            throw new Error(detail ?? `Request failed (${res.status})`);
          }
          const conv = await res.json();
          activeId = conv.id as string;
          onConversationCreated(activeId);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unable to create conversation";
          setError({ message: `Failed to start conversation: ${message}` });
          return;
        }
      }

      // Add user message to UI
      const userMsgId = `local-${++msgIdCounter.current}`;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "USER", content, language },
      ]);

      // Start streaming
      setIsStreaming(true);
      setStreamingText("");

      const controller = new AbortController();
      abortRef.current = controller;

      await streamMessage(
        `/api/conversations/${activeId}/messages`,
        { content, imageBase64, teacherAction },
        {
          onDelta: (delta) => {
            setStreamingText((prev) => prev + delta);
          },
          onDone: (fullText, messageId) => {
            setStreamingText("");
            setIsStreaming(false);

            const assistantMsgId = messageId ?? `local-${++msgIdCounter.current}`;
            const wasFullExplanation = fullText.includes("<<<META>>>");

            setMessages((prev) => [
              ...prev,
              {
                id: assistantMsgId,
                role: "ASSISTANT",
                content: fullText.replace(/<<<META>>>[\s\S]*$/, "").trim(),
                language,
                wasFullExplanation,
              },
            ]);
          },
          onError: (err) => {
            setIsStreaming(false);
            setStreamingText("");
            const friendly: Record<string, string> = {
              stream_failed: "AI is unavailable. Try again shortly.",
              ai_unavailable: "AI mentor is temporarily unavailable. Please try again.",
              unauthorized: "Please log in again to continue.",
              stream_interrupted: "Connection was interrupted. Please try again.",
              no_body: "Could not read the AI response.",
              rate_limit: "Rate limited. Please wait a moment and try again.",
              context_too_long: "This conversation is getting long. Try starting a new one.",
              content_filter: "Response was blocked by a content filter. Try rephrasing.",
              overloaded: "AI is temporarily overloaded. Please try again.",
              timeout: "The AI took too long to respond. Please try again.",
            };
            setError({
              message: friendly[err] ?? err,
              retryContent: content,
              retryImage: imageBase64,
              retryAction: teacherAction,
            });
          },
        },
        controller.signal,
      );
    },
    [conversationId, mode, isAiFree, language, subjectKey, topic, pedagogicalMode, onConversationCreated],
  );

  useImperativeHandle(
    ref,
    () => ({
      send: (content, imageBase64, teacherAction) => {
        if (!isStreaming) void handleSend(content, imageBase64, teacherAction);
      },
    }),
    [handleSend, isStreaming],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex flex-col gap-2 border-b-2 border-ink-100 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <ModeSelector
            value={mode}
            onChange={onModeChange}
            isAiFree={isAiFree}
            onAiFreeChange={onAiFreeChange}
            disabled={!!conversationId}
          />
          <SubjectChips
            subjectKey={subjectKey}
            topic={topic}
            onSubjectChange={onSubjectChange}
            onTopicChange={onTopicChange}
            subjects={subjects}
          />
        </div>
        <PedagogicalModeSelector
          value={pedagogicalMode}
          onChange={onPedagogicalModeChange}
          disabled={!!conversationId}
        />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" role="log" aria-live="polite" aria-label="Conversation messages">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-400/15 mb-3">
              <MessageSquare className="h-8 w-8 text-sky-500" />
            </div>
            <h2 className="text-lg font-extrabold text-ink-900 mb-1">Ask Anything</h2>
            <p className="text-sm text-ink-500 max-w-sm">
              Ask a question in English, Urdu, or Roman Urdu. Attach an image or PDF for visual problems.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble
              role={msg.role}
              content={msg.content}
              language={msg.language ?? language}
              messageId={msg.role === "ASSISTANT" ? msg.id : undefined}
            />
            {msg.role === "ASSISTANT" && msg.wasFullExplanation && !isAiFree && topic && (
              <div className="flex justify-end mt-1">
                <button
                  onClick={() => setExplainBackTarget({ topic: topic! })}
                  className="text-xs font-medium text-ink-400 hover:text-ink-600 underline"
                >
                  Explain it back
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Streaming in progress */}
        {isStreaming && streamingText && (
          <MessageBubble
            role="ASSISTANT"
            content={streamingText}
            language={language}
            isStreaming
          />
        )}
        {isStreaming && !streamingText && (
          <div className="flex gap-1.5 px-4 py-2">
            <span className="thinking-dot h-2 w-2 rounded-full bg-mint-400" />
            <span className="thinking-dot h-2 w-2 rounded-full bg-mint-400" />
            <span className="thinking-dot h-2 w-2 rounded-full bg-mint-400" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border-2 border-coral-200 bg-coral-50 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-coral-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-coral-700">{error.message}</p>
              {error.retryContent && (
                <button
                  onClick={() => {
                    const retry = error;
                    setError(null);
                    void handleSend(retry.retryContent!, retry.retryImage, retry.retryAction);
                  }}
                  aria-label="Retry sending message"
                  className="mt-2 text-xs font-bold text-coral-600 hover:text-coral-800 underline"
                >
                  Try again
                </button>
              )}
            </div>
            <button
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="text-coral-400 hover:text-coral-600 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Composer */}
      <Composer onSend={handleSend} disabled={isStreaming} isAiFree={isAiFree} />

      {/* Explain-back modal */}
      {explainBackTarget && (
        <ExplainBackModal
          conversationId={conversationId!}
          subjectKey={subjectKey}
          topic={explainBackTarget.topic}
          onClose={() => setExplainBackTarget(null)}
        />
      )}
    </div>
  );
});
