import { redirect } from "next/navigation";
import { getSessionStudent } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const student = await getSessionStudent();
  // Middleware only checks cookie presence; this is the real session validation.
  if (!student) redirect("/login");

  return (
    <div className="min-h-screen">
      <a className="skip-to-content" href="#main-content">
        Skip to content
      </a>
      <Navbar studentName={student.name} />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
