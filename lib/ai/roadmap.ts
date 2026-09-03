import { chatCompletion, getFastModel } from "./client";
import { extractJson } from "./json";
import { roadmapResponseSchema, roadmapJsonSchema } from "./schemas";

export interface RoadmapTask {
  title: string;
  description: string;
  activityType: "READ" | "PRACTICE" | "QUIZ" | "REVIEW" | "EXERCISE" | "VIDEO";
  topic: string;
  estimatedMinutes: number;
}

export interface RoadmapWeek {
  week: number;
  theme: string;
  tasks: RoadmapTask[];
}

export interface StudyRoadmap {
  title: string;
  weeks: RoadmapWeek[];
}

export async function generateRoadmap(input: {
  subjectKey?: string;
  topic?: string;
  weekCount: number;
  strengths: string[];
  weaknesses: string[];
  recentScores: { topic: string; score: number }[];
}): Promise<StudyRoadmap | null> {
  const subject = input.subjectKey ? `Subject: ${input.subjectKey}` : "";
  const topic = input.topic ? `Focus topic: ${input.topic}` : "";

  const strengths = input.strengths.length > 0
    ? `Strengths: ${input.strengths.join(", ")}`
    : "Strengths: none recorded yet";

  const weaknesses = input.weaknesses.length > 0
    ? `Weaknesses to address: ${input.weaknesses.join(", ")}`
    : "Weaknesses: none recorded yet";

  const scores = input.recentScores.length > 0
    ? `Recent exam scores:\n${input.recentScores.map((s) => `  - ${s.topic}: ${s.score}%`).join("\n")}`
    : "No recent exam scores available.";

  const resp = await chatCompletion<{ choices?: { message?: { content?: string } }[] }>({
    model: getFastModel(),
    messages: [
      {
        role: "system",
        content:
          "You are an expert study planner. Create a structured week-by-week study roadmap tailored to the student's strengths, weaknesses, and recent performance. Each week has a theme and 3-5 concrete tasks. Tasks should progress from foundational review to practice to assessment. Be specific — name exact topics, not vague advice. Mix activity types: READ for theory, PRACTICE for problem-solving, QUIZ for self-testing, REVIEW for revision, EXERCISE for hands-on work. estimatedMinutes should be realistic (15-60 min per task).",
      },
      {
        role: "user",
        content: `${subject}\n${topic}\nCreate a ${input.weekCount}-week study plan.\n\n${strengths}\n${weaknesses}\n${scores}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: { name: "roadmap", schema: roadmapJsonSchema, strict: true } },
    temperature: 0.5,
    max_tokens: 4000,
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = roadmapResponseSchema.safeParse(extractJson(raw));
  if (!parsed.success) return null;
  return parsed.data;
}
