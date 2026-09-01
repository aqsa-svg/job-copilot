"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Lightbulb, HelpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import type { Question } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Draft = Omit<Question, "id"> & { id?: number };

const emptyDraft: Draft = {
  category: "General",
  question: "",
  framing_tip: "",
  sample_answer: "",
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .listQuestions()
      .then(setQuestions)
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Could not load questions");
        setQuestions([]);
      });

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.question.trim()) {
      toast.error("The question text is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        category: editing.category || "General",
        question: editing.question,
        framing_tip: editing.framing_tip,
        sample_answer: editing.sample_answer,
      };
      if (editing.id) {
        await api.updateQuestion(editing.id, payload);
        toast.success("Question updated");
      } else {
        await api.createQuestion(payload);
        toast.success("Question added");
      }
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (q: Question) => {
    try {
      await api.deleteQuestion(q.id);
      setQuestions((prev) => prev?.filter((x) => x.id !== q.id) ?? null);
      toast.success("Question deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Question bank</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tricky AI/ML screening questions, each with a framing tip and a sample
            answer. Edit freely and add your own.
          </p>
        </div>
        <Button onClick={() => setEditing({ ...emptyDraft })}>
          <Plus className="h-4 w-4" /> Add question
        </Button>
      </div>

      {questions === null ? (
        <QuestionsSkeleton />
      ) : questions.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <HelpCircle className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold">No questions yet</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Add your first screening question to start building your prep bank.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <Badge variant="secondary">{q.category}</Badge>
                    <CardTitle className="flex items-start gap-2 text-[15px] leading-snug">
                      <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {q.question}
                    </CardTitle>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditing({ ...q })}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(q)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {q.framing_tip && (
                  <div className="flex gap-2 rounded-lg bg-primary/[0.06] p-3">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">Framing tip: </span>
                      {q.framing_tip}
                    </p>
                  </div>
                )}
                {q.sample_answer && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Sample answer
                      </p>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {q.sample_answer}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit question" : "Add question"}</DialogTitle>
            <DialogDescription>
              Keep sample answers honest - they&apos;re a template for your real story,
              not a script to fabricate one.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Input
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    placeholder="Technical"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Question</Label>
                  <Input
                    value={editing.question}
                    onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                    placeholder="Which ML algorithms have you implemented?"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Framing tip</Label>
                <Textarea
                  value={editing.framing_tip}
                  onChange={(e) => setEditing({ ...editing, framing_tip: e.target.value })}
                  placeholder="How to approach answering this…"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sample answer</Label>
                <Textarea
                  value={editing.sample_answer}
                  onChange={(e) => setEditing({ ...editing, sample_answer: e.target.value })}
                  placeholder="A strong, honest sample answer…"
                  className="min-h-[120px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing?.id ? "Save changes" : "Add question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuestionsSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-2 h-5 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[85%]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
