export interface VoicePreset {
  id: string;
  label: string;
  description: string;
  voiceName: string;
  speed: number;
  pitch: number;
}

export const VOICE_PRESETS: Record<string, VoicePreset> = {
  FRIENDLY: {
    id: "FRIENDLY",
    label: "Friendly",
    description: "Warm, approachable — like a helpful classmate",
    voiceName: "Kore",
    speed: 1.0,
    pitch: 1.0,
  },
  PROFESSIONAL: {
    id: "PROFESSIONAL",
    label: "Professional",
    description: "Clear, measured — like a university lecturer",
    voiceName: "Charon",
    speed: 0.95,
    pitch: 0.95,
  },
  YOUNG_MENTOR: {
    id: "YOUNG_MENTOR",
    label: "Young Mentor",
    description: "Energetic, encouraging — like a senior student",
    voiceName: "Puck",
    speed: 1.05,
    pitch: 1.1,
  },
  EXAM_COACH: {
    id: "EXAM_COACH",
    label: "Exam Coach",
    description: "Focused, precise — like a test prep tutor",
    voiceName: "Orus",
    speed: 0.9,
    pitch: 1.0,
  },
  URDU_TEACHER: {
    id: "URDU_TEACHER",
    label: "Urdu Teacher",
    description: "Natural Urdu pronunciation with clear enunciation",
    voiceName: "Leda",
    speed: 0.9,
    pitch: 1.0,
  },
};

export const DEFAULT_PRESET = "FRIENDLY";

export function getPreset(id: string | null | undefined): VoicePreset {
  if (id && id in VOICE_PRESETS) return VOICE_PRESETS[id]!;
  return VOICE_PRESETS[DEFAULT_PRESET]!;
}
