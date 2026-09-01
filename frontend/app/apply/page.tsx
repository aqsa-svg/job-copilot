"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Target, Loader2, Heart, HelpCircle } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import type { ApplyResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";

export default function ApplyPage() {
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApplyResult | null>(null);

  const run = async () => {
    if (!jd.trim()) {
      toast.error("Paste a job description first.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.applyAnswers(jd);
      setResult(res);
      toast.success("Application answers ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate answers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Application answers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A ready-to-send &ldquo;why I&apos;m interested&rdquo; plus likely screening
          questions - answered in your real voice, grounded in your{" "}
          <Link href="/profile" className="text-primary underline-offset-2 hover:underline">
            profile
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-primary" /> Job description
              </CardTitle>
              <CardDescription>Paste the role you&apos;re applying to.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the full job description here…"
                className="min-h-[240px]"
              />
              <Button onClick={run} disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                Generate answers
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {loading ? (
            <AnswersSkeleton />
          ) : result ? (
            <div className="animate-fade-in space-y-4">
              <Card className="border-primary/20">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="h-4 w-4 text-primary" /> Why I&apos;m interested
                  </CardTitle>
                  <CopyButton text={result.why_interested} />
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {result.why_interested}
                  </p>
                </CardContent>
              </Card>

              {result.questions?.map((q, i) => (
                <Card key={i}>
                  <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-3">
                    <CardTitle className="flex items-start gap-2 text-[15px] leading-snug">
                      <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {q.question}
                    </CardTitle>
                    <CopyButton text={q.answer} />
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {q.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <MessageSquare className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold">Nothing generated yet</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Paste a job description and generate honest, ready-to-send answers tailored to
        the role.
      </p>
    </div>
  );
}

function AnswersSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[90%]" />
            <Skeleton className="h-3 w-[80%]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
