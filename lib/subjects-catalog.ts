export interface TopicSeed {
  name: string;
  slug: string;
}

export interface SubjectSeed {
  key: string;
  name: string;
  category: string;
  level: "SCHOOL" | "COLLEGE" | "UNIVERSITY" | "PROFESSIONAL";
  sortOrder: number;
  topics: TopicSeed[];
}

export const SUBJECT_CATALOG: SubjectSeed[] = [
  // ─── School ─────────────────────────────────────────────────────
  { key: "school_math_arithmetic", name: "Arithmetic", category: "School", level: "SCHOOL", sortOrder: 10, topics: [
    { name: "Addition & Subtraction", slug: "add-sub" },
    { name: "Multiplication & Division", slug: "mul-div" },
    { name: "Fractions", slug: "fractions" },
    { name: "Decimals", slug: "decimals" },
    { name: "Percentages", slug: "percentages" },
    { name: "Ratios & Proportions", slug: "ratios" },
  ]},
  { key: "school_math_algebra", name: "Algebra", category: "School", level: "SCHOOL", sortOrder: 11, topics: [
    { name: "Linear Equations", slug: "linear-eq" },
    { name: "Quadratic Equations", slug: "quadratic-eq" },
    { name: "Polynomials", slug: "polynomials" },
    { name: "Inequalities", slug: "inequalities" },
    { name: "Sequences & Series", slug: "sequences" },
  ]},
  { key: "school_math_geometry", name: "Geometry", category: "School", level: "SCHOOL", sortOrder: 12, topics: [
    { name: "Triangles", slug: "triangles" },
    { name: "Circles", slug: "circles" },
    { name: "Quadrilaterals", slug: "quadrilaterals" },
    { name: "Area & Perimeter", slug: "area-perimeter" },
    { name: "Volume & Surface Area", slug: "volume" },
    { name: "Coordinate Geometry", slug: "coord-geo" },
  ]},
  { key: "school_math_trigonometry", name: "Trigonometry", category: "School", level: "SCHOOL", sortOrder: 13, topics: [
    { name: "Trig Ratios", slug: "trig-ratios" },
    { name: "Trig Identities", slug: "trig-identities" },
    { name: "Graphs of Trig Functions", slug: "trig-graphs" },
    { name: "Inverse Trig", slug: "inverse-trig" },
  ]},
  { key: "school_math_calculus", name: "Calculus (Intro)", category: "School", level: "SCHOOL", sortOrder: 14, topics: [
    { name: "Limits", slug: "limits" },
    { name: "Derivatives Basics", slug: "deriv-basics" },
    { name: "Integration Basics", slug: "integ-basics" },
    { name: "Applications of Derivatives", slug: "deriv-apps" },
  ]},
  { key: "school_math_statistics", name: "Statistics & Probability", category: "School", level: "SCHOOL", sortOrder: 15, topics: [
    { name: "Mean, Median, Mode", slug: "central-tendency" },
    { name: "Standard Deviation", slug: "std-dev" },
    { name: "Probability Basics", slug: "prob-basics" },
    { name: "Combinations & Permutations", slug: "comb-perm" },
  ]},
  { key: "school_physics_mechanics", name: "Physics — Mechanics", category: "School", level: "SCHOOL", sortOrder: 20, topics: [
    { name: "Kinematics", slug: "kinematics" },
    { name: "Newton's Laws", slug: "newtons-laws" },
    { name: "Work, Energy & Power", slug: "work-energy" },
    { name: "Momentum", slug: "momentum" },
    { name: "Circular Motion", slug: "circular-motion" },
  ]},
  { key: "school_physics_waves", name: "Physics — Waves & Optics", category: "School", level: "SCHOOL", sortOrder: 21, topics: [
    { name: "Wave Properties", slug: "wave-props" },
    { name: "Sound", slug: "sound" },
    { name: "Light & Reflection", slug: "light" },
    { name: "Refraction & Lenses", slug: "refraction" },
  ]},
  { key: "school_physics_electricity", name: "Physics — Electricity & Magnetism", category: "School", level: "SCHOOL", sortOrder: 22, topics: [
    { name: "Electric Charge & Current", slug: "charge-current" },
    { name: "Ohm's Law & Circuits", slug: "circuits" },
    { name: "Magnetic Fields", slug: "magnetic-fields" },
    { name: "Electromagnetic Induction", slug: "em-induction" },
  ]},
  { key: "school_physics_modern", name: "Physics — Modern Physics", category: "School", level: "SCHOOL", sortOrder: 23, topics: [
    { name: "Atomic Structure", slug: "atomic-structure" },
    { name: "Nuclear Physics", slug: "nuclear" },
    { name: "Radioactivity", slug: "radioactivity" },
    { name: "Semiconductors", slug: "semiconductors" },
  ]},
  { key: "school_chemistry_general", name: "Chemistry — General", category: "School", level: "SCHOOL", sortOrder: 30, topics: [
    { name: "Atomic Structure", slug: "atomic-structure" },
    { name: "Periodic Table", slug: "periodic-table" },
    { name: "Chemical Bonding", slug: "bonding" },
    { name: "Stoichiometry", slug: "stoichiometry" },
    { name: "States of Matter", slug: "states-matter" },
  ]},
  { key: "school_chemistry_organic", name: "Chemistry — Organic", category: "School", level: "SCHOOL", sortOrder: 31, topics: [
    { name: "Hydrocarbons", slug: "hydrocarbons" },
    { name: "Functional Groups", slug: "functional-groups" },
    { name: "Isomerism", slug: "isomerism" },
    { name: "Polymers", slug: "polymers" },
  ]},
  { key: "school_chemistry_physical", name: "Chemistry — Physical", category: "School", level: "SCHOOL", sortOrder: 32, topics: [
    { name: "Thermochemistry", slug: "thermochem" },
    { name: "Chemical Equilibrium", slug: "equilibrium" },
    { name: "Electrochemistry", slug: "electrochem" },
    { name: "Chemical Kinetics", slug: "kinetics" },
  ]},
  { key: "school_biology_cell", name: "Biology — Cell & Molecular", category: "School", level: "SCHOOL", sortOrder: 40, topics: [
    { name: "Cell Structure", slug: "cell-structure" },
    { name: "Cell Division", slug: "cell-division" },
    { name: "DNA & Genetics", slug: "dna-genetics" },
    { name: "Protein Synthesis", slug: "protein-synthesis" },
  ]},
  { key: "school_biology_human", name: "Biology — Human Body", category: "School", level: "SCHOOL", sortOrder: 41, topics: [
    { name: "Digestive System", slug: "digestive" },
    { name: "Circulatory System", slug: "circulatory" },
    { name: "Respiratory System", slug: "respiratory" },
    { name: "Nervous System", slug: "nervous" },
    { name: "Immune System", slug: "immune" },
  ]},
  { key: "school_biology_ecology", name: "Biology — Ecology & Evolution", category: "School", level: "SCHOOL", sortOrder: 42, topics: [
    { name: "Ecosystems", slug: "ecosystems" },
    { name: "Food Chains & Webs", slug: "food-chains" },
    { name: "Evolution", slug: "evolution" },
    { name: "Biodiversity", slug: "biodiversity" },
  ]},
  { key: "school_english", name: "English", category: "School", level: "SCHOOL", sortOrder: 50, topics: [
    { name: "Grammar", slug: "grammar" },
    { name: "Reading Comprehension", slug: "reading" },
    { name: "Essay Writing", slug: "essay" },
    { name: "Literature", slug: "literature" },
    { name: "Vocabulary", slug: "vocabulary" },
  ]},
  { key: "school_urdu", name: "Urdu", category: "School", level: "SCHOOL", sortOrder: 51, topics: [
    { name: "Grammar (قواعد)", slug: "grammar" },
    { name: "Comprehension (فہم)", slug: "comprehension" },
    { name: "Essay Writing (مضمون)", slug: "essay" },
    { name: "Poetry (شاعری)", slug: "poetry" },
    { name: "Prose (نثر)", slug: "prose" },
  ]},
  { key: "school_islamiat", name: "Islamiat", category: "School", level: "SCHOOL", sortOrder: 52, topics: [
    { name: "Quran Translation", slug: "quran" },
    { name: "Hadith", slug: "hadith" },
    { name: "Seerat-un-Nabi", slug: "seerat" },
    { name: "Islamic History", slug: "history" },
    { name: "Fiqh Basics", slug: "fiqh" },
  ]},
  { key: "school_pak_studies", name: "Pakistan Studies", category: "School", level: "SCHOOL", sortOrder: 53, topics: [
    { name: "Independence Movement", slug: "independence" },
    { name: "Constitution", slug: "constitution" },
    { name: "Geography of Pakistan", slug: "geography" },
    { name: "Economy", slug: "economy" },
  ]},
  { key: "school_history", name: "History", category: "School", level: "SCHOOL", sortOrder: 54, topics: [
    { name: "Ancient Civilizations", slug: "ancient" },
    { name: "Medieval Period", slug: "medieval" },
    { name: "Modern History", slug: "modern" },
    { name: "World Wars", slug: "world-wars" },
  ]},
  { key: "school_geography", name: "Geography", category: "School", level: "SCHOOL", sortOrder: 55, topics: [
    { name: "Physical Geography", slug: "physical" },
    { name: "Climate & Weather", slug: "climate" },
    { name: "Maps & Cartography", slug: "maps" },
    { name: "Human Geography", slug: "human" },
  ]},
  { key: "school_cs", name: "Computer Science", category: "School", level: "SCHOOL", sortOrder: 60, topics: [
    { name: "Programming Basics", slug: "basics" },
    { name: "Loops & Conditionals", slug: "loops" },
    { name: "Functions", slug: "functions" },
    { name: "Arrays & Strings", slug: "arrays" },
    { name: "OOP Concepts", slug: "oop" },
  ]},

  // ─── College (Intermediate / A-Level / FSc) ─────────────────────
  { key: "college_math", name: "Mathematics (Intermediate)", category: "College", level: "COLLEGE", sortOrder: 100, topics: [
    { name: "Complex Numbers", slug: "complex" },
    { name: "Matrices & Determinants", slug: "matrices" },
    { name: "Calculus (Advanced)", slug: "calc-adv" },
    { name: "Analytical Geometry", slug: "analytical-geo" },
    { name: "Vectors", slug: "vectors" },
  ]},
  { key: "college_physics", name: "Physics (Intermediate)", category: "College", level: "COLLEGE", sortOrder: 101, topics: [
    { name: "Thermodynamics", slug: "thermo" },
    { name: "Oscillations", slug: "oscillations" },
    { name: "Optics (Advanced)", slug: "optics-adv" },
    { name: "Electrostatics", slug: "electrostatics" },
    { name: "Current Electricity", slug: "current-elec" },
  ]},
  { key: "college_chemistry", name: "Chemistry (Intermediate)", category: "College", level: "COLLEGE", sortOrder: 102, topics: [
    { name: "Atomic Theory (Advanced)", slug: "atomic-adv" },
    { name: "Chemical Bonding (Advanced)", slug: "bonding-adv" },
    { name: "Organic Reactions", slug: "organic-rxns" },
    { name: "Environmental Chemistry", slug: "env-chem" },
  ]},
  { key: "college_biology", name: "Biology (Intermediate)", category: "College", level: "COLLEGE", sortOrder: 103, topics: [
    { name: "Bioenergetics", slug: "bioenergetics" },
    { name: "Coordination & Control", slug: "coordination" },
    { name: "Reproduction", slug: "reproduction" },
    { name: "Biotechnology", slug: "biotech" },
  ]},
  { key: "college_stats", name: "Statistics", category: "College", level: "COLLEGE", sortOrder: 104, topics: [
    { name: "Probability Distributions", slug: "distributions" },
    { name: "Hypothesis Testing", slug: "hypothesis" },
    { name: "Regression & Correlation", slug: "regression" },
    { name: "Sampling", slug: "sampling" },
  ]},
  { key: "college_economics", name: "Economics", category: "College", level: "COLLEGE", sortOrder: 105, topics: [
    { name: "Supply & Demand", slug: "supply-demand" },
    { name: "Market Structures", slug: "markets" },
    { name: "National Income", slug: "national-income" },
    { name: "Money & Banking", slug: "money-banking" },
  ]},
  { key: "college_accounting", name: "Accounting", category: "College", level: "COLLEGE", sortOrder: 106, topics: [
    { name: "Journal Entries", slug: "journal" },
    { name: "Financial Statements", slug: "financials" },
    { name: "Cost Accounting", slug: "cost" },
    { name: "Auditing Basics", slug: "auditing" },
  ]},
  { key: "college_commerce", name: "Commerce", category: "College", level: "COLLEGE", sortOrder: 107, topics: [
    { name: "Business Organization", slug: "biz-org" },
    { name: "Trade & Industry", slug: "trade" },
    { name: "Banking & Insurance", slug: "banking-ins" },
    { name: "Marketing Basics", slug: "marketing" },
  ]},

  // ─── University — General ────────────────────────────────────────
  { key: "uni_math_linear_algebra", name: "Linear Algebra", category: "University", level: "UNIVERSITY", sortOrder: 200, topics: [
    { name: "Vector Spaces", slug: "vector-spaces" },
    { name: "Linear Transformations", slug: "linear-transforms" },
    { name: "Eigenvalues & Eigenvectors", slug: "eigen" },
    { name: "Inner Product Spaces", slug: "inner-product" },
  ]},
  { key: "uni_math_calculus_adv", name: "Multivariable Calculus", category: "University", level: "UNIVERSITY", sortOrder: 201, topics: [
    { name: "Partial Derivatives", slug: "partial-deriv" },
    { name: "Multiple Integrals", slug: "multi-integrals" },
    { name: "Vector Calculus", slug: "vector-calc" },
    { name: "Differential Equations", slug: "diff-eq" },
  ]},
  { key: "uni_math_discrete", name: "Discrete Mathematics", category: "University", level: "UNIVERSITY", sortOrder: 202, topics: [
    { name: "Logic & Proofs", slug: "logic-proofs" },
    { name: "Set Theory", slug: "set-theory" },
    { name: "Graph Theory", slug: "graph-theory" },
    { name: "Combinatorics", slug: "combinatorics" },
    { name: "Number Theory", slug: "number-theory" },
  ]},
  { key: "uni_math_prob_stat", name: "Probability & Statistics", category: "University", level: "UNIVERSITY", sortOrder: 203, topics: [
    { name: "Random Variables", slug: "random-vars" },
    { name: "Distributions", slug: "distributions" },
    { name: "Estimation", slug: "estimation" },
    { name: "Bayesian Statistics", slug: "bayesian" },
  ]},
  { key: "uni_math_numerical", name: "Numerical Methods", category: "University", level: "UNIVERSITY", sortOrder: 204, topics: [
    { name: "Root Finding", slug: "root-finding" },
    { name: "Interpolation", slug: "interpolation" },
    { name: "Numerical Integration", slug: "num-integration" },
    { name: "ODE Solvers", slug: "ode-solvers" },
  ]},
  { key: "uni_physics_mechanics_adv", name: "Classical Mechanics", category: "University", level: "UNIVERSITY", sortOrder: 210, topics: [
    { name: "Lagrangian Mechanics", slug: "lagrangian" },
    { name: "Hamiltonian Mechanics", slug: "hamiltonian" },
    { name: "Rigid Body Dynamics", slug: "rigid-body" },
    { name: "Central Forces", slug: "central-forces" },
  ]},
  { key: "uni_physics_em", name: "Electromagnetic Theory", category: "University", level: "UNIVERSITY", sortOrder: 211, topics: [
    { name: "Maxwell's Equations", slug: "maxwell" },
    { name: "EM Waves", slug: "em-waves" },
    { name: "Transmission Lines", slug: "transmission" },
    { name: "Waveguides", slug: "waveguides" },
  ]},
  { key: "uni_physics_quantum", name: "Quantum Mechanics", category: "University", level: "UNIVERSITY", sortOrder: 212, topics: [
    { name: "Wave-Particle Duality", slug: "wave-particle" },
    { name: "Schrodinger Equation", slug: "schrodinger" },
    { name: "Angular Momentum", slug: "angular-momentum" },
    { name: "Hydrogen Atom", slug: "hydrogen" },
  ]},
  { key: "uni_chem_physical", name: "Physical Chemistry", category: "University", level: "UNIVERSITY", sortOrder: 220, topics: [
    { name: "Quantum Chemistry", slug: "quantum-chem" },
    { name: "Statistical Mechanics", slug: "stat-mech" },
    { name: "Spectroscopy", slug: "spectroscopy" },
    { name: "Surface Chemistry", slug: "surface-chem" },
  ]},
  { key: "uni_biol_genetics", name: "Genetics", category: "University", level: "UNIVERSITY", sortOrder: 230, topics: [
    { name: "Mendelian Genetics", slug: "mendelian" },
    { name: "Molecular Genetics", slug: "molecular" },
    { name: "Population Genetics", slug: "population" },
    { name: "Genomics", slug: "genomics" },
  ]},
  { key: "uni_english_literature", name: "English Literature", category: "University", level: "UNIVERSITY", sortOrder: 240, topics: [
    { name: "Shakespeare", slug: "shakespeare" },
    { name: "Romantic Poetry", slug: "romantic" },
    { name: "Modern Fiction", slug: "modern-fiction" },
    { name: "Literary Criticism", slug: "criticism" },
  ]},
  { key: "uni_philosophy", name: "Philosophy", category: "University", level: "UNIVERSITY", sortOrder: 241, topics: [
    { name: "Epistemology", slug: "epistemology" },
    { name: "Ethics", slug: "ethics" },
    { name: "Logic", slug: "logic" },
    { name: "Metaphysics", slug: "metaphysics" },
  ]},
  { key: "uni_sociology", name: "Sociology", category: "University", level: "UNIVERSITY", sortOrder: 242, topics: [
    { name: "Social Institutions", slug: "institutions" },
    { name: "Social Stratification", slug: "stratification" },
    { name: "Research Methods", slug: "research" },
    { name: "Culture & Society", slug: "culture" },
  ]},
  { key: "uni_psychology", name: "Psychology", category: "University", level: "UNIVERSITY", sortOrder: 243, topics: [
    { name: "Cognitive Psychology", slug: "cognitive" },
    { name: "Developmental Psychology", slug: "developmental" },
    { name: "Social Psychology", slug: "social" },
    { name: "Abnormal Psychology", slug: "abnormal" },
  ]},
  { key: "uni_political_science", name: "Political Science", category: "University", level: "UNIVERSITY", sortOrder: 244, topics: [
    { name: "Political Theory", slug: "theory" },
    { name: "Comparative Politics", slug: "comparative" },
    { name: "International Relations", slug: "ir" },
    { name: "Public Administration", slug: "public-admin" },
  ]},

  // ─── University — CS / IT ───────────────────────────────────────
  { key: "uni_cs_programming", name: "Programming Fundamentals", category: "University CS", level: "UNIVERSITY", sortOrder: 300, topics: [
    { name: "Variables & Types", slug: "variables" },
    { name: "Control Flow", slug: "control-flow" },
    { name: "Functions & Recursion", slug: "functions" },
    { name: "Pointers & Memory", slug: "pointers" },
    { name: "File I/O", slug: "file-io" },
  ]},
  { key: "uni_cs_oop", name: "Object-Oriented Programming", category: "University CS", level: "UNIVERSITY", sortOrder: 301, topics: [
    { name: "Classes & Objects", slug: "classes" },
    { name: "Inheritance", slug: "inheritance" },
    { name: "Polymorphism", slug: "polymorphism" },
    { name: "Abstraction & Interfaces", slug: "abstraction" },
    { name: "Design Patterns", slug: "design-patterns" },
  ]},
  { key: "uni_cs_dsa", name: "Data Structures & Algorithms", category: "University CS", level: "UNIVERSITY", sortOrder: 302, topics: [
    { name: "Arrays & Linked Lists", slug: "arrays-ll" },
    { name: "Stacks & Queues", slug: "stacks-queues" },
    { name: "Trees & BSTs", slug: "trees" },
    { name: "Graphs", slug: "graphs" },
    { name: "Sorting & Searching", slug: "sorting" },
    { name: "Dynamic Programming", slug: "dp" },
    { name: "Greedy Algorithms", slug: "greedy" },
  ]},
  { key: "uni_cs_database", name: "Database Systems", category: "University CS", level: "UNIVERSITY", sortOrder: 303, topics: [
    { name: "ER Modeling", slug: "er-modeling" },
    { name: "Relational Model & SQL", slug: "sql" },
    { name: "Normalization", slug: "normalization" },
    { name: "Transactions & Concurrency", slug: "transactions" },
    { name: "NoSQL", slug: "nosql" },
  ]},
  { key: "uni_cs_os", name: "Operating Systems", category: "University CS", level: "UNIVERSITY", sortOrder: 304, topics: [
    { name: "Processes & Threads", slug: "processes" },
    { name: "Memory Management", slug: "memory" },
    { name: "File Systems", slug: "file-systems" },
    { name: "Scheduling", slug: "scheduling" },
    { name: "Deadlocks", slug: "deadlocks" },
  ]},
  { key: "uni_cs_networks", name: "Computer Networks", category: "University CS", level: "UNIVERSITY", sortOrder: 305, topics: [
    { name: "OSI & TCP/IP Models", slug: "models" },
    { name: "Routing", slug: "routing" },
    { name: "Transport Layer", slug: "transport" },
    { name: "Application Layer", slug: "application" },
    { name: "Network Security", slug: "security" },
  ]},
  { key: "uni_cs_ai", name: "Artificial Intelligence", category: "University CS", level: "UNIVERSITY", sortOrder: 306, topics: [
    { name: "Search Algorithms", slug: "search" },
    { name: "Knowledge Representation", slug: "knowledge-rep" },
    { name: "Machine Learning Basics", slug: "ml-basics" },
    { name: "Neural Networks", slug: "neural-nets" },
    { name: "NLP", slug: "nlp" },
  ]},
  { key: "uni_cs_web_dev", name: "Web Development", category: "University CS", level: "UNIVERSITY", sortOrder: 307, topics: [
    { name: "HTML/CSS/JS", slug: "html-css-js" },
    { name: "Frontend Frameworks", slug: "frontend" },
    { name: "Backend & APIs", slug: "backend" },
    { name: "Databases for Web", slug: "web-db" },
    { name: "Security", slug: "security" },
  ]},
  { key: "uni_cs_se", name: "Software Engineering", category: "University CS", level: "UNIVERSITY", sortOrder: 308, topics: [
    { name: "SDLC Models", slug: "sdlc" },
    { name: "Requirements Engineering", slug: "requirements" },
    { name: "Design & Architecture", slug: "architecture" },
    { name: "Testing", slug: "testing" },
    { name: "Agile & DevOps", slug: "agile" },
  ]},
  { key: "uni_cs_compiler", name: "Compiler Design", category: "University CS", level: "UNIVERSITY", sortOrder: 309, topics: [
    { name: "Lexical Analysis", slug: "lexical" },
    { name: "Parsing", slug: "parsing" },
    { name: "Semantic Analysis", slug: "semantic" },
    { name: "Code Generation", slug: "code-gen" },
    { name: "Optimization", slug: "optimization" },
  ]},
  { key: "uni_cs_theory", name: "Theory of Computation", category: "University CS", level: "UNIVERSITY", sortOrder: 310, topics: [
    { name: "Finite Automata", slug: "fa" },
    { name: "Regular Languages", slug: "regular" },
    { name: "Context-Free Grammars", slug: "cfg" },
    { name: "Turing Machines", slug: "turing" },
    { name: "Complexity Theory", slug: "complexity" },
  ]},
  { key: "uni_cs_ml", name: "Machine Learning", category: "University CS", level: "UNIVERSITY", sortOrder: 311, topics: [
    { name: "Supervised Learning", slug: "supervised" },
    { name: "Unsupervised Learning", slug: "unsupervised" },
    { name: "Deep Learning", slug: "deep-learning" },
    { name: "Model Evaluation", slug: "evaluation" },
  ]},

  // ─── Engineering ─────────────────────────────────────────────────
  { key: "eng_statics", name: "Engineering Statics", category: "Engineering", level: "UNIVERSITY", sortOrder: 400, topics: [
    { name: "Force Systems", slug: "forces" },
    { name: "Equilibrium", slug: "equilibrium" },
    { name: "Trusses & Frames", slug: "trusses" },
    { name: "Centroids & MOI", slug: "centroids" },
  ]},
  { key: "eng_dynamics", name: "Engineering Dynamics", category: "Engineering", level: "UNIVERSITY", sortOrder: 401, topics: [
    { name: "Particle Kinematics", slug: "particle-kin" },
    { name: "Rigid Body Kinematics", slug: "rigid-kin" },
    { name: "Kinetics", slug: "kinetics" },
    { name: "Vibrations", slug: "vibrations" },
  ]},
  { key: "eng_mechanics_materials", name: "Mechanics of Materials", category: "Engineering", level: "UNIVERSITY", sortOrder: 402, topics: [
    { name: "Stress & Strain", slug: "stress-strain" },
    { name: "Bending & Shear", slug: "bending" },
    { name: "Torsion", slug: "torsion" },
    { name: "Deflection", slug: "deflection" },
  ]},
  { key: "eng_thermodynamics", name: "Thermodynamics", category: "Engineering", level: "UNIVERSITY", sortOrder: 403, topics: [
    { name: "Laws of Thermodynamics", slug: "laws" },
    { name: "Entropy", slug: "entropy" },
    { name: "Cycles (Carnot, Rankine)", slug: "cycles" },
    { name: "Heat Transfer", slug: "heat-transfer" },
  ]},
  { key: "eng_fluid", name: "Fluid Mechanics", category: "Engineering", level: "UNIVERSITY", sortOrder: 404, topics: [
    { name: "Fluid Statics", slug: "fluid-statics" },
    { name: "Fluid Dynamics", slug: "fluid-dynamics" },
    { name: "Bernoulli's Equation", slug: "bernoulli" },
    { name: "Viscous Flow", slug: "viscous" },
  ]},
  { key: "eng_circuits", name: "Circuit Analysis", category: "Engineering", level: "UNIVERSITY", sortOrder: 410, topics: [
    { name: "DC Circuits", slug: "dc" },
    { name: "AC Circuits", slug: "ac" },
    { name: "Network Theorems", slug: "theorems" },
    { name: "Transient Analysis", slug: "transient" },
  ]},
  { key: "eng_electronics", name: "Electronics", category: "Engineering", level: "UNIVERSITY", sortOrder: 411, topics: [
    { name: "Diodes & Transistors", slug: "diodes-transistors" },
    { name: "Op-Amps", slug: "op-amps" },
    { name: "Digital Electronics", slug: "digital" },
    { name: "Power Electronics", slug: "power" },
  ]},
  { key: "eng_signals", name: "Signals & Systems", category: "Engineering", level: "UNIVERSITY", sortOrder: 412, topics: [
    { name: "Continuous-Time Signals", slug: "ct-signals" },
    { name: "Fourier Analysis", slug: "fourier" },
    { name: "Laplace Transform", slug: "laplace" },
    { name: "Z-Transform", slug: "z-transform" },
  ]},
  { key: "eng_control", name: "Control Systems", category: "Engineering", level: "UNIVERSITY", sortOrder: 413, topics: [
    { name: "Transfer Functions", slug: "transfer" },
    { name: "Stability Analysis", slug: "stability" },
    { name: "Root Locus", slug: "root-locus" },
    { name: "PID Controllers", slug: "pid" },
  ]},
  { key: "eng_dsp", name: "Digital Signal Processing", category: "Engineering", level: "UNIVERSITY", sortOrder: 414, topics: [
    { name: "DFT & FFT", slug: "dft-fft" },
    { name: "FIR & IIR Filters", slug: "filters" },
    { name: "Sampling Theorem", slug: "sampling" },
    { name: "Z-Domain Analysis", slug: "z-domain" },
  ]},

  // ─── Business ────────────────────────────────────────────────────
  { key: "biz_management", name: "Business Management", category: "Business", level: "UNIVERSITY", sortOrder: 500, topics: [
    { name: "Organizational Behavior", slug: "org-behavior" },
    { name: "Strategic Management", slug: "strategy" },
    { name: "HR Management", slug: "hr" },
    { name: "Operations Management", slug: "operations" },
  ]},
  { key: "biz_finance", name: "Finance", category: "Business", level: "UNIVERSITY", sortOrder: 501, topics: [
    { name: "Time Value of Money", slug: "tvm" },
    { name: "Capital Budgeting", slug: "capital-budget" },
    { name: "Risk & Return", slug: "risk-return" },
    { name: "Financial Markets", slug: "markets" },
  ]},
  { key: "biz_marketing", name: "Marketing", category: "Business", level: "UNIVERSITY", sortOrder: 502, topics: [
    { name: "Consumer Behavior", slug: "consumer" },
    { name: "Marketing Mix (4Ps)", slug: "4ps" },
    { name: "Digital Marketing", slug: "digital" },
    { name: "Brand Management", slug: "brand" },
  ]},
  { key: "biz_economics_micro", name: "Microeconomics", category: "Business", level: "UNIVERSITY", sortOrder: 503, topics: [
    { name: "Elasticity", slug: "elasticity" },
    { name: "Consumer Theory", slug: "consumer-theory" },
    { name: "Producer Theory", slug: "producer-theory" },
    { name: "Market Failures", slug: "market-failures" },
  ]},
  { key: "biz_economics_macro", name: "Macroeconomics", category: "Business", level: "UNIVERSITY", sortOrder: 504, topics: [
    { name: "GDP & Growth", slug: "gdp" },
    { name: "Inflation & Unemployment", slug: "inflation" },
    { name: "Fiscal Policy", slug: "fiscal" },
    { name: "Monetary Policy", slug: "monetary" },
  ]},
  { key: "biz_entrepreneurship", name: "Entrepreneurship", category: "Business", level: "UNIVERSITY", sortOrder: 505, topics: [
    { name: "Business Planning", slug: "planning" },
    { name: "Funding & Investment", slug: "funding" },
    { name: "Lean Startup", slug: "lean" },
    { name: "Scaling", slug: "scaling" },
  ]},

  // ─── Professional / Skill ────────────────────────────────────────
  { key: "prof_data_analysis", name: "Data Analysis", category: "Professional", level: "PROFESSIONAL", sortOrder: 600, topics: [
    { name: "Exploratory Data Analysis", slug: "eda" },
    { name: "Visualization", slug: "viz" },
    { name: "Statistical Inference", slug: "inference" },
    { name: "Pandas / NumPy", slug: "pandas-numpy" },
  ]},
  { key: "prof_communication", name: "Communication Skills", category: "Professional", level: "PROFESSIONAL", sortOrder: 601, topics: [
    { name: "Presentation Skills", slug: "presentation" },
    { name: "Business Writing", slug: "business-writing" },
    { name: "Public Speaking", slug: "public-speaking" },
    { name: "Negotiation", slug: "negotiation" },
  ]},
];
