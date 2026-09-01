// Deterministic, explainable ATS-friendliness score for a resume.
// No LLM, no network - every point is traceable to a rule below, so the app can
// honestly "tell on what basis" it scored.
import type { Resume } from "./types";

export type AtsStatus = "pass" | "warn" | "fail";

export interface AtsCheck {
  label: string;
  status: AtsStatus;
  detail: string;
  weight: number;
}

export interface AtsReport {
  score: number; // 0-100
  checks: AtsCheck[];
}

const ACTION_VERBS = new Set([
  "built","led","developed","designed","implemented","created","launched","improved",
  "increased","reduced","optimized","automated","delivered","managed","architected",
  "engineered","deployed","migrated","scaled","analyzed","researched","trained",
  "fine-tuned","shipped","drove","spearheaded","established","streamlined","integrated",
  "wrote","published","mentored","coordinated","produced","achieved","generated",
  "resolved","refactored","orchestrated","founded","initiated","accelerated","boosted",
  "cut","grew","led","owned","directed","executed","modernized","overhauled","pioneered",
  "prototyped","rearchitected","reengineered","standardized","transformed","unified",
]);

const STOP = new Set([
  "the","and","for","with","you","your","our","are","will","that","this","have","has",
  "from","who","all","can","not","but","they","them","their","its","was","were","been",
  "a","an","to","of","in","on","or","as","by","at","is","be","we","us","it","if","so",
  "role","team","work","working","experience","years","year","strong","ability","using",
  "job","company","required","requirements","responsibilities","preferred","plus","must",
  "looking","join","help","across","within","including","etc","new","good","great",
]);

function status(frac: number): AtsStatus {
  if (frac >= 0.8) return "pass";
  if (frac >= 0.5) return "warn";
  return "fail";
}

function allBullets(r: Resume): string[] {
  const out: string[] = [];
  (r.experience || []).forEach((e) => out.push(...(e.bullets || [])));
  (r.projects || []).forEach((p) => out.push(...(p.bullets || [])));
  return out.filter((b) => b && b.trim());
}

