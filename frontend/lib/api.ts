// Thin fetch wrapper around the FastAPI backend.
import type {
  ApplyResult,
  AuthResponse,
  AuthUser,
  ImproveBulletResult,
  Profile,
  Question,
  Resume,
  SavedResume,
  SavedResumePayload,
  TailorResult,
} from "./types";

const BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:8000";

const TOKEN_KEY = "jobcopilot:token";

/** Thrown when the API rejects the request because the user isn't authenticated. */
export class UnauthorizedError extends Error {
  constructor(message = "Please sign in.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(value: string): void {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(TOKEN_KEY, value);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function clearToken(): void {
  setToken("");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Let the browser set the multipart boundary for FormData bodies.
  const isForm =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error(
      "Cannot reach the backend. Is the FastAPI server running on " + BASE + "?"
    );
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* ignore parse errors */
    }
    if (res.status === 401) throw new UnauthorizedError(detail);
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () =>
    request<{ status: string; groq_configured: boolean; model: string }>(
      "/api/health"
    ),

  // Auth
  register: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<AuthUser>("/api/auth/me"),

  // Profile
  getProfile: () => request<Profile>("/api/profile"),
  saveProfile: (profile: Profile) =>
    request<Profile>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    }),
  parseResume: (text: string) =>
    request<Partial<Profile>>("/api/profile/parse", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  parseResumeFile: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<Partial<Profile>>("/api/profile/parse-file", {
      method: "POST",
      body: fd,
    });
  },

  // Resume
  generateResume: () =>
    request<{ resume: Resume }>("/api/resume/generate", { method: "POST" }),
  tailorResume: (job_description: string) =>
    request<TailorResult>("/api/resume/tailor", {
      method: "POST",
      body: JSON.stringify({ job_description }),
    }),
  improveBullet: (bullet: string, role = "", context = "") =>
    request<ImproveBulletResult>("/api/resume/improve-bullet", {
      method: "POST",
      body: JSON.stringify({ bullet, role, context }),
    }),

  // Saved resume library
  listResumes: () => request<SavedResume[]>("/api/resumes"),
  createResume: (payload: SavedResumePayload) =>
    request<SavedResume>("/api/resumes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateResume: (id: number, patch: { label?: string; data?: Resume }) =>
    request<SavedResume>(`/api/resumes/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    }),
  deleteResume: (id: number) =>
    request<{ ok: boolean }>(`/api/resumes/${id}`, { method: "DELETE" }),

  // Apply
  applyAnswers: (job_description: string) =>
    request<ApplyResult>("/api/apply/answers", {
      method: "POST",
      body: JSON.stringify({ job_description }),
    }),

  // Questions
  listQuestions: () => request<Question[]>("/api/questions"),
  createQuestion: (q: Omit<Question, "id">) =>
    request<Question>("/api/questions", {
      method: "POST",
      body: JSON.stringify(q),
    }),
  updateQuestion: (id: number, q: Omit<Question, "id">) =>
    request<Question>(`/api/questions/${id}`, {
      method: "PUT",
      body: JSON.stringify(q),
    }),
  deleteQuestion: (id: number) =>
    request<{ ok: boolean }>(`/api/questions/${id}`, { method: "DELETE" }),
};
