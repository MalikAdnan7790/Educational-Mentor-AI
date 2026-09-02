import { PrismaClient, EducationLevel } from "@prisma/client";
import { SUBJECT_CATALOG } from "../lib/subjects-catalog";
import { TEACHER_PROFILES } from "../lib/teacher-profiles";

const prisma = new PrismaClient();

const PROBLEMS = [
  // ─── MATH ───────────────────────────────────────────────────────
  {
    slug: "math-linear-eq-01",
    subject: "MATH",
    topic: "Algebra",
    difficulty: "EASY",
    title: "Solve the linear equation",
    content: "Solve for x:\n\n    2x + 5 = 17\n\nWrite your answer as a single number. Show each algebraic step briefly.",
    solution: "6",
  },
  {
    slug: "math-quadratic-01",
    subject: "MATH",
    topic: "Algebra",
    difficulty: "MEDIUM",
    title: "Quadratic roots",
    content: "Find all real solutions of:\n\n    x² − 7x + 12 = 0\n\nList the solutions separated by a comma.",
    solution: "3, 4",
  },
  {
    slug: "math-percent-01",
    subject: "MATH",
    topic: "Percentages",
    difficulty: "EASY",
    title: "Discount calculation",
    content: "A jacket costs $80 and is discounted by 25%. What is the final price in dollars?\n\nWrite only the final number.",
    solution: "60",
  },
  {
    slug: "math-geometry-01",
    subject: "MATH",
    topic: "Geometry",
    difficulty: "HARD",
    title: "Circumscribed circle area",
    content: "A square has side length 10 cm. A circle is circumscribed around the square (passing through all four vertices).\n\nWhat is the area of the circle? Give your answer in terms of π (e.g. \"25π\").",
    solution: "50π",
  },
  // ─── PHYSICS ────────────────────────────────────────────────────
  {
    slug: "phys-kinematics-01",
    subject: "PHYSICS",
    topic: "Kinematics",
    difficulty: "EASY",
    title: "Velocity from distance and time",
    content: "A car travels 120 meters in 6 seconds at a constant speed. What is its velocity in m/s?\n\nGive only the number.",
    solution: "20",
  },
  {
    slug: "phys-newton-01",
    subject: "PHYSICS",
    topic: "Newton's Laws",
    difficulty: "MEDIUM",
    title: "Force on an accelerating mass",
    content: "A 4 kg object accelerates at 3 m/s². What net force acts on it, in Newtons?\n\nGive only the number.",
    solution: "12",
  },
  {
    slug: "phys-energy-01",
    subject: "PHYSICS",
    topic: "Energy",
    difficulty: "HARD",
    title: "Kinetic energy of a moving object",
    content: "A 2 kg ball moves at 5 m/s. What is its kinetic energy in joules?\n\nUse KE = ½mv². Give only the number.",
    solution: "25",
  },
  // ─── PROGRAMMING ────────────────────────────────────────────────
  {
    slug: "prog-loop-01",
    subject: "PROGRAMMING",
    topic: "Loops",
    difficulty: "EASY",
    title: "Trace the C++ loop",
    content: "What is the final value of `sum` after this code runs?\n\n    int sum = 0;\n    for (int i = 1; i <= 4; i++) {\n        sum += i;\n    }\n\nGive only the number.",
    solution: "10",
  },
  {
    slug: "prog-recursion-01",
    subject: "PROGRAMMING",
    topic: "Recursion",
    difficulty: "MEDIUM",
    title: "Trace a recursive function",
    content: "What does this function return when called as f(5)?\n\n    int f(int n) {\n        if (n <= 1) return 1;\n        return n * f(n - 1);\n    }\n\nGive only the number.",
    solution: "120",
  },
  {
    slug: "prog-pointer-01",
    subject: "PROGRAMMING",
    topic: "Pointers",
    difficulty: "HARD",
    title: "Pointer swap in C++",
    content: "What values are printed?\n\n    int a = 5, b = 10;\n    int *p = &a, *q = &b;\n    int t = *p;\n    *p = *q;\n    *q = t;\n    cout << a << \" \" << b;\n\nWrite the two numbers separated by a space.",
    solution: "10 5",
  },
  // ─── CHEMISTRY ──────────────────────────────────────────────────
  {
    slug: "chem-stoich-01",
    subject: "CHEMISTRY",
    topic: "Stoichiometry",
    difficulty: "MEDIUM",
    title: "Moles from mass",
    content: "How many moles of water (H₂O) are in 36 grams of water?\n\nMolar mass of H₂O = 18 g/mol. Give only the number.",
    solution: "2",
  },
  // ─── CS ─────────────────────────────────────────────────────────
  {
    slug: "cs-bigo-01",
    subject: "CS",
    topic: "Algorithms",
    difficulty: "MEDIUM",
    title: "Big-O of linear search",
    content: "In the worst case, what is the time complexity of linear search through an unsorted array of n elements?\n\nWrite your answer in the form \"O(...)\".",
    solution: "O(n)",
  },
  // ─── BIOLOGY ────────────────────────────────────────────────────
  {
    slug: "bio-cell-01",
    subject: "BIOLOGY",
    topic: "Cell Biology",
    difficulty: "EASY",
    title: "Powerhouse of the cell",
    content: "Which organelle is responsible for producing most of the cell's ATP through aerobic respiration?\n\nWrite the single-word name.",
    solution: "mitochondria",
  },
];

