/**
 * Session-based auth: opaque random token stored in an httpOnly cookie,
 * validated against the AuthSession table on every protected request.
 *
 * Middleware only checks cookie presence (it runs on the Edge runtime,
 * where Prisma/bcrypt can't run); real validation happens here.
 */

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { Student } from "@prisma/client";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "emai_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createAuthSession(studentId: string, userAgent?: string | null) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.authSession.create({
    data: { token, studentId, userAgent: userAgent ?? null, expiresAt },
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function getSessionStudent(): Promise<Student | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const authSession = await prisma.authSession.findUnique({
    where: { token },
    include: { student: true },
  });
  if (!authSession) return null;
  if (authSession.expiresAt < new Date()) {
    await prisma.authSession.delete({ where: { id: authSession.id } }).catch(() => {});
    return null;
  }
  return authSession.student;
}

export async function destroyAuthSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.authSession.deleteMany({ where: { token } }).catch(() => {});
  }
  cookies().delete(SESSION_COOKIE);
}
