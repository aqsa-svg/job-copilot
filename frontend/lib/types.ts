// Shared types mirroring the backend schemas.

export interface AuthUser {
  id: number;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface Link {
  label: string;
  url: string;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface ExperienceItem {
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  current: boolean;
  bullets: string[];
}

export interface ProjectItem {
  name: string;
  link: string;
  tech: string[];
  bullets: string[];
}

export interface EducationItem {
  school: string;
  degree: string;
  field: string;
  start: string;
  end: string;
  details: string;
}

export interface Profile {
  id?: number;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  links: Link[];
  skills: SkillGroup[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
}

// The canonical rendered-resume shape returned by generate/tailor.
export interface ResumeContact {
  email: string;
  phone: string;
  location: string;
  links: Link[];
}

export interface ResumeExperience {
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface ResumeProject {
  name: string;
  link: string;
  tech: string[];
  bullets: string[];
}

export interface Resume {
  name: string;
  title: string;
  contact: ResumeContact;
  summary: string;
  skills: SkillGroup[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  education: EducationItem[];
}

export type ResumeTemplate = "classic" | "modern";

export interface TailorResult {
  resume: Resume;
  gaps: string[];
  changes: string[];
  match_score: number | null;
  match_summary: string;
}

export interface ImproveBulletResult {
  improved: string;
  variants: string[];
  note: string;
}

export interface ApplyResult {
  why_interested: string;
  questions: { question: string; answer: string }[];
}

export interface Question {
  id: number;
  category: string;
  question: string;
  framing_tip: string;
  sample_answer: string;
}

export interface SavedResume {
  id: number;
  label: string;
  kind: "base" | "tailored";
  data: Resume;
  job_description: string;
  match_score: number | null;
  match_summary: string;
  gaps: string[];
  changes: string[];
  created_at: string | null;
  updated_at: string | null;
}

export interface SavedResumePayload {
  label: string;
  kind: "base" | "tailored";
  data: Resume;
  job_description?: string;
  match_score?: number | null;
  match_summary?: string;
  gaps?: string[];
  changes?: string[];
}

export const emptyProfile = (): Profile => ({
  full_name: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  links: [],
  skills: [],
  experience: [],
  projects: [],
  education: [],
});