async function main() {
  console.log("Seeding Educational Mentor AI...");

  // ── Demo student ──────────────────────────────────────────────
  const student = await prisma.student.upsert({
    where: { email: "demo@mentor.ai" },
    update: {},
    create: {
      name: "Alex Chen",
      email: "demo@mentor.ai",
      preferredMode: "INDEPENDENT",
      currentDifficulty: "MEDIUM",
      preferredSubject: "MATH",
    },
  });
  console.log(`  Student: ${student.name} (${student.id})`);

  // ── Problems (upsert by slug, no destructive deleteMany) ──────
  let problemCount = 0;
  for (const p of PROBLEMS) {
    await prisma.problem.upsert({
      where: { slug: p.slug },
      update: {
        subject: p.subject as any,
        topic: p.topic,
        difficulty: p.difficulty as any,
        title: p.title,
        content: p.content,
        solution: p.solution,
      },
      create: p as any,
    });
    problemCount++;
  }
  console.log(`  ${problemCount} problems upserted`);

  // ── Subject catalog + topics ──────────────────────────────────
  let subjectCount = 0;
  let topicCount = 0;
  for (const s of SUBJECT_CATALOG) {
    const subject = await prisma.subjectCatalog.upsert({
      where: { key: s.key },
      update: {
        name: s.name,
        category: s.category,
        level: s.level as EducationLevel,
        sortOrder: s.sortOrder,
      },
      create: {
        key: s.key,
        name: s.name,
        category: s.category,
        level: s.level as EducationLevel,
        sortOrder: s.sortOrder,
      },
    });
    subjectCount++;

    for (const t of s.topics) {
      await prisma.topic.upsert({
        where: { subjectId_slug: { subjectId: subject.id, slug: t.slug } },
        update: { name: t.name },
        create: { subjectId: subject.id, name: t.name, slug: t.slug },
      });
      topicCount++;
    }
  }
  console.log(`  ${subjectCount} subjects, ${topicCount} topics upserted`);

  // ── Teacher profiles ─────────────────────────────────────────
  let profileCount = 0;
  for (const tp of TEACHER_PROFILES) {
    const data = {
      style: tp.style,
      focusJson: JSON.stringify(tp.focus),
      commonMistakesJson: JSON.stringify(tp.commonMistakes),
      examplesJson: JSON.stringify(tp.examples),
      rulesJson: JSON.stringify(tp.rules),
    };

    if (tp.subjectKey) {
      const subject = await prisma.subjectCatalog.findUnique({ where: { key: tp.subjectKey } });
      if (!subject) {
        console.warn(`  Warning: subject "${tp.subjectKey}" not found, skipping profile`);
        continue;
      }
      await prisma.teacherProfile.upsert({
        where: { subjectId: subject.id },
        update: data,
        create: { subjectId: subject.id, ...data },
      });
      profileCount++;
    } else if (tp.category) {
      await prisma.teacherProfile.upsert({
        where: { category: tp.category },
        update: data,
        create: { category: tp.category, ...data },
      });
      profileCount++;
    }
  }
  console.log(`  ${profileCount} teacher profiles upserted`);

  // ── IndependentScore (only create if missing — never reset) ───
  await prisma.independentScore.upsert({
    where: { studentId: student.id },
    update: {},
    create: { studentId: student.id },
  });

  console.log("");
  console.log("Seed complete.");
  console.log(`  Demo student id: ${student.id}`);
  console.log("  Run `npm run dev` and open http://localhost:3000");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
