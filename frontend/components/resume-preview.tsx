"use client";

import type { Resume, ResumeTemplate } from "@/lib/types";

// Print-quality white "paper". Everything is sized in `em` off a scaled root
// font-size, so one `scale` shrinks fonts + spacing together for one-page fit -
// mirroring the PDF. Two templates: classic (serif, centered) / modern (sans,
// left-aligned). What you see == what exports.
const fs = (em: number) => ({ fontSize: `${em}em` });
const SANS =
  'ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export function ResumePreview({
  resume,
  scale = 1,
  template = "classic",
}: {
  resume: Resume;
  scale?: number;
  template?: ResumeTemplate;
}) {
  const modern = template === "modern";
  const contact = resume.contact || { email: "", phone: "", location: "", links: [] };
  const contactBits = [contact.email, contact.phone, contact.location].filter(Boolean);
  const align = modern ? "text-left" : "text-center";
  const justify = modern ? "justify-start" : "justify-center";

  return (
    <div
      className="resume-paper mx-auto w-full max-w-[820px] rounded-md border border-neutral-200 p-[2.5em] shadow-xl shadow-neutral-400/20 md:p-[3.25em]"
      style={{ fontSize: `${16 * scale}px`, ...(modern ? { fontFamily: SANS } : {}) }}
    >
      {/* Header */}
      <header
        className={
          "pb-[0.9em] " +
          align +
          (modern ? " border-b-2 border-neutral-900" : " border-b border-neutral-300")
        }
      >
        <h1 className="font-bold tracking-tight text-neutral-900" style={fs(modern ? 1.75 : 1.85)}>
          {resume.name || "Your Name"}
        </h1>
        {resume.title && (
          <p
            className={
              "mt-[0.2em] font-medium uppercase " +
              (modern ? "tracking-[0.12em] text-neutral-600" : "tracking-[0.18em] text-neutral-600")
            }
            style={fs(0.92)}
          >
            {resume.title}
          </p>
        )}
        <div
          className={`mt-[0.5em] flex flex-wrap items-center ${justify} gap-x-[0.75em] gap-y-[0.2em] text-neutral-700`}
          style={fs(0.78)}
        >
          {contactBits.map((b, i) => (
            <span key={i} className="flex items-center gap-[0.75em]">
              {i > 0 && <span className="text-neutral-400">•</span>}
              {b}
            </span>
          ))}
        </div>
        {contact.links?.length > 0 && (
          <div
            className={`mt-[0.2em] flex flex-wrap items-center ${justify} gap-x-[0.75em] gap-y-[0.2em]`}
            style={fs(0.78)}
          >
            {contact.links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer">
                {l.label || l.url}
              </a>
            ))}
          </div>
        )}
      </header>

      {resume.summary && (
        <Section title="Summary" modern={modern}>
          <p className="leading-relaxed text-neutral-800" style={fs(0.84)}>
            {resume.summary}
          </p>
        </Section>
      )}

      {resume.skills?.length > 0 && (
        <Section title="Skills" modern={modern}>
          <div className="space-y-[0.15em]">
            {resume.skills.map(
              (g, i) =>
                g.items?.length > 0 && (
                  <p key={i} className="text-neutral-800" style={fs(0.81)}>
                    <span className="font-semibold text-neutral-900">{g.category}: </span>
                    {g.items.join(", ")}
                  </p>
                )
            )}
          </div>
        </Section>
      )}

      {resume.experience?.length > 0 && (
        <Section title="Experience" modern={modern}>
          <div className="space-y-[1em]">
            {resume.experience.map((e, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-[1em]">
                  <h3 className="font-bold text-neutral-900" style={fs(0.9)}>
                    {e.role}
                    {e.company && (
                      <span className="font-semibold text-neutral-700"> · {e.company}</span>
                    )}
                  </h3>
                  <span className="shrink-0 text-neutral-600" style={fs(0.75)}>
                    {[e.start, e.end].filter(Boolean).join(" – ")}
                  </span>
                </div>
                {e.location && (
                  <p className="italic text-neutral-600" style={fs(0.75)}>
                    {e.location}
                  </p>
                )}
                <ul className="mt-[0.3em] list-disc space-y-[0.2em] pl-[1.25em]">
                  {(e.bullets || []).map((b, j) => (
                    <li key={j} className="leading-relaxed text-neutral-800" style={fs(0.81)}>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {resume.projects?.length > 0 && (
        <Section title="Projects" modern={modern}>
          <div className="space-y-[1em]">
            {resume.projects.map((p, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-[1em]">
                  <h3 className="font-bold text-neutral-900" style={fs(0.9)}>
                    {p.link ? (
                      <a href={p.link} target="_blank" rel="noreferrer">
                        {p.name}
                      </a>
                    ) : (
                      p.name
                    )}
                  </h3>
                </div>
                {p.tech?.length > 0 && (
                  <p className="italic text-neutral-600" style={fs(0.75)}>
                    {p.tech.join(", ")}
                  </p>
                )}
                <ul className="mt-[0.3em] list-disc space-y-[0.2em] pl-[1.25em]">
                  {(p.bullets || []).map((b, j) => (
                    <li key={j} className="leading-relaxed text-neutral-800" style={fs(0.81)}>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {resume.education?.length > 0 && (
        <Section title="Education" modern={modern}>
          <div className="space-y-[0.75em]">
            {resume.education.map((ed, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-[1em]">
                  <h3 className="font-bold text-neutral-900" style={fs(0.9)}>
                    {ed.school}
                  </h3>
                  <span className="shrink-0 text-neutral-600" style={fs(0.75)}>
                    {[ed.start, ed.end].filter(Boolean).join(" – ")}
                  </span>
                </div>
                <p className="text-neutral-800" style={fs(0.81)}>
                  {[ed.degree, ed.field].filter(Boolean).join(", ")}
                </p>
                {ed.details && (
                  <p className="text-neutral-700" style={fs(0.78)}>
                    {ed.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  modern,
}: {
  title: string;
  children: React.ReactNode;
  modern: boolean;
}) {
  return (
    <section className="mt-[1.25em]">
      <h2
        className={
          "mb-[0.5em] font-bold uppercase tracking-[0.15em] " +
          (modern
            ? "text-neutral-900"
            : "border-b border-neutral-300 pb-[0.25em] text-neutral-500")
        }
        style={fs(0.72)}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
