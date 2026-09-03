import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createAuthSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const rl = checkRateLimit(`register:${ip}`, "auth");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many registration attempts. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  try {
    const parsed = registerSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, password, educationLevel } = parsed.data;

    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "email_taken", message: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const student = await prisma.student.create({
      data: { name, email, passwordHash, educationLevel, lastLoginAt: new Date() },
    });

    await createAuthSession(student.id, req.headers.get("user-agent"));

    return NextResponse.json({
      student: { id: student.id, name: student.name, email: student.email, educationLevel: student.educationLevel },
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Register error:", message);
    return NextResponse.json({ error: "server_error", message }, { status: 500 });
  }
}
