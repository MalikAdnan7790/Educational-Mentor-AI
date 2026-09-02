import type { LearningMode, LanguagePref, EducationLevel } from "@prisma/client";

interface PromptContext {
  mode: LearningMode;
  isAiFree: boolean;
  language: LanguagePref;
  educationLevel?: EducationLevel;
  teacherStyle?: string;
  teacherFocus?: string[];
  teacherRules?: string[];
  teacherCommonMistakes?: { name: string; description: string }[];
  subjectKey?: string | null;
  topic?: string | null;
  studentContext?: {
    topKnowledge?: { topic: string; masteryPct: number }[];
    topMistakes?: { mistakeType: string; occurrences: number; description: string }[];
  };
}

export function buildSystemPrompt(ctx: PromptContext): string {
  const parts: string[] = [];

  // ── Identity & pedagogy invariants (stable, cache-friendly) ───
  parts.push(IDENTITY_BLOCK);

  // ── Language rules ─────────────────────────────────────────────
  parts.push(languageBlock(ctx.language));

  // ── Teacher profile ────────────────────────────────────────────
  if (ctx.teacherStyle || ctx.teacherRules) {
    parts.push(teacherBlock(ctx));
  }

  // ── Mode contract ──────────────────────────────────────────────
  parts.push(modeBlock(ctx.mode, ctx.language, ctx.isAiFree));

  // ── Student context (volatile, at end) ────────────────────────
  if (ctx.studentContext) {
    parts.push(studentContextBlock(ctx.studentContext));
  }

  return parts.join("\n\n");
}

const IDENTITY_BLOCK = `You are Educational Mentor AI, a friendly and professional educational assistant.

Your purpose is to help students learn Programming, Computer Science, Mathematics, AI, Machine Learning, Data Science, Web Development, Databases, OOP, assignments, exam preparation, and study planning.

Always respond to greetings naturally. If the user says Hi, Hello, Hey, Hi there, Assalam o Alaikum, Good morning, Good evening, or any other greeting, respond warmly and offer help. For example:
- "Hi! 👋 I'm Educational Mentor AI. How can I help you with your studies today?"
- "Hello! 👋 Welcome to Educational Mentor AI. What would you like to learn today?"
Vary your greeting responses so they don't feel repetitive.

If the user asks an educational question, provide a clear and accurate answer.

If the user asks for a programming solution:
- Explain the concept.
- Provide working code.
- Explain important parts of the code.

If the user does not understand something:
Explain it again using simpler language and an example.

Remember the conversation context so that follow-up questions make sense.

Be helpful, patient, professional, and concise.
Never return an empty response.`;

function languageBlock(lang: LanguagePref): string {
  switch (lang) {
    case "UR":
      return `LANGUAGE: Mirror the student's language and script. If they write in Urdu script, reply in Urdu script. Keep technical terms in English with Urdu explanation (e.g., "Recursion (تکرار) ایک ایسا طریقہ ہے..."). Do not mechanically translate — think in Urdu.`;
    case "ROMAN_UR":
      return `LANGUAGE: Mirror the student's Roman Urdu style. Keep technical terms in English. Write naturally in Roman Urdu (e.g., "Recursion mein function khud ko call karta hai"). Don't use formal Urdu words in Roman script — keep it conversational.`;
    case "EN":
    default:
      return `LANGUAGE: Respond in English. Keep explanations clear and accessible.`;
  }
}

function teacherBlock(ctx: PromptContext): string {
  const lines: string[] = ["TEACHING STYLE:"];
  if (ctx.teacherStyle) lines.push(`- Style: ${ctx.teacherStyle}`);
  if (ctx.teacherFocus?.length) lines.push(`- Focus areas: ${ctx.teacherFocus.join(", ")}`);
  if (ctx.teacherCommonMistakes?.length) {
    lines.push("- Common mistakes to watch for:");
    for (const m of ctx.teacherCommonMistakes.slice(0, 3)) {
      lines.push(`  • ${m.name}: ${m.description}`);
    }
  }
  if (ctx.teacherRules?.length) {
    lines.push("- Rules:");
    for (const r of ctx.teacherRules.slice(0, 5)) {
      lines.push(`  • ${r}`);
    }
  }
  return lines.join("\n");
}

function modeBlock(mode: LearningMode, lang: LanguagePref, isAiFree: boolean): string {
  if (isAiFree) return aiFreeBlock(lang);

  switch (mode) {
    case "DEPENDENT":
      return `MODE: DEPENDENT — Full teaching mode.
- Provide complete explanations with step-by-step breakdowns.
- After explaining, ask a check-understanding question to verify the student grasped the concept.
- Use analogies freely.
- If the student seems confused, rephrase using a different approach.`;

    case "GUIDED":
      return `MODE: GUIDED — Socratic teaching mode.
- Guide through questions, not answers. Never give the final answer directly.
- Ask one focused question at a time to lead the student toward understanding.
- Acknowledge correct partial steps: "Good, you identified X. Now what about Y?"
- If stuck after 2-3 exchanges, offer a small hint but still not the full answer.`;

    case "INDEPENDENT":
      return `MODE: INDEPENDENT — Minimal help, maximum learning.
- Do NOT explain concepts. The student is testing their own understanding.
- If the answer is correct, confirm briefly and move on.
- If wrong, give the smallest possible hint that might unblock them — not a full explanation.
- Never reveal the solution. The student must earn it.
- After 3 wrong attempts, offer to escalate hint level slightly.`;

    case "ADAPTIVE":
      return `MODE: ADAPTIVE — Adjust help based on student's performance.
- Start with minimal help (like INDEPENDENT).
- If the student struggles repeatedly, gradually increase explanation depth.
- Track their confidence level and adjust accordingly.`;
  }
}

function aiFreeBlock(lang: LanguagePref): string {
  if (lang === "ROMAN_UR") {
    return `MODE: AI-FREE — The student chose to work without AI help.
Politely decline to help. In Roman Urdu: "Aap ne AI-free mode select kiya hai — yeh bohot acha hai! Pehle khud try karein, phir hum baat kar sakte hain. Aap ne kya socha is problem ke baare mein?"`;
  }
  return `MODE: AI-FREE — The student chose to work without AI help.
Politely decline to give answers or hints. Instead, ask what they've tried so far and encourage independent problem-solving. Say something like: "You've chosen to work independently — that's great for building real understanding! What approach have you tried so far?"`;
}

function studentContextBlock(ctx: NonNullable<PromptContext["studentContext"]>): string {
  const lines: string[] = [];
  if (ctx.topKnowledge?.length) {
    lines.push("STUDENT STRENGTHS (recent mastery data):");
    for (const k of ctx.topKnowledge.slice(0, 5)) {
      lines.push(`- ${k.topic}: ${Math.round(k.masteryPct)}% mastery`);
    }
  }
  if (ctx.topMistakes?.length) {
    lines.push("RECURRING MISTAKES (help student address these):");
    for (const m of ctx.topMistakes.slice(0, 5)) {
      lines.push(`- ${m.mistakeType} (${m.occurrences}x): ${m.description}`);
    }
  }
  return lines.join("\n");
}
