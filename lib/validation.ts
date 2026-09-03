import { z } from "zod";

export const idSchema = z.string().cuid();

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
  educationLevel: z.enum(["SCHOOL", "COLLEGE", "UNIVERSITY", "PROFESSIONAL"]).default("SCHOOL"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
});

export const settingsSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  educationLevel: z.enum(["SCHOOL", "COLLEGE", "UNIVERSITY", "PROFESSIONAL"]).optional(),
  preferredLanguage: z.enum(["EN", "UR", "ROMAN_UR"]).optional(),
  teacherAvatar: z.enum(["MALE", "FEMALE"]).optional(),
  voiceRate: z.number().min(0.75).max(1.5).optional(),
  preferredMode: z.enum(["DEPENDENT", "GUIDED", "ADAPTIVE", "INDEPENDENT"]).optional(),
});

export const createSessionSchema = z.object({
  problemId: z.string().cuid(),
  mode: z.enum(["DEPENDENT", "GUIDED", "ADAPTIVE", "INDEPENDENT"]).default("INDEPENDENT"),
  isAiFree: z.boolean().default(false),
});

export const submitAttemptSchema = z.object({
  answer: z.string().min(1).max(4000),
  timeTakenSec: z.number().int().min(0).optional(),
});

export const requestHintSchema = z.object({
  level: z.number().int().min(1).max(6).optional(),
});

export const confidenceSchema = z.object({
  confidence: z.number().int().min(0).max(100),
});

export const reflectionSchema = z.object({
  question: z.string().min(3).max(200),
  answer: z.string().min(1).max(2000),
});

export const finishSessionSchema = z.object({
  confidence: z.number().int().min(0).max(100).optional(),
  reflection: z
    .object({
      question: z.string().min(3).max(200),
      answer: z.string().min(1).max(2000),
    })
    .optional(),
});

export const createConversationSchema = z.object({
  kind: z.enum(["VOICE", "TEXT"]).default("TEXT"),
  mode: z.enum(["DEPENDENT", "GUIDED", "ADAPTIVE", "INDEPENDENT"]).default("GUIDED"),
  pedagogicalMode: z.enum(["EXPLAIN", "PRACTICE", "HINT", "QUIZ", "EXAM", "STEP_SOLVER", "TEACHER_CHAT", "REVISION"]).optional(),
  isAiFree: z.boolean().default(false),
  language: z.enum(["EN", "UR", "ROMAN_UR"]).default("EN"),
  subjectKey: z.string().max(100).optional(),
  topic: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
});

export const sendMessageSchema = z
  .object({
    content: z.string().max(60_000).default(""),
    imageBase64: z.string().max(10_000_000).optional(),
    teacherAction: z.enum(["HINT", "GUIDE", "CHECK", "MISTAKE", "CONCEPT", "SOLUTION"]).optional(),
  })
  .refine((v) => !!v.content.trim() || !!v.imageBase64, {
    message: "Provide a question or attach an image",
  });

export const analyzeUploadSchema = z
  .object({
    imageBase64: z.string().max(10_000_000).optional(),
    content: z.string().max(4000).optional(),
    stuckOn: z.string().max(1000).optional(),
  })
  .refine((v) => !!v.imageBase64 || !!v.content?.trim(), {
    message: "Provide an image or a question",
  });

export const explainBackSchema = z.object({
  conversationId: z.string().cuid().optional(),
  subjectKey: z.string().max(100).optional(),
  topic: z.string().min(1).max(200),
  explanation: z.string().min(10).max(4000),
});

export const challengeSubmitSchema = z.object({
  answer: z.string().min(1).max(4000),
  confidence: z.number().int().min(0).max(100).optional(),
});

export const noteCreateSchema = z.object({
  title: z.string().min(1).max(200),
  sourceType: z.enum(["PDF", "DOCX", "TXT", "MD"]),
  text: z.string().min(100).max(60_000),
});

export const vivaCreateSchema = z.object({
  subjectKey: z.string().max(100).optional(),
  topic: z.string().min(1).max(200),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  language: z.enum(["EN", "UR", "ROMAN_UR"]).default("EN"),
  questionCount: z.number().int().min(3).max(8).default(5),
});

export const vivaAnswerSchema = z.object({
  answer: z.string().min(1).max(4000),
});

export const examCreateSchema = z.object({
  subjectKey: z.string().max(100).optional(),
  topic: z.string().max(200).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  questionCount: z.number().int().min(3).max(15).default(8),
  timeLimitMin: z.number().int().min(5).max(120).optional(),
  sourceNoteId: z.string().cuid().optional(),
});

export const examSubmitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().cuid(),
      answer: z.string().max(4000),
    }),
  ).min(1),
});

export const missionCreateSchema = z.object({
  mistakeId: z.string().cuid().optional(),
});

export const missionAnswerSchema = z.object({
  answer: z.string().min(1).max(4000),
});

export const predictMistakeQuerySchema = z.object({
  subject: z.string().max(100).optional(),
  topic: z.string().max(200).optional(),
  problem: z.string().min(10).max(6000),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
});

export const sixtySecondStartSchema = z.object({
  subject: z.string().max(100).optional(),
  topic: z.string().min(2).max(200),
});

export const sixtySecondCheckSchema = z.object({
  topic: z.string().max(200),
  question: z.string().min(5).max(2000),
  answer: z.string().min(1).max(4000),
});

export const teachStartSchema = z.object({
  subject: z.string().max(100).optional(),
  topic: z.string().min(2).max(200),
});

export const teachEvaluateSchema = z.object({
  subject: z.string().max(100).optional(),
  topic: z.string().min(2).max(200),
  explanation: z.string().min(10).max(8000),
});

export const explainAnswerSubmitSchema = z.object({
  attemptId: z.string().cuid().optional(),
  explanation: z.string().min(5).max(8000),
});

export const messageFeedbackSchema = z.object({
  rating: z.enum(["UP", "DOWN"]),
  category: z.enum([
    "INCORRECT", "UNHELPFUL", "TOO_LONG", "TOO_COMPLEX", "TOO_SIMPLE",
    "MISSING_CONTEXT", "GOOD", "GREAT_EXPLANATION", "OTHER",
  ]).optional(),
  comment: z.string().max(500).optional(),
});

export const challengeCreateSchema = z.object({
  subjectKey: z.string().max(100).optional(),
  topic: z.string().max(200).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "REAL_WORLD"]).optional(),
  adaptFrom: z.string().cuid().optional(),
});
