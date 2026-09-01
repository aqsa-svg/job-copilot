"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  FileText,
  ShieldCheck,
  Sparkles,
  Target,
  Wand2,
  MessageSquare,
  XCircle,
} from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: FileText,
    title: "Generate",
    body: "Turn your saved profile into a clean, ATS-friendly resume - structured, then rendered on a print-quality page.",
  },
  {
    icon: Target,
    title: "Tailor to a job",
    body: "Paste a JD and reorder skills, projects, and bullets to match - mirroring the role's language, truthfully.",
  },
  {
    icon: Wand2,
    title: "Improve bullets",
    body: "Rewrite any bullet to be action-first and results-oriented. No invented numbers - just [add metric] placeholders.",
  },
  {
    icon: MessageSquare,
    title: "Application answers",
    body: "A ready-to-send 'why I'm interested' plus likely screening questions, answered in your real voice.",
  },
];

const hints = [
  "Use “Led” instead of “Responsible for”",
  "Impact unknown? → [add metric]",
  "Reordered to mirror the job description",
  "Gaps surfaced, never invented",
];

export default function HomePage() {
  const [groqOk, setGroqOk] = useState<boolean | null>(null);
  const [reachable, setReachable] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .health()
      .then((h) => {
        setReachable(true);
        setGroqOk(h.groq_configured);
      })
      .catch(() => setReachable(false));
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center">
        <Badge variant="outline" className="mb-5 gap-1.5 py-1">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Honesty-first · never fabricated
        </Badge>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          A resume that&apos;s sharp -{" "}
          <span className="text-primary">
            and 100% true
          </span>
          .
        </h1>
        <p className="mt-5 text-pretty text-lg text-muted-foreground">
          Enter your experience once. Job Copilot generates, tailors, and exports a
          polished resume for <span className="text-foreground">any role</span> -
          reorganizing and sharpening only what you actually did.{" "}
          <span className="text-foreground">Never fabricated.</span>
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="bg-orange-500 text-white hover:bg-orange-600">
            <Link href="/profile">
              Build your profile <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/resume">
              <Sparkles className="h-4 w-4" /> Generate a resume
            </Link>
          </Button>
        </div>

        {/* Status line - only shown when something needs attention */}
        <StatusPill reachable={reachable} groqOk={groqOk} />

        {/* Floating AI-hint pills (honesty-flavored) */}
        <div className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-[11px] font-light text-muted-foreground/55">
          {hints.map((h, i) => (
            <span key={h} className="flex items-center gap-2.5">
              {i > 0 && <span className="text-muted-foreground/25">·</span>}
              {h}
            </span>
          ))}
        </div>
      </section>

      {/* Glowing resume mock (decorative) */}
      <section className="relative mx-auto max-w-2xl">
        <div className="pointer-events-none absolute inset-x-8 bottom-0 h-40 rounded-[50%] bg-orange-400/30 blur-3xl" />
        <div
          className="relative mx-auto w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-8 text-left shadow-2xl shadow-black/10 sm:p-10"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {/* Sample resume (illustrative) */}
          <div className="border-b border-neutral-300 pb-3 text-center">
            <div className="text-xl font-bold tracking-tight text-neutral-900">Alex Morgan</div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
              Machine Learning Engineer
            </div>
            <div className="mt-1.5 text-[11px] text-neutral-600">
              alex@example.com · San Francisco · github.com/alexm
            </div>
          </div>

          <Block title="Experience">
            <div className="flex items-baseline justify-between">
              <div className="text-[13px] font-bold text-neutral-900">
                ML Engineer <span className="font-semibold text-neutral-600">· Nimbus AI</span>
              </div>
              <div className="text-[10px] text-neutral-500">2022 – Present</div>
            </div>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-[11.5px] leading-relaxed text-neutral-700">
              <li>Built a RAG assistant over internal docs, cutting lookup time by 40%</li>
              <li>Shipped a ranking model that lifted click-through by 18%</li>
            </ul>
          </Block>

          <Block title="Skills">
            <p className="text-[11.5px] leading-relaxed text-neutral-700">
              Python, PyTorch, Transformers, RAG, SQL, Docker, AWS
            </p>
          </Block>

          <Block title="Education">
            <div className="flex items-baseline justify-between text-[11.5px] text-neutral-700">
              <span className="font-semibold text-neutral-900">UC Berkeley</span>
              <span className="text-[10px] text-neutral-500">2016 – 2020</span>
            </div>
            <p className="text-[11px] text-neutral-600">B.S. Computer Science</p>
          </Block>
        </div>
      </section>

      {/* Feature grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <Card key={f.title} className="transition-colors hover:border-primary/40">
            <CardContent className="pt-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Honesty callout */}
      <section className="mx-auto max-w-3xl">
        <Card className="border-primary/20 bg-gradient-to-b from-primary/[0.06] to-transparent">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">The honesty guarantee</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Job Copilot never invents experience, skills, employers, dates, or
                metrics. It only reorganizes, rephrases, and emphasizes what you
                entered. When a job needs something you don&apos;t have, it shows a
                separate <span className="text-foreground">&ldquo;gaps to address&rdquo;</span>{" "}
                note instead of quietly adding it - so every claim stays yours.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-3.5">
      <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">
        {title}
      </div>
      {children}
    </section>
  );
}

function StatusPill({
  reachable,
  groqOk,
}: {
  reachable: boolean | null;
  groqOk: boolean | null;
}) {
  // Stay silent while checking and on success - only surface problems.
  if (reachable === null || (reachable && groqOk)) return null;

  return (
    <div className="mt-8 flex items-center justify-center">
      {!reachable ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs text-destructive">
          <XCircle className="h-3.5 w-3.5" />
          Backend not reachable - start FastAPI on :8000
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-600">
          <XCircle className="h-3.5 w-3.5" />
          Backend up · set GROQ_API_KEY in backend/.env
        </span>
      )}
    </div>
  );
}
