import { z } from "zod";

export const detectResponseSchema = z.object({
  language: z.enum(["EN", "UR", "ROMAN_UR"]),
  educationLevel: z.enum(["SCHOOL", "COLLEGE", "UNIVERSITY", "PROFESSIONAL"]).nullable(),
  subjectKey: z.string().nullable(),
  topic: z.string().nullable(),
  intent: z.enum(["ASK", "PRACTICE", "EXPLAIN", "CHAT"]).default("ASK"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).nullable(),
});

export const detectJsonSchema = {
  type: "object",
  properties: {
    language: { type: "string", enum: ["EN", "UR", "ROMAN_UR"] },
    educationLevel: { type: ["string", "null"], enum: ["SCHOOL", "COLLEGE", "UNIVERSITY", "PROFESSIONAL", null] },
    subjectKey: { type: ["string", "null"] },
    topic: { type: ["string", "null"] },
    intent: { type: "string", enum: ["ASK", "PRACTICE", "EXPLAIN", "CHAT"] },
    difficulty: { type: ["string", "null"], enum: ["EASY", "MEDIUM", "HARD", null] },
  },
  required: ["language", "educationLevel", "subjectKey", "topic", "intent", "difficulty"],
  additionalProperties: false,
} as const;

export const evaluateResponseSchema = z.object({
  isCorrect: z.boolean(),
  mistakeType: z.enum([
    "NONE", "CONCEPT_GAP", "CALCULATION_ERROR", "CARELESS_MISTAKE",
    "WRONG_FORMULA", "WRONG_METHOD", "QUESTION_MISUNDERSTANDING",
    "INCOMPLETE_REASONING", "SYNTAX_ERROR", "LOGICAL_ERROR",
  ]),
  reasoning: z.enum(["STRONG", "ADEQUATE", "WEAK", "INCORRECT"]),
  feedback: z.string(),
  conceptGap: z.string().nullable(),
});

export const evaluateJsonSchema = {
  type: "object",
  properties: {
    isCorrect: { type: "boolean" },
    mistakeType: {
      type: "string",
      enum: [
        "NONE", "CONCEPT_GAP", "CALCULATION_ERROR", "CARELESS_MISTAKE",
        "WRONG_FORMULA", "WRONG_METHOD", "QUESTION_MISUNDERSTANDING",
        "INCOMPLETE_REASONING", "SYNTAX_ERROR", "LOGICAL_ERROR",
      ],
    },
    reasoning: { type: "string", enum: ["STRONG", "ADEQUATE", "WEAK", "INCORRECT"] },
    feedback: { type: "string" },
    conceptGap: { type: ["string", "null"] },
  },
  required: ["isCorrect", "mistakeType", "reasoning", "feedback", "conceptGap"],
  additionalProperties: false,
} as const;

export const explainBackResponseSchema = z.object({
  accuracyPct: z.number().min(0).max(100),
  completenessPct: z.number().min(0).max(100),
  reasoningPct: z.number().min(0).max(100),
  understandingScore: z.number().min(0).max(100),
  misconceptions: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })),
  feedback: z.string(),
});

export const explainBackJsonSchema = {
  type: "object",
  properties: {
    accuracyPct: { type: "number" },
    completenessPct: { type: "number" },
    reasoningPct: { type: "number" },
    understandingScore: { type: "number" },
    misconceptions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["name", "description"],
        additionalProperties: false,
      },
    },
    feedback: { type: "string" },
  },
  required: ["accuracyPct", "completenessPct", "reasoningPct", "understandingScore", "misconceptions", "feedback"],
  additionalProperties: false,
} as const;

export const challengeGenResponseSchema = z.object({
  problemText: z.string(),
  solution: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "REAL_WORLD"]),
});

export const challengeGenJsonSchema = {
  type: "object",
  properties: {
    problemText: { type: "string" },
    solution: { type: "string" },
    difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD", "REAL_WORLD"] },
  },
  required: ["problemText", "solution", "difficulty"],
  additionalProperties: false,
} as const;

export const challengeGradeResponseSchema = z.object({
  isCorrect: z.boolean(),
  score: z.number().min(0).max(100),
  analysis: z.string(),
});

