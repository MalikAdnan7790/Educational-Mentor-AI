import { getOpenAI, getFastModel } from "./client";

const LANGUAGES: Record<string, string> = {
  PYTHON: "Python",
  JAVASCRIPT: "JavaScript",
  TYPESCRIPT: "TypeScript",
  CPP: "C++",
  JAVA: "Java",
  HTML_CSS: "HTML/CSS",
  SQL: "SQL",
};

export const CODING_LANGUAGES = Object.keys(LANGUAGES);
export const CODING_LANGUAGE_LABELS = LANGUAGES;

export async function streamCodingReply(opts: {
  language: string;
  messages: { role: "user" | "assistant"; content: string }[];
  code: string | null;
}): Promise<AsyncGenerator<string>> {
  const client = getOpenAI();

  if (!client) {
    return (async function* () {
      yield "AI coding mentor is not configured.";
    })();
  }

  const langName = LANGUAGES[opts.language] ?? opts.language;

  const systemPrompt = `You are a patient coding mentor. Your job is to GUIDE students to write code themselves — never give complete solutions.

Rules:
- When a student shows code with a bug, don't fix it directly. Ask what they think the issue is, then give a hint.
- When asked "how do I do X?", explain the concept briefly, then ask them to try writing it first.
- If they're stuck after 2 hints, show a small code snippet (not the full solution) and ask them to complete it.
- Use ${langName} syntax in all code examples.
- Keep responses concise — 2-4 sentences plus any code snippet.
- Praise effort, not correctness. "Good thinking!" not "That's wrong."
- When reviewing code, point out what's good first, then what could improve.
- Format code blocks with \`\`\`${langName.toLowerCase().replace("/", "")} for proper highlighting.`;

  const apiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  if (opts.code) {
    apiMessages.push({
      role: "user",
      content: `Here's my current code:\n\`\`\`\n${opts.code}\n\`\`\``,
    });
  }

  for (const msg of opts.messages) {
    apiMessages.push(msg);
  }

  const stream = await client.chat.completions.create({
    model: getFastModel(),
    messages: apiMessages as any,
    stream: true,
    temperature: 0.4,
    max_tokens: 1500,
  });

  async function* gen() {
    for await (const chunk of stream as AsyncIterable<{ choices: { delta: { content?: string } }[] }>) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  return gen();
}
