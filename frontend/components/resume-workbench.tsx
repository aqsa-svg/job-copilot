"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Target,
  Loader2,
  FileText,
  Files,
  AlertTriangle,
  ListChecks,
  Wand2,
  Pencil,
  Save,
  Library,
  Trash2,
  FolderOpen,
  Check,
  LayoutTemplate,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { fitScale } from "@/lib/fit";
import type { Resume, ResumeTemplate, SavedResume } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResumePreview } from "@/components/resume-preview";
import { ResumeExport } from "@/components/resume-export";
import { ResumeEditor } from "@/components/resume-editor";
import { AtsReportCard } from "@/components/ats-report";

const WB_KEY = "jobcopilot:workbench:v1";

export function ResumeWorkbench() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [gaps, setGaps] = useState<string[]>([]);
  const [changes, setChanges] = useState<string[]>([]);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState<"generate" | "tailor" | null>(null);
  const [tailored, setTailored] = useState(false);
  const [match, setMatch] = useState<{ score: number | null; summary: string }>({
    score: null,
    summary: "",
  });
  const [editing, setEditing] = useState(false);
  const [pageMode, setPageMode] = useState<"one" | "multi">("multi");
  const [template, setTemplate] = useState<ResumeTemplate>("classic");

  // One scale factor drives both the preview and the PDF (density, not content).
  const scale = useMemo(
    () => (resume ? fitScale(resume, pageMode) : 1),
    [resume, pageMode]
  );

  // Saved library
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [currentLabel, setCurrentLabel] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [restored, setRestored] = useState(false);

  // Restore the working resume from localStorage + load the library once.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WB_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.resume) {
          setResume(s.resume);
          setGaps(s.gaps || []);
          setChanges(s.changes || []);
          setMatch(s.match || { score: null, summary: "" });
          setTailored(!!s.tailored);
          setJd(s.jd || "");
          setCurrentId(s.currentId ?? null);
          setCurrentLabel(s.currentLabel || "");
          if (s.pageMode === "one" || s.pageMode === "multi") setPageMode(s.pageMode);
          if (s.template === "classic" || s.template === "modern") setTemplate(s.template);
        }
      }
    } catch {
      /* ignore corrupt cache */
    }
    setRestored(true);
    refreshLibrary();
  }, []);

  // Persist working state (after the initial restore, to avoid clobbering it).
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(
        WB_KEY,
        JSON.stringify({ resume, gaps, changes, match, tailored, jd, currentId, currentLabel, pageMode, template })
      );
    } catch {
      /* storage may be full/blocked */
    }
  }, [restored, resume, gaps, changes, match, tailored, jd, currentId, currentLabel, pageMode, template]);

  const refreshLibrary = () =>
    api.listResumes().then(setResumes).catch(() => {});

  const generate = async () => {
    setLoading("generate");
    try {
      const { resume } = await api.generateResume();
      setResume(resume);
      setGaps([]);
      setChanges([]);
      setMatch({ score: null, summary: "" });
      setTailored(false);
      setCurrentId(null);
      setCurrentLabel("");
      setEditing(false);
      toast.success("Resume generated from your profile");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(null);
    }
  };

  const tailor = async () => {
    if (!jd.trim()) {
      toast.error("Paste a job description first.");
      return;
    }
    setLoading("tailor");
    try {
      const res = await api.tailorResume(jd);
      setResume(res.resume);
      setGaps(res.gaps || []);
      setChanges(res.changes || []);
      setMatch({ score: res.match_score, summary: res.match_summary || "" });
      setTailored(true);
      setCurrentId(null);
      setCurrentLabel("");
      setEditing(false);
      toast.success("Resume tailored to the job");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to tailor");
    } finally {
      setLoading(null);
    }
  };

  const saveAsNew = async (label: string) => {
    if (!resume) return;
    try {
      const saved = await api.createResume({
        label,
        kind: tailored ? "tailored" : "base",
        data: resume,
        job_description: jd,
        match_score: match.score,
        match_summary: match.summary,
        gaps,
        changes,
      });
      setCurrentId(saved.id);
      setCurrentLabel(saved.label);
      await refreshLibrary();
      toast.success(`Saved “${saved.label}” to your library`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const updateCurrent = async () => {
    if (!resume || currentId === null) return;
    try {
      await api.updateResume(currentId, { data: resume });
      await refreshLibrary();
      toast.success("Saved copy updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const openSaved = (r: SavedResume) => {
    setResume(r.data);
    setGaps(r.gaps || []);
    setChanges(r.changes || []);
    setMatch({ score: r.match_score, summary: r.match_summary || "" });
    setTailored(r.kind === "tailored");
    setJd(r.job_description || "");
    setCurrentId(r.id);
    setCurrentLabel(r.label);
    setEditing(false);
    toast.success(`Opened “${r.label}”`);
  };

  const removeSaved = async (r: SavedResume) => {
    try {
      await api.deleteResume(r.id);
      setResumes((prev) => prev.filter((x) => x.id !== r.id));
      if (currentId === r.id) {
        setCurrentId(null);
        setCurrentLabel("");
      }
      toast.success("Deleted from library");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const suggestedLabel = () => {
    if (currentLabel) return currentLabel;
    const base = resume?.name ? `${resume.name}` : "Resume";
    return tailored ? `${base} - tailored` : `${base} - base`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resume</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate, tailor, edit, save versions, and export.
          </p>
        </div>
        {resume && (
          <div className="flex flex-wrap items-center gap-2 no-print">
            <div className="inline-flex rounded-md border border-border p-0.5" title="Resume template">
              <button
                onClick={() => setTemplate("classic")}
                className={
                  "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors " +
                  (template === "classic"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                <LayoutTemplate className="h-3.5 w-3.5" /> Classic
              </button>
              <button
                onClick={() => setTemplate("modern")}
                className={
                  "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors " +
                  (template === "modern"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                <LayoutTemplate className="h-3.5 w-3.5" /> Modern
              </button>
            </div>
            <div className="inline-flex rounded-md border border-border p-0.5" title="Fit to one page, or let content flow across pages">
              <button
                onClick={() => setPageMode("one")}
                className={
                  "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors " +
                  (pageMode === "one"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                <FileText className="h-3.5 w-3.5" /> One page
              </button>
              <button
                onClick={() => setPageMode("multi")}
                className={
                  "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors " +
                  (pageMode === "multi"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                <Files className="h-3.5 w-3.5" /> Multi-page
              </button>
            </div>
            <Button
              variant={editing ? "default" : "outline"}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {editing ? "Done editing" : "Edit"}
            </Button>
            {currentId !== null && (
              <Button variant="outline" onClick={updateCurrent} title="Save edits to the open copy">
                <Save className="h-4 w-4" /> Update
              </Button>
            )}
            <Button variant="outline" onClick={() => setSaveOpen(true)}>
              <Library className="h-4 w-4" /> Save as new
            </Button>
            <ResumeExport resume={resume} scale={scale} template={template} />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Controls */}
        <div className="space-y-6 no-print">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="generate">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="generate">
                    <Sparkles className="mr-1.5 h-4 w-4" /> Generate
                  </TabsTrigger>
                  <TabsTrigger value="tailor">
                    <Target className="mr-1.5 h-4 w-4" /> Tailor
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="generate" className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Build a clean, ATS-friendly resume from everything in your profile.
                  </p>
                  <Button onClick={generate} disabled={loading !== null} className="w-full">
                    {loading === "generate" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generate resume
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Need to add details first?{" "}
                    <Link href="/profile" className="text-primary underline-offset-2 hover:underline">
                      Edit your profile
                    </Link>
                    .
                  </p>
                </TabsContent>

                <TabsContent value="tailor" className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Paste a job description. The resume is reordered and rephrased to
                    match - truthfully, with a separate gaps list.
                  </p>
                  <Textarea
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    placeholder="Paste the full job description here…"
                    className="min-h-[200px]"
                  />
                  <Button onClick={tailor} disabled={loading !== null} className="w-full">
                    {loading === "tailor" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Target className="h-4 w-4" />
                    )}
                    Tailor to this job
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* ATS score */}
          {resume && <AtsReportCard resume={resume} jd={tailored ? jd : undefined} />}

          {/* Match meter */}
          {tailored && match.score !== null && (
            <MatchMeter score={match.score} summary={match.summary} />
          )}

          {/* Gaps */}
          {tailored && (
            <Card className="border-amber-500/25">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> Gaps to address
                </CardTitle>
                <CardDescription>
                  Requirements your profile doesn&apos;t clearly support. Never added
                  silently - you decide.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {gaps.length === 0 ? (
                  <p className="text-sm text-emerald-600">
                    No obvious gaps - your profile covers the stated requirements well.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {gaps.map((g, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {g}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Changes */}
          {tailored && changes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ListChecks className="h-4 w-4 text-primary" /> What changed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {changes.map((c, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {c}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Library */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Library className="h-4 w-4 text-primary" /> Saved resumes
              </CardTitle>
              <CardDescription>Your saved base and tailored versions.</CardDescription>
            </CardHeader>
            <CardContent>
              {resumes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing saved yet. Generate or tailor a resume, then{" "}
                  <span className="text-foreground">Save as new</span>.
                </p>
              ) : (
                <ul className="space-y-2">
                  {resumes.map((r) => (
                    <li
                      key={r.id}
                      className={
                        "flex items-center justify-between gap-2 rounded-lg border p-2.5 " +
                        (currentId === r.id ? "border-primary/40 bg-primary/[0.05]" : "border-border")
                      }
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{r.label}</span>
                          <Badge variant={r.kind === "tailored" ? "default" : "secondary"}>
                            {r.kind}
                          </Badge>
                          {r.kind === "tailored" && r.match_score !== null && (
                            <span className="text-xs text-muted-foreground">{r.match_score}%</span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="icon" variant="ghost" title="Open" onClick={() => openSaved(r)}>
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Delete" onClick={() => removeSaved(r)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview / editor */}
        <div>
          {loading ? (
            <PreviewSkeleton />
          ) : resume ? (
            <div className="animate-fade-in">
              {(tailored || currentLabel || pageMode === "one") && (
                <div className="mb-3 flex flex-wrap items-center gap-2 no-print">
                  {pageMode === "one" && (
                    <Badge variant="secondary">
                      <FileText className="mr-1 h-3 w-3" /> One page
                      {scale < 1 ? ` · ${Math.round(scale * 100)}% density` : ""}
                    </Badge>
                  )}
                  {tailored && (
                    <Badge>
                      <Wand2 className="mr-1 h-3 w-3" /> Tailored version
                    </Badge>
                  )}
                  {currentLabel && (
                    <span className="text-xs text-muted-foreground">Editing: {currentLabel}</span>
                  )}
                </div>
              )}
              {editing ? (
                <ResumeEditor resume={resume} onChange={setResume} />
              ) : (
                <ResumePreview resume={resume} scale={scale} template={template} />
              )}
            </div>
          ) : (
            <EmptyPreview />
          )}
        </div>
      </div>

      {/* Save dialog */}
      <SaveDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        initial={suggestedLabel()}
        onSave={saveAsNew}
      />
    </div>
  );
}

function SaveDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: string;
  onSave: (label: string) => Promise<void>;
}) {
  const [label, setLabel] = useState(initial);
  const [saving, setSaving] = useState(false);

  // Reset the field to the suggestion whenever the dialog opens.
  useEffect(() => {
    if (open) setLabel(initial);
  }, [open, initial]);

  const submit = async () => {
    const value = label.trim() || initial;
    setSaving(true);
    await onSave(value);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save resume to library</DialogTitle>
          <DialogDescription>
            Keep this version so you can reopen and export it later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Senior MLE - Acme"
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MatchMeter({ score, summary }: { score: number; summary: string }) {
  const tone =
    score >= 75
      ? { text: "text-emerald-600", bar: "bg-emerald-500" }
      : score >= 50
        ? { text: "text-primary", bar: "bg-primary" }
        : { text: "text-amber-600", bar: "bg-amber-500" };
  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-b from-primary/[0.08] to-transparent">
      <CardContent className="pt-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Estimated match
            </p>
            <p className={"mt-0.5 text-4xl font-bold tabular-nums " + tone.text}>
              {score}
              <span className="text-lg text-muted-foreground">%</span>
            </p>
          </div>
          <Target className="h-6 w-6 text-primary/70" />
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={"h-full rounded-full transition-all duration-700 " + tone.bar}
            style={{ width: `${score}%` }}
          />
        </div>
        {summary && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{summary}</p>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground/70">
          An honest estimate of fit - not a claim added to your resume.
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyPreview() {
  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <FileText className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold">No resume yet</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Hit <span className="text-foreground">Generate resume</span> to build one from
        your profile, or paste a job description to tailor it to a specific role.
      </p>
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[820px] space-y-4 rounded-md bg-white/95 p-12 shadow-2xl">
      <Skeleton className="mx-auto h-8 w-56 bg-neutral-200" />
      <Skeleton className="mx-auto h-4 w-80 bg-neutral-200" />
      <div className="pt-4">
        <Skeleton className="mb-2 h-3 w-24 bg-neutral-200" />
        <Skeleton className="h-3 w-full bg-neutral-200" />
        <Skeleton className="mt-1.5 h-3 w-[92%] bg-neutral-200" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="pt-3">
          <Skeleton className="mb-2 h-4 w-48 bg-neutral-200" />
          <Skeleton className="h-3 w-full bg-neutral-200" />
          <Skeleton className="mt-1.5 h-3 w-[88%] bg-neutral-200" />
          <Skeleton className="mt-1.5 h-3 w-[80%] bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}