export const challengeGradeJsonSchema = {
  type: "object",
  properties: {
    isCorrect: { type: "boolean" },
    score: { type: "number" },
    analysis: { type: "string" },
  },
  required: ["isCorrect", "score", "analysis"],
  additionalProperties: false,
} as const;

// ── Ask My Teacher: structured question analysis ──────────────────

export const analyzeResponseSchema = z.object({
  subject: z.string(),
  topic: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  questionDetected: z.string(),
  studentAttempt: z.string().nullable(),
  studentMistake: z.string().nullable(),
  stuckAt: z.string().nullable(),
  watchOuts: z.array(z.string()),
  suggestedFirstStep: z.string(),
});

export const analyzeJsonSchema = {
  type: "object",
  properties: {
    subject: { type: "string" },
    topic: { type: "string" },
    difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
    questionDetected: { type: "string" },
    studentAttempt: { type: ["string", "null"] },
    studentMistake: { type: ["string", "null"] },
    stuckAt: { type: ["string", "null"] },
    watchOuts: { type: "array", items: { type: "string" } },
    suggestedFirstStep: { type: "string" },
  },
  required: ["subject", "topic", "difficulty", "questionDetected", "studentAttempt", "studentMistake", "stuckAt", "watchOuts", "suggestedFirstStep"],
  additionalProperties: false,
} as const;

// ── Thinking Detective: how the student approached the problem ────

export const detectiveResponseSchema = z.object({
  approachSummary: z.string(),
  errorType: z.string().nullable(),
  errorLocation: z.string().nullable(),
  misconception: z.string().nullable(),
  whatWentRight: z.string(),
  stepAnalysis: z.string(),
  encouragement: z.string(),
});

export const detectiveJsonSchema = {
  type: "object",
  properties: {
    approachSummary: { type: "string" },
    errorType: { type: ["string", "null"] },
    errorLocation: { type: ["string", "null"] },
    misconception: { type: ["string", "null"] },
    whatWentRight: { type: "string" },
    stepAnalysis: { type: "string" },
    encouragement: { type: "string" },
  },
  required: ["approachSummary", "errorType", "errorLocation", "misconception", "whatWentRight", "stepAnalysis", "encouragement"],
  additionalProperties: false,
} as const;

// ── Reverse Teacher (Teach Me): evaluate student-as-teacher ───────

export const teachPromptResponseSchema = z.object({
  prompt: z.string(),
});

export const teachPromptJsonSchema = {
  type: "object",
  properties: {
    prompt: { type: "string" },
  },
  required: ["prompt"],
  additionalProperties: false,
} as const;

export const teachMeResponseSchema = z.object({
  accuracyPct: z.number().min(0).max(100),
  missingConcepts: z.array(z.string()),
  misconceptions: z.array(z.string()),
  clarityPct: z.number().min(0).max(100),
  exampleQualityPct: z.number().min(0).max(100),
  understandingScore: z.number().min(0).max(100),
  feedback: z.string(),
});

export const teachMeJsonSchema = {
  type: "object",
  properties: {
    accuracyPct: { type: "number" },
    missingConcepts: { type: "array", items: { type: "string" } },
    misconceptions: { type: "array", items: { type: "string" } },
    clarityPct: { type: "number" },
    exampleQualityPct: { type: "number" },
    understandingScore: { type: "number" },
    feedback: { type: "string" },
  },
  required: ["accuracyPct", "missingConcepts", "misconceptions", "clarityPct", "exampleQualityPct", "understandingScore", "feedback"],
  additionalProperties: false,
} as const;

// ── Explain My Answer: reasoning graded separately from answer ────

export const explainAnswerResponseSchema = z.object({
  reasoningCorrect: z.boolean(),
  reasoningScore: z.number().min(0).max(100),
  feedback: z.string(),
});

export const explainAnswerJsonSchema = {
  type: "object",
  properties: {
    reasoningCorrect: { type: "boolean" },
    reasoningScore: { type: "number" },
    feedback: { type: "string" },
  },
  required: ["reasoningCorrect", "reasoningScore", "feedback"],
  additionalProperties: false,
} as const;

// ── 60-Second Teacher ─────────────────────────────────────────────

