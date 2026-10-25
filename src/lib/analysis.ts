// Shape of the fit analysis returned by /api/analyze, plus a strict runtime
// check so a malformed model response never reaches the UI.

export const FIT_BANDS = ["Strong", "Moderate", "Stretch", "Weak"] as const;
export type FitBand = (typeof FIT_BANDS)[number];

export interface SkillMatch {
  skill: string;
  evidence: string; // quoted or closely paraphrased from the student's own text
}

export interface SkillGap {
  skill: string;
  importance: "must-have" | "nice-to-have";
  howToAddress: string;
}

export interface BulletSuggestion {
  original: string; // what the student wrote ("" if derived from scattered facts)
  improved: string;
  why: string;
}

export interface InterviewQuestion {
  question: string;
  talkingPoints: string;
}

export interface Analysis {
  roleTitle: string;
  fitBand: FitBand;
  verdict: string;
  matches: SkillMatch[];
  gaps: SkillGap[];
  bulletSuggestions: BulletSuggestion[];
  applicationMessage: string;
  interviewQuestions: InterviewQuestion[];
  redFlags: string[];
}

// Gemini responseSchema (OpenAPI subset). Kept next to the type so they stay in sync.
export const ANALYSIS_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    roleTitle: { type: "STRING" },
    fitBand: { type: "STRING", enum: [...FIT_BANDS] },
    verdict: { type: "STRING" },
    matches: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { skill: { type: "STRING" }, evidence: { type: "STRING" } },
        required: ["skill", "evidence"],
      },
    },
    gaps: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          skill: { type: "STRING" },
          importance: { type: "STRING", enum: ["must-have", "nice-to-have"] },
          howToAddress: { type: "STRING" },
        },
        required: ["skill", "importance", "howToAddress"],
      },
    },
    bulletSuggestions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          original: { type: "STRING" },
          improved: { type: "STRING" },
          why: { type: "STRING" },
        },
        required: ["original", "improved", "why"],
      },
    },
    applicationMessage: { type: "STRING" },
    interviewQuestions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { question: { type: "STRING" }, talkingPoints: { type: "STRING" } },
        required: ["question", "talkingPoints"],
      },
    },
    redFlags: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "roleTitle",
    "fitBand",
    "verdict",
    "matches",
    "gaps",
    "bulletSuggestions",
    "applicationMessage",
    "interviewQuestions",
    "redFlags",
  ],
} as const;

export class InvalidAnalysisError extends Error {}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function str(o: Record<string, unknown>, key: string, max = 4000): string {
  const v = o[key];
  if (typeof v !== "string") throw new InvalidAnalysisError(`${key} must be a string`);
  return v.trim().slice(0, max);
}

function arr<T>(o: Record<string, unknown>, key: string, item: (x: Record<string, unknown>) => T, max: number): T[] {
  const v = o[key];
  if (!Array.isArray(v)) throw new InvalidAnalysisError(`${key} must be an array`);
  return v.filter(isObj).slice(0, max).map(item);
}

export function parseAnalysis(raw: unknown): Analysis {
  if (!isObj(raw)) throw new InvalidAnalysisError("analysis must be an object");
  const fitBand = raw.fitBand;
  if (!FIT_BANDS.includes(fitBand as FitBand)) throw new InvalidAnalysisError("fitBand is invalid");
  const redFlags = raw.redFlags;
  if (!Array.isArray(redFlags)) throw new InvalidAnalysisError("redFlags must be an array");

  const analysis: Analysis = {
    roleTitle: str(raw, "roleTitle", 200),
    fitBand: fitBand as FitBand,
    verdict: str(raw, "verdict"),
    matches: arr(raw, "matches", (m) => ({ skill: str(m, "skill", 200), evidence: str(m, "evidence", 600) }), 15),
    gaps: arr(
      raw,
      "gaps",
      (g) => ({
        skill: str(g, "skill", 200),
        importance: g.importance === "must-have" ? "must-have" : "nice-to-have",
        howToAddress: str(g, "howToAddress", 800),
      }),
      12,
    ),
    bulletSuggestions: arr(
      raw,
      "bulletSuggestions",
      (b) => ({ original: str(b, "original", 600), improved: str(b, "improved", 600), why: str(b, "why", 400) }),
      8,
    ),
    applicationMessage: str(raw, "applicationMessage", 3000),
    interviewQuestions: arr(
      raw,
      "interviewQuestions",
      (q) => ({ question: str(q, "question", 400), talkingPoints: str(q, "talkingPoints", 800) }),
      8,
    ),
    redFlags: redFlags.filter((f): f is string => typeof f === "string").map((f) => f.trim().slice(0, 400)).slice(0, 6),
  };
  if (!analysis.verdict || !analysis.applicationMessage) throw new InvalidAnalysisError("analysis is incomplete");
  return analysis;
}
