import "server-only";
import { prisma } from "@/lib/db";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "is", "are", "was", "were",
  "be", "been", "being", "to", "of", "in", "on", "at", "for", "with", "by",
  "from", "as", "it", "its", "this", "that", "these", "those", "i", "you",
  "he", "she", "we", "they", "me", "him", "her", "us", "them", "my", "your",
  "what", "which", "who", "how", "when", "where", "why", "do", "does", "did",
  "can", "could", "should", "would", "will", "shall", "may", "might", "not",
  "no", "yes", "so", "than", "too", "very", "just", "about", "into", "over",
  "explain", "help", "please", "question", "answer", "tell", "know", "dont",
  "dont", "cant", "im", "ive", "get", "got", "use", "using",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Keyword-overlap retrieval over the student's uploaded note chunks.
 * Deliberately simple: note corpora are small (a handful of documents),
 * so lexical scoring is fast and needs no embeddings service.
 */
export async function retrieveNoteContext(
  studentId: string,
  query: string,
  limit = 3,
): Promise<string | null> {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return null;

  const chunks = await prisma.noteChunk.findMany({
    where: { doc: { studentId } },
    select: {
      content: true,
      idx: true,
      doc: { select: { title: true } },
    },
    take: 400,
    orderBy: [{ docId: "asc" }, { idx: "asc" }],
  });
  if (chunks.length === 0) return null;

  const scored = chunks
    .map((c) => {
      const tokens = tokenize(c.content);
      let overlap = 0;
      for (const t of tokens) {
        if (queryTokens.has(t)) overlap += 1;
      }
      // Normalize by chunk length so long chunks don't win on volume alone
      return { chunk: c, score: overlap / Math.sqrt(Math.max(1, tokens.length)) };
    })
    .filter((s) => s.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (scored.length === 0) return null;

  const sections = scored.map(
    (s) => `--- From "${s.chunk.doc.title}" (part ${s.chunk.idx + 1}) ---\n${s.chunk.content.slice(0, 1500)}`,
  );

  return [
    "The student has uploaded their own study notes. When they are relevant to the question, PRIORITIZE this material — base your explanation on it, use its terminology, and cite it as 'your notes'. If the notes contradict general knowledge, gently point it out.",
    ...sections,
  ].join("\n\n");
}
