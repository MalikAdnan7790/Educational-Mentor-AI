"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Mic, MessageCircle, ScrollText } from "lucide-react";

interface Conversation {
  id: string;
  kind: "TEXT" | "VOICE";
  mode: string;
  language: string;
  subjectKey: string | null;
  topic: string | null;
  title: string | null;
  status: string;
  messageCount: number;
  lastMessageAt: string;
  _count?: { messages: number };
}

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<"ALL" | "TEXT" | "VOICE">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("kind", filter);
    fetch(`/api/conversations?${params}`)
      .then((r) => r.json())
      .then((data) => setConversations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-ink-500">Loading history…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-500">
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-ink-900">History</h1>
            <p className="text-sm text-ink-500">Your past conversations and voice sessions.</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {(["ALL", "TEXT", "VOICE"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
                filter === f ? "bg-ink-900 text-white" : "border border-ink-200 text-ink-600 hover:bg-ink-50",
              )}
            >
              {f === "ALL" ? "All" : f === "TEXT" ? "Text" : "Voice"}
            </button>
          ))}
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-ink-500">No conversations yet.</p>
          <Link href="/ask" className="btn-primary mt-3 inline-flex text-sm">
            Start a conversation
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={c.kind === "VOICE" ? "/voice" : "/ask"}
              className="card flex items-center gap-4 p-4 hover:border-ink-300 transition-colors"
            >
              <div
                className={clsx(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  c.kind === "VOICE" ? "bg-sky-400/15 text-sky-500" : "bg-mint-400/15 text-mint-500",
                )}
              >
                {c.kind === "VOICE" ? <Mic className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">
                  {c.title || (c.kind === "VOICE" ? "Voice session" : "Chat session")}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-500">
                  <span>{c.mode}</span>
                  {c.topic && <span>· {c.topic}</span>}
                  <span>· {c._count?.messages ?? c.messageCount} messages</span>
                </div>
              </div>
              <span className="text-xs text-ink-400 shrink-0">
                {new Date(c.lastMessageAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
