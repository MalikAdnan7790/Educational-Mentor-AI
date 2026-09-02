import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createAuthSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const parsed = loginSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const student = await prisma.student.findUnique({ where: { email } });
    // Generic message: never reveal whether the email exists
    if (!student?.passwordHash || !(await bcrypt.compare(password, student.passwordHash))) {
      return NextResponse.json({ error: "invalid_credentials", message: "Incorrect email or password." }, { status: 401 });
    }

    await prisma.student.update({ where: { id: student.id }, data: { lastLoginAt: new Date() } });
    await createAuthSession(student.id, req.headers.get("user-agent"));

    return NextResponse.json({
      student: { id: student.id, name: student.name, email: student.email, educationLevel: student.educationLevel },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Login error:", message);
    return NextResponse.json({ error: "server_error", message }, { status: 500 });
  }
}
