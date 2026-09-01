"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Sparkles,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Wrench,
  LinkIcon,
  UploadCloud,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import {
  emptyProfile,
  type EducationItem,
  type ExperienceItem,
  type Profile,
  type ProjectItem,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { BulletList } from "@/components/bullet-list";

export function ProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);

  useEffect(() => {
    api
      .getProfile()
      .then(setProfile)
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Could not load profile");
        setProfile(emptyProfile());
      });
  }, []);

  if (!profile) return <ProfileFormSkeleton />;

  const set = (patch: Partial<Profile>) =>
    setProfile((p) => ({ ...(p as Profile), ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      const saved = await api.saveProfile(profile);
      setProfile(saved);
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your details once. Everything you generate is built strictly from this.
          </p>
        </div>
        <Button variant="outline" onClick={() => setPasteOpen(true)}>
          <UploadCloud className="h-4 w-4" /> Import resume
        </Button>
      </div>

      {/* Basics */}
      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
          <CardDescription>Contact details and your professional summary.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input
              value={profile.full_name}
              onChange={(e) => set({ full_name: e.target.value })}
              placeholder="Ada Lovelace"
            />
          </Field>
          <Field label="Email">
            <Input
              value={profile.email}
              onChange={(e) => set({ email: e.target.value })}
              placeholder="ada@example.com"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={profile.phone}
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="+1 555 010 0000"
            />
          </Field>
          <Field label="Location">
            <Input
              value={profile.location}
              onChange={(e) => set({ location: e.target.value })}
              placeholder="Bengaluru, India"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Summary" hint="2–3 honest sentences. Generation can rewrite this.">
              <Textarea
                value={profile.summary}
                onChange={(e) => set({ summary: e.target.value })}
                placeholder="ML engineer focused on LLM applications and recommendation systems…"
                className="min-h-[90px]"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <SectionCard
        icon={LinkIcon}
        title="Links"
        description="GitHub, LinkedIn, portfolio, Google Scholar…"
        onAdd={() => set({ links: [...profile.links, { label: "", url: "" }] })}
        addLabel="Add link"
        empty={profile.links.length === 0}
        emptyText="No links yet."
      >
        {profile.links.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={l.label}
              onChange={(e) => {
                const links = [...profile.links];
                links[i] = { ...links[i], label: e.target.value };
                set({ links });
              }}
              placeholder="GitHub"
              className="max-w-[180px]"
            />
            <Input
              value={l.url}
              onChange={(e) => {
                const links = [...profile.links];
                links[i] = { ...links[i], url: e.target.value };
                set({ links });
              }}
              placeholder="https://github.com/you"
            />
            <RemoveButton
              onClick={() => set({ links: profile.links.filter((_, idx) => idx !== i) })}
            />
          </div>
        ))}
      </SectionCard>

      {/* Skills */}
      <SectionCard
        icon={Wrench}
        title="Skills"
        description="Group by category. Only list skills you genuinely have."
        onAdd={() =>
          set({ skills: [...profile.skills, { category: "", items: [] }] })
        }
        addLabel="Add skill group"
        empty={profile.skills.length === 0}
        emptyText="No skill groups yet."
      >
        {profile.skills.map((g, i) => (
          <div key={i} className="flex items-start gap-2">
            <Input
              value={g.category}
              onChange={(e) => {
                const skills = [...profile.skills];
                skills[i] = { ...skills[i], category: e.target.value };
                set({ skills });
              }}
              placeholder="ML / AI"
              className="max-w-[200px]"
            />
            <Input
              value={g.items.join(", ")}
              onChange={(e) => {
                const skills = [...profile.skills];
                skills[i] = {
                  ...skills[i],
                  items: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                };
                set({ skills });
              }}
              placeholder="PyTorch, Transformers, RAG, scikit-learn"
            />
            <RemoveButton
              onClick={() => set({ skills: profile.skills.filter((_, idx) => idx !== i) })}
            />
          </div>
        ))}
      </SectionCard>

      {/* Experience */}
      <SectionCard
        icon={Briefcase}
        title="Experience"
        description="Roles, with results-oriented bullet points."
        onAdd={() =>
          set({
            experience: [
              ...profile.experience,
              {
                company: "",
                role: "",
                location: "",
                start: "",
                end: "",
                current: false,
                bullets: [],
              },
            ],
          })
        }
        addLabel="Add role"
        empty={profile.experience.length === 0}
        emptyText="No experience added yet."
      >
        {profile.experience.map((exp, i) => (
          <ExperienceCard
            key={i}
            value={exp}
            onChange={(next) => {
              const experience = [...profile.experience];
              experience[i] = next;
              set({ experience });
            }}
            onRemove={() =>
              set({ experience: profile.experience.filter((_, idx) => idx !== i) })
            }
          />
        ))}
      </SectionCard>

      {/* Projects */}
      <SectionCard
        icon={FolderGit2}
        title="Projects"
        description="Personal or professional projects worth showcasing."
        onAdd={() =>
          set({
            projects: [
              ...profile.projects,
              { name: "", link: "", tech: [], bullets: [] },
            ],
          })
        }
        addLabel="Add project"
        empty={profile.projects.length === 0}
        emptyText="No projects added yet."
      >
        {profile.projects.map((p, i) => (
          <ProjectCard
            key={i}
            value={p}
            onChange={(next) => {
              const projects = [...profile.projects];
              projects[i] = next;
              set({ projects });
            }}
            onRemove={() =>
              set({ projects: profile.projects.filter((_, idx) => idx !== i) })
            }
          />
        ))}
      </SectionCard>

      {/* Education */}
      <SectionCard
        icon={GraduationCap}
        title="Education"
        description="Degrees, institutions, and relevant details."
        onAdd={() =>
          set({
            education: [
              ...profile.education,
              { school: "", degree: "", field: "", start: "", end: "", details: "" },
            ],
          })
        }
        addLabel="Add education"
        empty={profile.education.length === 0}
        emptyText="No education added yet."
      >
        {profile.education.map((ed, i) => (
          <EducationCard
            key={i}
            value={ed}
            onChange={(next) => {
              const education = [...profile.education];
              education[i] = next;
              set({ education });
            }}
            onRemove={() =>
              set({ education: profile.education.filter((_, idx) => idx !== i) })
            }
          />
        ))}
      </SectionCard>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-30 flex justify-end">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/90 p-2 pl-4 shadow-xl backdrop-blur">
          <span className="text-xs text-muted-foreground">Changes aren&apos;t saved automatically</span>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save profile
          </Button>
        </div>
      </div>

      <PasteResumeDialog
        open={pasteOpen}
        onOpenChange={setPasteOpen}
        onParsed={(parsed) => {
          // Merge parsed fields over current profile, keeping the id.
          setProfile((prev) => ({
            ...(prev as Profile),
            full_name: parsed.full_name || prev?.full_name || "",
            email: parsed.email || prev?.email || "",
            phone: parsed.phone || prev?.phone || "",
            location: parsed.location || prev?.location || "",
            summary: parsed.summary || prev?.summary || "",
            links: parsed.links?.length ? parsed.links : prev?.links || [],
            skills: parsed.skills?.length ? parsed.skills : prev?.skills || [],
            experience: parsed.experience?.length ? parsed.experience : prev?.experience || [],
            projects: parsed.projects?.length ? parsed.projects : prev?.projects || [],
            education: parsed.education?.length ? parsed.education : prev?.education || [],
          }));
          toast.success("Parsed! Review the fields, then Save profile.");
        }}
      />
    </div>
  );
}

