const URDU_RANGE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

const ROMAN_URDU_MARKERS = [
  "kya", "hai", "hain", "tha", "thi", "the", "nahi", "nahin",
  "kaise", "kaisa", "kiski", "kisko", "kab", "kahan", "kya",
  "bhai", "yar", "acha", "theek", "matlab", "samjha", "samjhi",
  "karo", "karta", "karti", "karenge", "hoga", "hogi",
  "mein", "meri", "mera", "hum", "tum", "aap", "woh", "yeh",
];

export function detectLanguage(text: string): "EN" | "UR" | "ROMAN_UR" {
  const trimmed = text.trim();
  if (!trimmed) return "EN";

  const urduChars = (trimmed.match(URDU_RANGE) || []).length;
  const totalChars = trimmed.replace(/\s/g, "").length;

  if (totalChars === 0) return "EN";

  const urduRatio = urduChars / totalChars;
  if (urduRatio > 0.3) return "UR";

  const lower = trimmed.toLowerCase();
  const words = lower.split(/\s+/);
  let romanHits = 0;
  for (const w of words) {
    if (ROMAN_URDU_MARKERS.includes(w)) romanHits++;
  }
  if (romanHits >= 2 && romanHits / words.length > 0.15) return "ROMAN_UR";

  return "EN";
}

export function isRTL(text: string): boolean {
  return URDU_RANGE.test(text);
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?۔])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function languageLabel(lang: "EN" | "UR" | "ROMAN_UR"): string {
  switch (lang) {
    case "EN": return "English";
    case "UR": return "Urdu";
    case "ROMAN_UR": return "Roman Urdu";
  }
}
