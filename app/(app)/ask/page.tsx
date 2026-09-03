"use client";

import { useState, useEffect, useRef } from "react";
import { ChatView, type ChatViewHandle } from "@/components/chat/chat-view";
import { AskMyTeacher } from "@/components/chat/ask-my-teacher";
import { getTeacherAction, type TeacherActionId } from "@/lib/teacher-actions";
import type { PedagogicalModeValue } from "@/components/chat/pedagogical-mode-selector";

interface Subject {
  key: string;
  name: string;
}

export default function AskPage() {
  const [mode, setMode] = useState("GUIDED");
  const [isAiFree, setIsAiFree] = useState(false);
  const [language, setLanguage] = useState("EN");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectKey, setSubjectKey] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [pedagogicalMode, setPedagogicalMode] = useState<PedagogicalModeValue | null>(null);

  const chatRef = useRef<ChatViewHandle>(null);

  // Load settings + subjects
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.preferredMode) setMode(s.preferredMode);
        if (s.preferredLanguage) setLanguage(s.preferredLanguage);
      })
      .catch(() => {});

    fetch("/api/subjects")
      .then((r) => r.json())
      .then((list) => {
        setSubjects(
          (list as any[]).map((s) => ({ key: s.key, name: s.name })),
        );
      })
      .catch(() => {});
  }, []);

  function handleTeacherStart({
    action,
    content,
    imageBase64,
  }: {
    action: TeacherActionId;
    content: string;
    imageBase64?: string;
  }) {
    // Follow-up action in an existing conversation → compact message
    const message = conversationId
      ? `[Same question as before] ${getTeacherAction(action)?.icon} ${getTeacherAction(action)?.label}, please.`
      : content;
    chatRef.current?.send(message, imageBase64, action);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-3xl flex-col">
      {/* Ask My Teacher panel */}
      <AskMyTeacher onStart={handleTeacherStart} disabled={isAiFree} />

      {/* Language selector */}
      <div className="mt-3 flex items-center gap-2 px-4 py-2 border-b border-ink-100 bg-white rounded-t-lg">
        <span className="text-xs text-ink-500">Language:</span>
        {(["EN", "UR", "ROMAN_UR"] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            disabled={!!conversationId}
            className={
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
              (language === lang
                ? "bg-ink-900 text-white"
                : "border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-50")
            }
          >
            {lang === "EN" ? "English" : lang === "UR" ? "اردو" : "Roman Urdu"}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 flex flex-col border-x border-b border-ink-100 bg-white rounded-b-lg overflow-hidden">
        <ChatView
          ref={chatRef}
          mode={mode}
          onModeChange={setMode}
          isAiFree={isAiFree}
          onAiFreeChange={setIsAiFree}
          language={language}
          conversationId={conversationId}
          onConversationCreated={setConversationId}
          subjects={subjects}
          subjectKey={subjectKey}
          topic={topic}
          onSubjectChange={setSubjectKey}
          onTopicChange={setTopic}
          pedagogicalMode={pedagogicalMode}
          onPedagogicalModeChange={setPedagogicalMode}
        />
      </div>
    </div>
  );
}