/* ---------- Sub-components ---------- */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" size="icon" variant="ghost" onClick={onClick} title="Remove">
      <Trash2 className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  onAdd,
  addLabel,
  empty,
  emptyText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
  onAdd: () => void;
  addLabel: string;
  empty?: boolean;
  emptyText?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" /> {addLabel}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {empty ? (
          <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function ExperienceCard({
  value,
  onChange,
  onRemove,
}: {
  value: ExperienceItem;
  onChange: (v: ExperienceItem) => void;
  onRemove: () => void;
}) {
  const patch = (p: Partial<ExperienceItem>) => onChange({ ...value, ...p });
  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input value={value.role} onChange={(e) => patch({ role: e.target.value })} placeholder="Role / title" />
        <Input value={value.company} onChange={(e) => patch({ company: e.target.value })} placeholder="Company" />
        <Input value={value.location} onChange={(e) => patch({ location: e.target.value })} placeholder="Location" />
        <div className="flex items-center gap-2">
          <Input value={value.start} onChange={(e) => patch({ start: e.target.value })} placeholder="Start (e.g. Jan 2023)" />
          <Input
            value={value.end}
            onChange={(e) => patch({ end: e.target.value })}
            placeholder={value.current ? "Present" : "End"}
            disabled={value.current}
          />
        </div>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={value.current}
          onChange={(e) => patch({ current: e.target.checked, end: e.target.checked ? "Present" : "" })}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        I currently work here
      </label>
      <Separator className="my-4" />
      <Label className="mb-2 block">Bullet points</Label>
      <BulletList
        bullets={value.bullets}
        onChange={(bullets) => patch({ bullets })}
        role={`${value.role} at ${value.company}`}
      />
      <div className="mt-3 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4" /> Remove role
        </Button>
      </div>
    </div>
  );
}

