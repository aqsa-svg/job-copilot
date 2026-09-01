"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: FileText,
    title: "Generate",
    body: "Turn your details into a clean, ATS-friendly resume, rendered on a print-quality page.",
  },
  {
    icon: Target,
    title: "Tailor to a job",
    body: "Paste a job description and reorder skills and bullets to match its language, truthfully.",
  },
  {
    icon: Wand2,
    title: "Improve bullets",
    body: "Rewrite any bullet to be action-first. No invented numbers, just [add metric] placeholders.",
  },
  {
    icon: MessageSquare,
    title: "Application answers",
    body: "A ready 'why I'm interested' plus likely screening questions, answered in your real voice.",
  },
];

const principles = ["No fake metrics", "No invented jobs", "Gaps shown, not hidden"];

export function Landing({
  onCreate,
  onSignIn,
}: {
  onCreate: () => void;
  onSignIn: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduce(r);
    setMounted(true);
    if (r) {
      setPct(92);
      return;
    }
    let raf = 0;
    let cancelled = false;
    const start = performance.now();
    const dur = 1500;
    const tick = (now: number) => {
      if (cancelled) return;
      const p = Math.min(1, (now - start) / dur);
      setPct(Math.round((1 - Math.pow(1 - p, 3)) * 92));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const t = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, 550);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Staggered entrance helpers.
  const reveal = () =>
    reduce
      ? ""
      : `transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`;
  const delay = (i: number) => (reduce ? undefined : { transitionDelay: `${i * 90}ms` });

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-base">
            Job<span className="text-orange-600">Copilot</span>
          </span>
        </div>
        <Button variant="ghost" onClick={onSignIn}>
          Sign in
        </Button>
      </header>

      {/* Hero */}
      <section className="container grid items-center gap-12 py-10 md:grid-cols-2 md:py-16">
        <div>
          <Badge variant="outline" className="mb-5 gap-1.5 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Honesty-first · never fabricated
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-[3.4rem] md:leading-[1.05]">
            Honest resumes,{" "}
            <span className="text-orange-600">for any role</span>.
          </h1>
          <p className="mt-5 text-pretty text-lg text-muted-foreground">
            Only your real experience, reorganized and sharpened. Job Copilot
            builds, tailors, and exports a polished resume, and{" "}
            <span className="text-foreground">never invents a thing</span>.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={onCreate}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              Create your resume, free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onSignIn}>
              I already have an account
            </Button>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
            {principles.map((p) => (
              <span
                key={p}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
              >
                <Check className="h-4 w-4 text-orange-500" />
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Animated resume mock */}
        <div className="relative mx-auto w-full max-w-md md:mr-0">
          <div className="pointer-events-none absolute inset-x-6 bottom-2 h-40 rounded-[50%] bg-orange-400/25 blur-3xl" />
          <div
            className={`relative rounded-xl border border-neutral-200 bg-white p-7 text-left shadow-2xl shadow-black/10 sm:p-8 ${reveal()}`}
            style={{ ...delay(0), fontFamily: 'Georgia, "Times New Roman", serif' }}
            aria-hidden="true"
          >
            <div className="border-b border-neutral-300 pb-3 text-center">
              <div className="text-xl font-bold tracking-tight text-neutral-900">
                Alex Morgan
              </div>
              <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Machine Learning Engineer
              </div>
              <div className="mt-1.5 text-[11px] text-neutral-600">
                alex@example.com · Berlin · github.com/alexm
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                Experience
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-[13px] font-bold text-neutral-900">
                  ML Engineer{" "}
                  <span className="font-semibold text-neutral-600">· Nimbus AI</span>
                </div>
                <div className="text-[10px] text-neutral-500">2022 – Present</div>
              </div>
              <ul className="mt-1.5 space-y-1.5 text-[11.5px] leading-relaxed text-neutral-700">
                <li className={reveal()} style={delay(1)}>
                  Led migration of the recommendation pipeline to a two-stage
                  retrieval and ranking design
                </li>
                <li className={reveal()} style={delay(2)}>
                  Cut model inference latency by{" "}
                  <span className="rounded border border-dashed border-orange-400 bg-orange-50 px-1 font-semibold text-orange-700">
                    [add metric]
                  </span>
                </li>
                <li className={reveal()} style={delay(3)}>
                  Shipped an LLM-powered search feature used across the app
                </li>
              </ul>
            </div>

            <div className="mt-3.5">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                Skills
              </div>
              <p className="text-[11.5px] leading-relaxed text-neutral-700">
                Python, PyTorch, Transformers, RAG, SQL, Docker, AWS
              </p>
            </div>
          </div>

          {/* Floating match card */}
          <div
            className={`absolute -bottom-6 -right-3 w-52 rounded-xl border border-border/70 bg-card p-4 shadow-xl sm:-right-6 ${reveal()}`}
            style={delay(4)}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Match to role
              </span>
              <span className="text-2xl font-bold tracking-tight text-orange-600 tabular-nums">
                {pct}
                <span className="text-sm text-muted-foreground">%</span>
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-[width] duration-100 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
              Based on skills actually in your profile
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <Card key={f.title}>
            <CardContent className="pt-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Honesty callout */}
      <section className="container max-w-3xl py-8">
        <Card className="border-primary/20 bg-gradient-to-b from-primary/[0.06] to-transparent">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">The honesty guarantee</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Job Copilot never invents experience, skills, employers, dates, or
                metrics. It only reorganizes and emphasizes what you entered. When a
                job needs something you don&apos;t have, it shows a separate{" "}
                <span className="text-foreground">&ldquo;gaps to address&rdquo;</span>{" "}
                note instead of quietly adding it.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Final CTA */}
      <section className="container flex flex-col items-center gap-5 py-14 text-center">
        <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
          Build a resume you can actually stand behind.
        </h2>
        <Button
          size="lg"
          onClick={onCreate}
          className="bg-orange-500 text-white hover:bg-orange-600"
        >
          Create your account, free <ArrowRight className="h-4 w-4" />
        </Button>
      </section>

      <footer className="border-t border-border/60 py-6">
        <div className="container text-center text-xs text-muted-foreground">
          Job Copilot · Honesty-first: your real experience, never fabricated.
        </div>
      </footer>
    </div>
  );
}