export const sixtySecondResponseSchema = z.object({
  concept: z.string(),
  example: z.string(),
  check: z.string(),
  question: z.string(),
});

export const sixtySecondJsonSchema = {
  type: "object",
  properties: {
    concept: { type: "string" },
    example: { type: "string" },
    check: { type: "string" },
    question: { type: "string" },
  },
  required: ["concept", "example", "check", "question"],
  additionalProperties: false,
} as const;

// ── Mistake → Mission generation ──────────────────────────────────

export const missionGenResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  miniLesson: z.string(),
  practice1: z.object({ question: z.string(), answer: z.string() }),
  practice2: z.object({ question: z.string(), answer: z.string() }),
  challenge: z.object({ question: z.string(), answer: z.string() }),
  reTest: z.object({ question: z.string(), answer: z.string() }),
});

export const missionGenJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    miniLesson: { type: "string" },
    practice1: {
      type: "object",
      properties: { question: { type: "string" }, answer: { type: "string" } },
      required: ["question", "answer"],
      additionalProperties: false,
    },
    practice2: {
      type: "object",
      properties: { question: { type: "string" }, answer: { type: "string" } },
      required: ["question", "answer"],
      additionalProperties: false,
    },
    challenge: {
      type: "object",
      properties: { question: { type: "string" }, answer: { type: "string" } },
      required: ["question", "answer"],
      additionalProperties: false,
    },
    reTest: {
      type: "object",
      properties: { question: { type: "string" }, answer: { type: "string" } },
      required: ["question", "answer"],
      additionalProperties: false,
    },
  },
  required: ["title", "description", "miniLesson", "practice1", "practice2", "challenge", "reTest"],
  additionalProperties: false,
} as const;

export const missionStepEvalResponseSchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
});

export const missionStepEvalJsonSchema = {
  type: "object",
  properties: {
    passed: { type: "boolean" },
    score: { type: "number" },
    feedback: { type: "string" },
  },
  required: ["passed", "score", "feedback"],
  additionalProperties: false,
} as const;

// ── AI Coach Report + Learning Path ───────────────────────────────

export const coachReportResponseSchema = z.object({
  didWell: z.array(z.string()),
  struggledWith: z.array(z.string()),
  commonMistake: z.string(),
  revisionConcept: z.string(),
  recommendedPractice: z.string(),
  recommendedDifficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  nextTopic: z.string(),
  confidenceNote: z.string().nullable(),
});

export const coachReportJsonSchema = {
  type: "object",
  properties: {
    didWell: { type: "array", items: { type: "string" } },
    struggledWith: { type: "array", items: { type: "string" } },
    commonMistake: { type: "string" },
    revisionConcept: { type: "string" },
    recommendedPractice: { type: "string" },
    recommendedDifficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
    nextTopic: { type: "string" },
    confidenceNote: { type: ["string", "null"] },
  },
  required: ["didWell", "struggledWith", "commonMistake", "revisionConcept", "recommendedPractice", "recommendedDifficulty", "nextTopic", "confidenceNote"],
  additionalProperties: false,
} as const;

export const learningPathResponseSchema = z.object({
  currentLevel: z.string(),
  currentTopic: z.string(),
  weakPrerequisite: z.string().nullable(),
  practice: z.string(),
  nextTopic: z.string(),
  challenge: z.string(),
  rationale: z.string(),
});

export const learningPathJsonSchema = {
  type: "object",
  properties: {
    currentLevel: { type: "string" },
    currentTopic: { type: "string" },
    weakPrerequisite: { type: ["string", "null"] },
    practice: { type: "string" },
    nextTopic: { type: "string" },
    challenge: { type: "string" },
    rationale: { type: "string" },
  },
  required: ["currentLevel", "currentTopic", "weakPrerequisite", "practice", "nextTopic", "challenge", "rationale"],
  additionalProperties: false,
} as const;

// ---------- AI Viva ----------

export const vivaQuestionResponseSchema = z.object({
  question: z.string(),
  concept: z.string(),
});

export const vivaQuestionJsonSchema = {
  type: "object",
  properties: {
    question: { type: "string" },
    concept: { type: "string" },
  },
  required: ["question", "concept"],
  additionalProperties: false,
} as const;

