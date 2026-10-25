// Validation for what the student submits. Shared by the form and the API.

export const LIMITS = {
  experienceMin: 80,
  experienceMax: 6000,
  jobMin: 80,
  jobMax: 6000,
} as const;

export interface AnalyzeInput {
  experience: string;
  job: string;
}

export type InputErrors = Partial<Record<keyof AnalyzeInput, string>>;

export function checkInput(experience: string, job: string): InputErrors {
  const errors: InputErrors = {};
  const e = experience.trim();
  const j = job.trim();
  if (e.length < LIMITS.experienceMin)
    errors.experience = `Add a bit more: at least ${LIMITS.experienceMin} characters (skills, projects, education).`;
  else if (e.length > LIMITS.experienceMax)
    errors.experience = `Too long: keep it under ${LIMITS.experienceMax} characters.`;
  if (j.length < LIMITS.jobMin)
    errors.job = `Paste the full description: at least ${LIMITS.jobMin} characters.`;
  else if (j.length > LIMITS.jobMax) errors.job = `Too long: keep it under ${LIMITS.jobMax} characters.`;
  return errors;
}

export function parseAnalyzeBody(body: unknown): { ok: true; input: AnalyzeInput } | { ok: false; errors: InputErrors } {
  if (typeof body !== "object" || body === null) return { ok: false, errors: { experience: "Invalid request." } };
  const { experience, job } = body as Record<string, unknown>;
  if (typeof experience !== "string" || typeof job !== "string")
    return { ok: false, errors: { experience: "Both fields are required." } };
  const errors = checkInput(experience, job);
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { experience: experience.trim(), job: job.trim() } };
}
