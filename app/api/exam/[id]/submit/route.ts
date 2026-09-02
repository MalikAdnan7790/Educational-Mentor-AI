import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStudent } from "@/lib/auth";
import { gradeShortAnswer, summarizeExam } from "@/lib/ai/exam";
import { applyMasteryEvidence } from "@/lib/analytics";
import { examSubmitSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function exactMatch(student: string, canonical: string): boolean {
  return student.trim().toLowerCase() === canonical.trim().toLowerCase();
}

function lenientMatch(student: string, canonical: string): boolean {
  const s = student.trim().toLowerCase();
  const c = canonical.trim().toLowerCase();
  if (!s) return false;
  return s === c || (c.length > 12 && s.includes(c)) || (s.length > 12 && c.includes(s));
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const student = await getSessionStudent();
  if (!student) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = examSubmitSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const exam = await prisma.exam.findUnique({
    where: { id: params.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!exam || exam.studentId !== student.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (exam.status !== "ACTIVE") {
    return NextResponse.json({ error: "already_submitted", status: exam.status }, { status: 409 });
  }

  const byId = new Map(parsed.data.answers.map((a) => [a.questionId, a.answer]));

  let earned = 0;
  let total = 0;
  const results: {
    questionId: string;
    studentAnswer: string | null;
    isCorrect: boolean;
    analysis: string | null;
  }[] = [];

  for (const q of exam.questions) {
    const studentAnswer = byId.get(q.id) ?? null;
    total += q.points;

    let isCorrect = false;
    let analysis: string | null = null;

    if (!studentAnswer) {
      analysis = "No answer given.";
    } else if (q.type === "MCQ" || q.type === "TRUE_FALSE") {
      isCorrect = exactMatch(studentAnswer, q.answer);
      analysis = isCorrect ? "Correct." : `Correct answer: ${q.answer}`;
    } else {
      // SHORT_ANSWER / CONCEPTUAL / CODE: AI grading, lenient fallback if AI is unavailable
      const grade = await gradeShortAnswer(q.question, q.answer, studentAnswer);
      if (grade) {
        isCorrect = grade.isCorrect;
        analysis = grade.analysis;
      } else {
        isCorrect = lenientMatch(studentAnswer, q.answer);
        analysis = isCorrect ? "Correct." : `Correct answer: ${q.answer}`;
      }
    }

    if (isCorrect) earned += q.points;

    await prisma.examQuestion.update({
      where: { id: q.id },
      data: { studentAnswer, isCorrect, analysis },
    });

    results.push({
      questionId: q.id,
      studentAnswer,
      isCorrect,
      analysis,
    });
  }

  const scorePct = total > 0 ? (earned / total) * 100 : 0;

  const summary = await summarizeExam(
    exam.title,
    exam.questions.map((q, i) => ({
      question: q.question,
      type: q.type,
      studentAnswer: results[i].studentAnswer,
      answer: q.answer,
      isCorrect: results[i].isCorrect,
      analysis: results[i].analysis,
    })),
    scorePct,
  );

  await prisma.exam.update({
    where: { id: exam.id },
    data: {
      status: "GRADED",
      score: scorePct,
      submittedAt: new Date(),
      summaryJson: summary
        ? JSON.stringify(summary)
        : JSON.stringify({
            weakTopics: [],
            revision: ["Review the questions you got wrong above."],
            mistakeAnalysis: [],
            feedback: `You scored ${Math.round(scorePct)}%. Review each question's correct answer below.`,
          }),
    },
  });

  if (exam.subjectKey && exam.topic) {
    await applyMasteryEvidence(student.id, exam.subjectKey, exam.topic, Math.round(scorePct));
  }

  return NextResponse.json({
    score: Math.round(scorePct),
    earned,
    total,
    summary: summary ?? {
      weakTopics: [],
      revision: ["Review the questions you got wrong above."],
      mistakeAnalysis: [],
      feedback: `You scored ${Math.round(scorePct)}%. Review each question's correct answer below.`,
    },
    questions: exam.questions.map((q, i) => ({
      id: q.id,
      order: q.order,
      type: q.type,
      question: q.question,
      options: q.optionsJson ? JSON.parse(q.optionsJson) : null,
      points: q.points,
      answer: q.answer,
      studentAnswer: results[i].studentAnswer,
      isCorrect: results[i].isCorrect,
      analysis: results[i].analysis,
    })),
  });
}