function resumeText(r: Resume): string {
  const parts: string[] = [r.title, r.summary];
  (r.skills || []).forEach((g) => parts.push(g.category, ...(g.items || [])));
  (r.experience || []).forEach((e) => parts.push(e.role, e.company, ...(e.bullets || [])));
  (r.projects || []).forEach((p) => parts.push(p.name, ...(p.tech || []), ...(p.bullets || [])));
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function jdKeywords(jd: string): string[] {
  const tokens = jd.toLowerCase().match(/[a-z][a-z0-9+.#-]{2,}/g) || [];
  const freq = new Map<string, number>();
  for (const t of tokens) {
    if (STOP.has(t) || t.length < 3) continue;
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 22)
    .map(([w]) => w);
}

export function atsReport(resume: Resume, jd?: string): AtsReport {
  const checks: AtsCheck[] = [];
  const bullets = allBullets(resume);
  const c = resume.contact || { email: "", phone: "", location: "", links: [] };

  // 1) Contact completeness
  {
    let f = 0;
    if (c.email) f += 0.4;
    if (c.phone) f += 0.3;
    if (c.location) f += 0.1;
    if ((c.links?.length ?? 0) > 0) f += 0.2;
    const missing = [
      !c.email && "email",
      !c.phone && "phone",
      !c.location && "location",
      !(c.links?.length ?? 0) && "a link (LinkedIn/GitHub)",
    ].filter(Boolean);
    checks.push({
      label: "Contact details",
      status: status(f),
      weight: 10,
      detail: missing.length ? `Add: ${missing.join(", ")}.` : "Email, phone, location, and links present.",
    });
  }

  // 2) Standard sections
  {
    const present = [
      !!resume.summary && "Summary",
      (resume.skills?.length ?? 0) > 0 && "Skills",
      (resume.experience?.length ?? 0) > 0 && "Experience",
      (resume.education?.length ?? 0) > 0 && "Education",
    ].filter(Boolean) as string[];
    const f = present.length / 4;
    checks.push({
      label: "Standard sections",
      status: status(f),
      weight: 12,
      detail: `${present.length}/4 core sections present (Summary, Skills, Experience, Education).`,
    });
  }

  // 3) Action-verb bullets
  {
    const strong = bullets.filter((b) => {
      const first = b.trim().toLowerCase().split(/[^a-z-]+/)[0];
      return ACTION_VERBS.has(first);
    }).length;
    const f = bullets.length ? strong / bullets.length : 0;
    checks.push({
      label: "Action-verb bullets",
      status: bullets.length ? status(f) : "warn",
      weight: 15,
      detail: bullets.length
        ? `${strong}/${bullets.length} bullets start with a strong action verb.`
        : "No bullet points yet.",
    });
  }

  // 4) Quantified impact
  {
    const quantified = bullets.filter((b) => /\d/.test(b) && !/\[add metric\]/i.test(b)).length;
    const f = bullets.length ? quantified / bullets.length : 0;
    checks.push({
      label: "Quantified impact",
      status: bullets.length ? status(f) : "warn",
      weight: 14,
      detail: bullets.length
        ? `${quantified}/${bullets.length} bullets include a number/metric.`
        : "Add measurable outcomes where you truly know them.",
    });
  }

  // 5) No unfilled placeholders
  {
    const ph = bullets.filter((b) => /\[add metric\]/i.test(b)).length;
    const f = bullets.length ? 1 - ph / bullets.length : 1;
    checks.push({
      label: "No unfilled placeholders",
      status: ph === 0 ? "pass" : status(f),
      weight: 12,
      detail: ph === 0 ? "No [add metric] placeholders left." : `${ph} bullet(s) still contain [add metric] - fill with your real numbers.`,
    });
  }

  // 6) Bullet length
  {
    const ok = bullets.filter((b) => b.length >= 25 && b.length <= 230).length;
    const f = bullets.length ? ok / bullets.length : 1;
    checks.push({
      label: "Concise bullets",
      status: bullets.length ? status(f) : "pass",
      weight: 7,
      detail: bullets.length ? `${ok}/${bullets.length} bullets are a scannable length (25–230 chars).` : "-",
    });
  }

  // 7) Skills depth
  {
    const total = (resume.skills || []).reduce((n, g) => n + (g.items?.length || 0), 0);
    const f = Math.min(1, total / 6);
    checks.push({
      label: "Skills coverage",
      status: status(f),
      weight: 8,
      detail: `${total} skill(s) listed${total < 6 ? " - aim for 6+ relevant, real skills." : "."}`,
    });
  }

  // 8) Format & parseability (guaranteed by the template)
  checks.push({
    label: "Machine-readable format",
    status: "pass",
    weight: 10,
    detail: "Single column, standard fonts, real text (no tables, images, or columns) - parses cleanly.",
  });

  // 9) JD keyword coverage (only when tailored)
  if (jd && jd.trim()) {
    const keys = jdKeywords(jd);
    const text = resumeText(resume);
    const matched = keys.filter((k) => text.includes(k));
    const f = keys.length ? matched.length / keys.length : 1;
    const missing = keys.filter((k) => !text.includes(k)).slice(0, 8);
    checks.push({
      label: "JD keyword coverage (approx.)",
      status: status(f),
      weight: 12,
      detail: `${matched.length}/${keys.length} key terms from the job description appear in your resume.${
        missing.length ? ` Missing e.g.: ${missing.join(", ")}.` : ""
      } Only add ones you can truthfully back up.`,
    });
  }

  const totalW = checks.reduce((n, c) => n + c.weight, 0);
  const got = checks.reduce((n, c) => n + c.weight * (c.status === "pass" ? 1 : c.status === "warn" ? 0.6 : 0.15), 0);
  const score = Math.round((got / totalW) * 100);

  return { score, checks };
}
