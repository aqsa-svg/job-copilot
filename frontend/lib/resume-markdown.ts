import type { Resume } from "./types";

// Build a clean Markdown document from a resume object.
export function resumeToMarkdown(resume: Resume): string {
  const lines: string[] = [];
  const push = (s = "") => lines.push(s);

  push(`# ${resume.name || "Your Name"}`);
  if (resume.title) push(`**${resume.title}**`);

  const contactBits: string[] = [];
  if (resume.contact?.email) contactBits.push(resume.contact.email);
  if (resume.contact?.phone) contactBits.push(resume.contact.phone);
  if (resume.contact?.location) contactBits.push(resume.contact.location);
  (resume.contact?.links || []).forEach((l) => {
    if (l.url) contactBits.push(`[${l.label || l.url}](${l.url})`);
  });
  if (contactBits.length) {
    push();
    push(contactBits.join(" · "));
  }

  if (resume.summary) {
    push();
    push("## Summary");
    push(resume.summary);
  }

  if (resume.skills?.length) {
    push();
    push("## Skills");
    resume.skills.forEach((g) => {
      if (g.items?.length) push(`- **${g.category}:** ${g.items.join(", ")}`);
    });
  }

  if (resume.experience?.length) {
    push();
    push("## Experience");
    resume.experience.forEach((e) => {
      const dates = [e.start, e.end].filter(Boolean).join(" – ");
      const head = [e.role, e.company].filter(Boolean).join(", ");
      push();
      push(`### ${head}`);
      const meta = [e.location, dates].filter(Boolean).join(" | ");
      if (meta) push(`*${meta}*`);
      (e.bullets || []).forEach((b) => push(`- ${b}`));
    });
  }

  if (resume.projects?.length) {
    push();
    push("## Projects");
    resume.projects.forEach((p) => {
      push();
      const title = p.link ? `[${p.name}](${p.link})` : p.name;
      push(`### ${title}`);
      if (p.tech?.length) push(`*${p.tech.join(", ")}*`);
      (p.bullets || []).forEach((b) => push(`- ${b}`));
    });
  }

  if (resume.education?.length) {
    push();
    push("## Education");
    resume.education.forEach((ed) => {
      const dates = [ed.start, ed.end].filter(Boolean).join(" – ");
      const degree = [ed.degree, ed.field].filter(Boolean).join(", ");
      push();
      push(`### ${ed.school}`);
      const meta = [degree, dates].filter(Boolean).join(" | ");
      if (meta) push(`*${meta}*`);
      if (ed.details) push(ed.details);
    });
  }

  return lines.join("\n");
}

export function downloadText(filename: string, text: string, type = "text/markdown") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "resume"
  );
}