export const vivaGradeResponseSchema = z.object({
  isCorrect: z.boolean(),
  understanding: z.number().min(0).max(100),
  feedback: z.string(),
  followUp: z.string(),
});

export const vivaGradeJsonSchema = {
  type: "object",
  properties: {
    isCorrect: { type: "boolean" },
    understanding: { type: "number" },
    feedback: { type: "string" },
    followUp: { type: "string" },
  },
  required: ["isCorrect", "understanding", "feedback", "followUp"],
  additionalProperties: false,
} as const;

export const vivaSummaryResponseSchema = z.object({
  strongAreas: z.array(z.string()),
  weakAreas: z.array(z.string()),
  practiceTopics: z.array(z.string()),
  feedback: z.string(),
});

export const vivaSummaryJsonSchema = {
  type: "object",
  properties: {
    strongAreas: { type: "array", items: { type: "string" } },
    weakAreas: { type: "array", items: { type: "string" } },
    practiceTopics: { type: "array", items: { type: "string" } },
    feedback: { type: "string" },
  },
  required: ["strongAreas", "weakAreas", "practiceTopics", "feedback"],
  additionalProperties: false,
} as const;

// ---------- Exam Simulator / Notes → Quiz ----------

export const examGenQuestionSchema = z.object({
  type: z.enum(["MCQ", "TRUE_FALSE", "SHORT_ANSWER"]),
  question: z.string(),
  options: z.array(z.string()).nullable(),
  answer: z.string(),
  points: z.number().min(1).max(5),
});

export const examGenResponseSchema = z.object({
  title: z.string(),
  questions: z.array(examGenQuestionSchema).min(1),
});

export const examQuestionJsonSchema = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["MCQ", "TRUE_FALSE", "SHORT_ANSWER"] },
    question: { type: "string" },
    options: { type: ["array", "null"], items: { type: "string" } },
    answer: { type: "string" },
    points: { type: "number" },
  },
  required: ["type", "question", "options", "answer", "points"],
  additionalProperties: false,
} as const;

export const examGenJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    questions: { type: "array", items: examQuestionJsonSchema },
  },
  required: ["title", "questions"],
  additionalProperties: false,
} as const;

export const examShortGradeResponseSchema = z.object({
  isCorrect: z.boolean(),
  analysis: z.string(),
});

export const examShortGradeJsonSchema = {
  type: "object",
  properties: {
    isCorrect: { type: "boolean" },
    analysis: { type: "string" },
  },
  required: ["isCorrect", "analysis"],
  additionalProperties: false,
} as const;

export const examSummaryResponseSchema = z.object({
  weakTopics: z.array(z.string()),
  revision: z.array(z.string()),
  mistakeAnalysis: z.array(z.string()),
  feedback: z.string(),
});

export const examSummaryJsonSchema = {
  type: "object",
  properties: {
    weakTopics: { type: "array", items: { type: "string" } },
    revision: { type: "array", items: { type: "string" } },
    mistakeAnalysis: { type: "array", items: { type: "string" } },
    feedback: { type: "string" },
  },
  required: ["weakTopics", "revision", "mistakeAnalysis", "feedback"],
  additionalProperties: false,
} as const;

// ---------- Notes → Teacher ----------

export const noteAnalysisResponseSchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()).min(1),
  flashcards: z.array(z.object({ front: z.string(), back: z.string() })).min(1),
});

export const noteAnalysisJsonSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    keyPoints: { type: "array", items: { type: "string" } },
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front: { type: "string" },
          back: { type: "string" },
        },
        required: ["front", "back"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "keyPoints", "flashcards"],
  additionalProperties: false,
} as const;

// ---------- Predict My Mistake ----------

export const predictMistakeResponseSchema = z.object({
  likelyMistake: z.string(),
  warning: z.string(),
  tip: z.string(),
});

export const predictMistakeJsonSchema = {
  type: "object",
  properties: {
    likelyMistake: { type: "string" },
    warning: { type: "string" },
    tip: { type: "string" },
  },
  required: ["likelyMistake", "warning", "tip"],
  additionalProperties: false,
} as const;

