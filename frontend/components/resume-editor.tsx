"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import type {
  EducationItem,
  Resume,
  ResumeExperience,
  ResumeProject,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BulletList } from "@/components/bullet-list";

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function ResumeEditor({
  resume,
  onChange,
}: {
  resume: Resume;
  onChange: (r: Resume) => void;
}) {
  const set = (patch: Partial<Resume>) => onChange({ ...resume, ...patch });
  const contact = resume.contact || { email: "", phone: "", location: "", links: [] };
  const setContact = (patch: Partial<typeof contact>) =>
    set({ contact: { ...contact, ...patch } });

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <Block title="Header">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input value={resume.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Headline / title">
            <Input value={resume.title} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={contact.email} onChange={(e) => setContact({ email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={contact.phone} onChange={(e) => setContact({ phone: e.target.value })} />
          </Field>
          <Field label="Location">
            <Input
              value={contact.location}
              onChange={(e) => setContact({ location: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-3 space-y-2">
          <Label>Links</Label>
          {contact.links.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={l.label}
                placeholder="GitHub"
                className="max-w-[160px]"
                onChange={(e) => {
                  const links = [...contact.links];
                  links[i] = { ...links[i], label: e.target.value };
                  setContact({ links });
                }}
              />
              <Input
                value={l.url}
                placeholder="https://…"
                onChange={(e) => {
                  const links = [...contact.links];
                  links[i] = { ...links[i], url: e.target.value };
                  setContact({ links });
                }}
              />
              <IconBtn title="Remove" onClick={() => setContact({ links: contact.links.filter((_, idx) => idx !== i) })}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </IconBtn>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setContact({ links: [...contact.links, { label: "", url: "" }] })}
          >
            <Plus className="h-4 w-4" /> Add link
          </Button>
        </div>
      </Block>

      {/* Summary */}
      <Block title="Summary">
        <Textarea
          value={resume.summary}
          onChange={(e) => set({ summary: e.target.value })}
          className="min-h-[90px]"
        />
      </Block>

      {/* Skills */}
      <Block
        title="Skills"
        onAdd={() => set({ skills: [...resume.skills, { category: "", items: [] }] })}
        addLabel="Add group"
      >
        {resume.skills.map((g, i) => (
          <div key={i} className="flex items-start gap-2">
            <Input
              value={g.category}
              placeholder="Category"
              className="max-w-[180px]"
              onChange={(e) => {
                const skills = [...resume.skills];
                skills[i] = { ...skills[i], category: e.target.value };
                set({ skills });
              }}
            />
            <Input
              value={g.items.join(", ")}
              placeholder="Comma, separated, skills"
              onChange={(e) => {
                const skills = [...resume.skills];
                skills[i] = {
                  ...skills[i],
                  items: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                };
                set({ skills });
              }}
            />
            <IconBtn title="Remove" onClick={() => set({ skills: resume.skills.filter((_, idx) => idx !== i) })}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </IconBtn>
          </div>
        ))}
      </Block>

      {/* Experience */}
      <Block
        title="Experience"
        onAdd={() =>
          set({
            experience: [
              ...resume.experience,
              { company: "", role: "", location: "", start: "", end: "", bullets: [] },
            ],
          })
        }
        addLabel="Add role"
      >
        {resume.experience.map((e, i) => (
          <EntryCard
            key={i}
            index={i}
            total={resume.experience.length}
            onMove={(dir) => set({ experience: move(resume.experience, i, dir) })}
            onRemove={() => set({ experience: resume.experience.filter((_, idx) => idx !== i) })}
          >
            <ExperienceFields
              value={e}
              onChange={(next) => {
                const experience = [...resume.experience];
                experience[i] = next;
                set({ experience });
              }}
            />
          </EntryCard>
        ))}
      </Block>

      {/* Projects */}
      <Block
        title="Projects"
        onAdd={() =>
          set({ projects: [...resume.projects, { name: "", link: "", tech: [], bullets: [] }] })
        }
        addLabel="Add project"
      >
        {resume.projects.map((p, i) => (
          <EntryCard
            key={i}
            index={i}
            total={resume.projects.length}
            onMove={(dir) => set({ projects: move(resume.projects, i, dir) })}
            onRemove={() => set({ projects: resume.projects.filter((_, idx) => idx !== i) })}
          >
            <ProjectFields
              value={p}
              onChange={(next) => {
                const projects = [...resume.projects];
                projects[i] = next;
                set({ projects });
              }}
            />
          </EntryCard>
        ))}
      </Block>

      {/* Education */}
      <Block
        title="Education"
        onAdd={() =>
          set({
            education: [
              ...resume.education,
              { school: "", degree: "", field: "", start: "", end: "", details: "" },
            ],
          })
        }
        addLabel="Add education"
      >
        {resume.education.map((ed, i) => (
          <EntryCard
            key={i}
            index={i}
            total={resume.education.length}
            onMove={(dir) => set({ education: move(resume.education, i, dir) })}
            onRemove={() => set({ education: resume.education.filter((_, idx) => idx !== i) })}
          >
            <EducationFields
              value={ed}
              onChange={(next) => {
                const education = [...resume.education];
                education[i] = next;
                set({ education });
              }}
            />
          </EntryCard>
        ))}
      </Block>
    </div>
  );
}

/* ---------- pieces ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button type="button" size="icon" variant="ghost" title={title} onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}

function Block({
  title,
  children,
  onAdd,
  addLabel,
}: {
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {onAdd && (
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" /> {addLabel}
          </Button>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function EntryCard({
  index,
  total,
  onMove,
  onRemove,
  children,
}: {
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-3">
      <div className="mb-2 flex items-center justify-end gap-1">
        <IconBtn title="Move up" onClick={() => onMove(-1)} disabled={index === 0}>
          <ArrowUp className="h-4 w-4" />
        </IconBtn>
        <IconBtn title="Move down" onClick={() => onMove(1)} disabled={index === total - 1}>
          <ArrowDown className="h-4 w-4" />
        </IconBtn>
        <IconBtn title="Remove" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </IconBtn>
      </div>
      {children}
    </div>
  );
}

function ExperienceFields({
  value,
  onChange,
}: {
  value: ResumeExperience;
  onChange: (v: ResumeExperience) => void;
}) {
  const patch = (p: Partial<ResumeExperience>) => onChange({ ...value, ...p });
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={value.role} placeholder="Role" onChange={(e) => patch({ role: e.target.value })} />
        <Input value={value.company} placeholder="Company" onChange={(e) => patch({ company: e.target.value })} />
        <Input value={value.location} placeholder="Location" onChange={(e) => patch({ location: e.target.value })} />
        <div className="flex gap-2">
          <Input value={value.start} placeholder="Start" onChange={(e) => patch({ start: e.target.value })} />
          <Input value={value.end} placeholder="End" onChange={(e) => patch({ end: e.target.value })} />
        </div>
      </div>
      <Separator className="my-3" />
      <BulletList
        bullets={value.bullets}
        onChange={(bullets) => patch({ bullets })}
        role={`${value.role} at ${value.company}`}
      />
    </>
  );
}

function ProjectFields({
  value,
  onChange,
}: {
  value: ResumeProject;
  onChange: (v: ResumeProject) => void;
}) {
  const patch = (p: Partial<ResumeProject>) => onChange({ ...value, ...p });
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={value.name} placeholder="Project name" onChange={(e) => patch({ name: e.target.value })} />
        <Input value={value.link} placeholder="Link" onChange={(e) => patch({ link: e.target.value })} />
      </div>
      <Input
        value={value.tech.join(", ")}
        placeholder="Tech: comma, separated"
        className="mt-2"
        onChange={(e) => patch({ tech: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
      />
      <Separator className="my-3" />
      <BulletList
        bullets={value.bullets}
        onChange={(bullets) => patch({ bullets })}
        role={value.name}
        context="Project"
      />
    </>
  );
}

function EducationFields({
  value,
  onChange,
}: {
  value: EducationItem;
  onChange: (v: EducationItem) => void;
}) {
  const patch = (p: Partial<EducationItem>) => onChange({ ...value, ...p });
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Input value={value.school} placeholder="School" onChange={(e) => patch({ school: e.target.value })} />
      <Input value={value.degree} placeholder="Degree" onChange={(e) => patch({ degree: e.target.value })} />
      <Input value={value.field} placeholder="Field" onChange={(e) => patch({ field: e.target.value })} />
      <div className="flex gap-2">
        <Input value={value.start} placeholder="Start" onChange={(e) => patch({ start: e.target.value })} />
        <Input value={value.end} placeholder="End" onChange={(e) => patch({ end: e.target.value })} />
      </div>
      <Input
        value={value.details}
        placeholder="Details (optional)"
        className="sm:col-span-2"
        onChange={(e) => patch({ details: e.target.value })}
      />
    </div>
  );
}
