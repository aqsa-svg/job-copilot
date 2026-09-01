"use client";

import { useMemo } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

import { atsReport, type AtsStatus } from "@/lib/ats";
import type { Resume } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function tone(score: number) {
  if (score >= 80) return { text: "text-emerald-600", bar: "bg-emerald-500" };
  if (score >= 60)
    return { text: "text-primary", bar: "bg-primary" };
  return { text: "text-amber-600", bar: "bg-amber-500" };
}

function StatusIcon({ status }: { status: AtsStatus }) {
  if (status === "pass") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "warn") return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
}

export function AtsReportCard({ resume, jd }: { resume: Resume; jd?: string }) {
  const report = useMemo(() => atsReport(resume, jd), [resume, jd]);
  const t = tone(report.score);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" /> ATS score
        </CardTitle>
        <CardDescription>How cleanly this parses and reads in applicant tracking systems.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <p className={"text-4xl font-bold tabular-nums " + t.text}>
            {report.score}
            <span className="text-lg text-muted-foreground">/100</span>
          </p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={"h-full rounded-full transition-all duration-700 " + t.bar}
            style={{ width: `${report.score}%` }}
          />
        </div>

        <p className="mt-4 mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Scored on
        </p>
        <ul className="space-y-2.5">
          {report.checks.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-0.5 shrink-0">
                <StatusIcon status={c.status} />
              </span>
              <div>
                <p className="text-sm font-medium leading-snug">{c.label}</p>
                <p className="text-xs leading-snug text-muted-foreground">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-muted-foreground/70">
          Computed by transparent rules on this page - nothing leaves your machine.
          Fix flagged items (honestly) to raise the score.
        </p>
      </CardContent>
    </Card>
  );
}
