import { chatCompletion, getFastModel } from "./client";
import { extractJson } from "./json";
import { explainAnswerResponseSchema, explainAnswerJsonSchema } from "./schemas";

export interface ExplanationEvaluation {
  reasoningCorrect: boolean;
  reasoningScore: number;
  feedback: string;
}

export async function evaluateAnswerExplanation(input: {
  problemContent: string;
  studentAnswer: string;
  answerWasCorrect: boolean;
  explanation: string;
}): Promise<ExplanationEvaluation | null> {
  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getFastModel(),
    messages: [
      {
        role: "system",
        content: `A student solved a problem and has now explained WHY they think their answer is correct. Evaluate their REASONING separately from the answer's correctness.
The answer itself was already graded — your job is only the reasoning:
- reasoningCorrect=true only if the explanation shows sound understanding of the underlying concepts and method (a lucky guess, a memorized rule applied blindly, or right-answer-wrong-why must be false).
- reasoningScore 0-100: sound reasoning = 80-100, partially sound = 40-70, flawed or absent reasoning = 0-35. A correct answer does NOT earn reasoning points by itself.
- feedback: 2-3 sentences. Point at the exact strength or flaw in their reasoning ("your justification works because…" / "you got the right value but your reason would fail on…"). Never shame. If the answer itself was wrong, focus on how their reasoning misled them.
Never reveal or restate the canonical solution.`,
      },
      {
        role: "user",
        content: `Problem: ${input.problemContent}

Student's answer: ${input.studentAnswer}
The answer was graded as: ${input.answerWasCorrect ? "CORRECT" : "INCORRECT"}

Student's explanation of why their answer is correct:
${input.explanation}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: { name: "explain_answer", schema: explainAnswerJsonSchema, strict: true } },
    temperature: 0.2,
    max_tokens: 3000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = explainAnswerResponseSchema.safeParse(extractJson(raw));
  return parsed.success ? parsed.data : null;
}