function ProjectCard({
  value,
  onChange,
  onRemove,
}: {
  value: ProjectItem;
  onChange: (v: ProjectItem) => void;
  onRemove: () => void;
}) {
  const patch = (p: Partial<ProjectItem>) => onChange({ ...value, ...p });
  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input value={value.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Project name" />
        <Input value={value.link} onChange={(e) => patch({ link: e.target.value })} placeholder="Link (optional)" />
      </div>
      <Input
        value={value.tech.join(", ")}
        onChange={(e) =>
          patch({ tech: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
        }
        placeholder="Tech used: Python, LangChain, FAISS"
        className="mt-3"
      />
      <Separator className="my-4" />
      <Label className="mb-2 block">Bullet points</Label>
      <BulletList
        bullets={value.bullets}
        onChange={(bullets) => patch({ bullets })}
        role={value.name}
        context="Personal / portfolio project"
      />
      <div className="mt-3 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4" /> Remove project
        </Button>
      </div>
    </div>
  );
}

function EducationCard({
  value,
  onChange,
  onRemove,
}: {
  value: EducationItem;
  onChange: (v: EducationItem) => void;
  onRemove: () => void;
}) {
  const patch = (p: Partial<EducationItem>) => onChange({ ...value, ...p });
  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input value={value.school} onChange={(e) => patch({ school: e.target.value })} placeholder="School / University" />
        <Input value={value.degree} onChange={(e) => patch({ degree: e.target.value })} placeholder="Degree (e.g. B.Tech)" />
        <Input value={value.field} onChange={(e) => patch({ field: e.target.value })} placeholder="Field (e.g. Computer Science)" />
        <div className="flex items-center gap-2">
          <Input value={value.start} onChange={(e) => patch({ start: e.target.value })} placeholder="Start" />
          <Input value={value.end} onChange={(e) => patch({ end: e.target.value })} placeholder="End" />
        </div>
      </div>
      <Textarea
        value={value.details}
        onChange={(e) => patch({ details: e.target.value })}
        placeholder="GPA, honors, relevant coursework (optional)"
        className="mt-3"
      />
      <div className="mt-3 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4" /> Remove
        </Button>
      </div>
    </div>
  );
}

function PasteResumeDialog({
  open,
  onOpenChange,
  onParsed,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onParsed: (p: Partial<Profile>) => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [parsed, setParsed] = useState<Partial<Profile> | null>(null);
  const busy = loading || uploading;

  const reset = () => {
    setParsed(null);
    setText("");
  };
  const close = () => {
    onOpenChange(false);
    reset();
  };
  const apply = () => {
    if (parsed) onParsed(parsed);
    close();
  };

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      setParsed(await api.parseResumeFile(file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to read that file");
    } finally {
      setUploading(false);
    }
  };

  const parse = async () => {
    if (!text.trim()) {
      toast.error("Paste your resume text, or upload a file above.");
      return;
    }
    setLoading(true);
    try {
      setParsed(await api.parseResume(text));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to parse resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Import an existing resume
          </DialogTitle>
          <DialogDescription>
            {parsed
              ? "Review what was detected, then apply it. You can still edit every field before saving."
              : "Upload a PDF, DOCX, or TXT - or paste the text. Extracted verbatim, nothing invented."}
          </DialogDescription>
        </DialogHeader>

        {parsed ? (
          <ParsedReview parsed={parsed} />
        ) : (
          <>
            {/* Upload dropzone */}
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (!busy) handleFile(e.dataTransfer.files?.[0]);
              }}
              className={
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors " +
                (dragOver ? "border-primary bg-primary/[0.06]" : "border-border hover:border-primary/40")
              }
            >
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                disabled={busy}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <UploadCloud className="h-6 w-6 text-primary" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {uploading ? "Reading your file…" : "Drop your resume here, or click to upload"}
                </p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT · up to 8 MB</p>
              </div>
            </label>

            {/* Divider */}
            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or paste text
              <span className="h-px flex-1 bg-border" />
            </div>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your full resume text here…"
              className="min-h-[180px] font-mono text-xs"
              disabled={busy}
            />
          </>
        )}

        <DialogFooter>
          {parsed ? (
            <>
              <Button variant="ghost" onClick={reset}>
                Back
              </Button>
              <Button onClick={apply}>
                <Check className="h-4 w-4" /> Apply to profile
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button onClick={parse} disabled={busy}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Parse pasted text
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ParsedReview({ parsed }: { parsed: Partial<Profile> }) {
  const links = parsed.links || [];
  const counts: [string, number][] = [
    ["Experience", parsed.experience?.length || 0],
    ["Projects", parsed.projects?.length || 0],
    ["Skill groups", parsed.skills?.length || 0],
    ["Education", parsed.education?.length || 0],
  ];
  return (
    <div className="space-y-4">
      {parsed.full_name && (
        <p className="text-sm">
          Name: <span className="font-medium">{parsed.full_name}</span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counts.map(([label, n]) => (
          <div key={label} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
            <div className="text-lg font-semibold">{n}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="mb-1.5 flex items-center gap-2 text-sm font-medium">
          <LinkIcon className="h-4 w-4 text-primary" /> Detected links ({links.length})
        </div>
        {links.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No links found — you can add them by hand after applying.
          </p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-auto">
            {links.map((l, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs"
              >
                <span className="shrink-0 font-medium">{l.label || "Link"}</span>
                <span className="truncate text-muted-foreground">{l.url}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ProfileFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-48" />
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
