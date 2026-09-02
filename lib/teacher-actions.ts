/**
 * Teacher Assistance Modes — the six actions offered after Ask My Teacher
 * analysis. Client-safe module (no server imports).
 *
 * `directive` is appended to the user message server-side and steers the
 * mentor's reply without being stored in the conversation transcript.
 */
export const TEACHER_ACTIONS = [
  {
    id: "HINT",
    label: "Give Me a Hint",
    icon: "💡",
    description: "A nudge in the right direction — no answer.",
    directive:
      "[Teacher action: HINT] Give exactly ONE small hint that points the student in the right direction. Do NOT reveal the answer or the full method. End with an encouraging question that helps them take the next step themselves.",
  },
  {
    id: "GUIDE",
    label: "Guide Me",
    icon: "👨‍🏫",
    description: "Step-by-step Socratic guidance (recommended).",
    directive:
      "[Teacher action: GUIDE] Guide the student step by step using Socratic questioning. Break the problem into small steps. Ask a guiding question after each step and wait for the student's response. NEVER reveal the final answer immediately — let the student reach it themselves.",
  },
  {
    id: "CHECK",
    label: "Check My Solution",
    icon: "🔎",
    description: "Verify my work and tell me if it's right.",
    directive:
      "[Teacher action: CHECK] Review the student's solution/attempt. Point out which parts are correct and which parts need another look — but do not fix the incorrect parts for them. Be specific about the step, not the answer.",
  },
  {
    id: "MISTAKE",
    label: "Find My Mistake",
    icon: "❌",
    description: "Locate exactly where my working went wrong.",
    directive:
      "[Teacher action: FIND MISTAKE] Analyze HOW the student approached the problem. Identify the exact step where their reasoning or calculation went wrong, what misconception likely caused it, and what they did well. Explain kindly — never insult. Help them see the error so they can correct it themselves.",
  },
  {
    id: "CONCEPT",
    label: "Explain the Concept",
    icon: "📚",
    description: "Teach the underlying idea behind this problem.",
    directive:
      "[Teacher action: EXPLAIN CONCEPT] Teach the underlying concept this problem is testing. Use a clear explanation, one simple example, and one real-world connection. Do not solve this specific problem — give the student the understanding to solve it themselves.",
  },
  {
    id: "SOLUTION",
    label: "Show Full Solution",
    icon: "✅",
    description: "Walk me through the complete solution.",
    directive:
      "[Teacher action: FULL SOLUTION] The student has explicitly asked for the full solution. Walk through the complete solution step by step, explaining the reasoning at every step. Finish with one similar practice question so they can test whether they truly understood.",
  },
] as const;

export type TeacherActionId = (typeof TEACHER_ACTIONS)[number]["id"];

export function getTeacherAction(id: string): (typeof TEACHER_ACTIONS)[number] | undefined {
  return TEACHER_ACTIONS.find((a) => a.id === id);
}

export const DEFAULT_ACTION: TeacherActionId = "GUIDE";
