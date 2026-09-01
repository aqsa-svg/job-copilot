// Estimate how densely a resume must be laid out to fit one A4 page, and return
// a single scale factor applied uniformly to fonts + spacing (never content).
import type { Resume } from "./types";

const MIN_SCALE = 0.62; // readability floor
const BODY_CPL = 92; // approx characters per line at base body font on A4
const CAPACITY_LINES = 47; // approx content lines that fit one A4 at base size

function wrapped(text: string | undefined, cpl = BODY_CPL): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / cpl));
}

// Rough count of the vertical "lines" the resume needs at full size.
export function estimateLines(r: Resume): number {
  let lines = 3; // name + headline + breathing room
  const c = r.contact || { email: "", phone: "", location: "", links: [] };
  const hasContact =
    !!(c.email || c.phone || c.location) || (c.links?.length ?? 0) > 0;
  if (hasContact) lines += 1;

  if (r.summary) lines += 2 + wrapped(r.summary);

  if (r.skills?.length) {
    lines += 2; // section header
    r.skills.forEach((g) => {
      if (g.items?.length) lines += wrapped(`${g.category}: ${g.items.join(", ")}`);
    });
  }

  if (r.experience?.length) {
    lines += 2;
    r.experience.forEach((e) => {
      lines += 1 + (e.location ? 1 : 0) + 0.5; // heading + meta + gap
      (e.bullets || []).forEach((b) => (lines += wrapped(b, 88)));
    });
  }

  if (r.projects?.length) {
    lines += 2;
    r.projects.forEach((p) => {
      lines += 1 + (p.tech?.length ? 1 : 0) + 0.5;
      (p.bullets || []).forEach((b) => (lines += wrapped(b, 88)));
    });
  }

  if (r.education?.length) {
    lines += 2;
    r.education.forEach((ed) => {
      lines += 2 + (ed.details ? wrapped(ed.details) : 0) + 0.4;
    });
  }

  return lines;
}

// scale = 1 for multi-page; for one-page, shrink so estimated content fits.
// Area scales ~ font², so the linear factor is ~sqrt(capacity / needed).
export function fitScale(resume: Resume, mode: "one" | "multi"): number {
  if (mode !== "one") return 1;
  const needed = estimateLines(resume);
  if (needed <= CAPACITY_LINES) return 1;
  const s = Math.sqrt(CAPACITY_LINES / needed);
  return Math.max(MIN_SCALE, Math.min(1, Number(s.toFixed(3))));
}
