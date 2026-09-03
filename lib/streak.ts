import { prisma } from "./db";

export async function updateStudyStreak(studentId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await prisma.studyStreak.findUnique({
    where: { studentId },
  });

  if (!streak) {
    await prisma.studyStreak.create({
      data: {
        studentId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
      },
    });
    return;
  }

  if (!streak.lastActiveDate) {
    await prisma.studyStreak.update({
      where: { id: streak.id },
      data: { currentStreak: 1, longestStreak: Math.max(1, streak.longestStreak), lastActiveDate: today },
    });
    return;
  }

  const lastActive = new Date(streak.lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - lastActive.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return;

  if (diffDays === 1) {
    const newStreak = streak.currentStreak + 1;
    await prisma.studyStreak.update({
      where: { id: streak.id },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastActiveDate: today,
      },
    });
  } else {
    await prisma.studyStreak.update({
      where: { id: streak.id },
      data: { currentStreak: 1, lastActiveDate: today },
    });
  }
}
