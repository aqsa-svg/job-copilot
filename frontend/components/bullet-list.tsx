"use client";

import { useState } from "react";
import { Plus, Sparkles, Trash2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import type { ImproveBulletResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Props {
  bullets: string[];
  onChange: (bullets: string[]) => void;
  role?: string;
  context?: string;
  placeholder?: string;
}

export function BulletList({
  bullets,
  onChange,
  role = "",
  context = "",
  placeholder = "Describe what you did…",
}: Props) {
  const [improving, setImproving] = useState<number | null>(null);
  const [result, setResult] = useState<ImproveBulletResult | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);

  const update = (i: number, value: string) => {
    const next = [...bullets];
    next[i] = value;
    onChange(next);
  };
  const add = () => onChange([...bullets, ""]);
  const remove = (i: number) => onChange(bullets.filter((_, idx) => idx !== i));

  const improve = async (i: number) => {
    const text = bullets[i]?.trim();
    if (!text) {
      toast.error("Write something first, then improve it.");
      return;
    }
    setImproving(i);
    try {
      const res = await api.improveBullet(text, role, context);
      setResult(res);
      setTargetIndex(i);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to improve bullet");
    } finally {
      setImproving(null);
    }
  };

  const apply = (text: string) => {
    if (targetIndex !== null) update(targetIndex, text);
    setResult(null);
    setTargetIndex(null);
    toast.success("Bullet updated");
  };

  return (
    <div className="space-y-2">
      {bullets.length === 0 && (
        <p className="text-xs text-muted-foreground">No bullet points yet.</p>
      )}
      {bullets.map((b, i) => (
        <div key={i} className="flex items-start gap-2">
          <Textarea
            value={b}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            className="min-h-[60px] flex-1"
          />
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title="Improve with AI"
              onClick={() => improve(i)}
              disabled={improving !== null}
            >
              {improving === i ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title="Remove bullet"
              onClick={() => remove(i)}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4" /> Add bullet
      </Button>

      <Dialog
        open={result !== null}
        onOpenChange={(o) => {
          if (!o) {
            setResult(null);
            setTargetIndex(null);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Improved bullet
            </DialogTitle>
            <DialogDescription>
              Pick a rewrite. Numbers are never invented - fill any{" "}
              <code className="rounded bg-secondary px-1 py-0.5 text-xs">
                [add metric]
              </code>{" "}
              placeholder with your real figure.
            </DialogDescription>
          </DialogHeader>

          {result && (
            <div className="space-y-3">
              <Suggestion
                label="Recommended"
                text={result.improved}
                onApply={apply}
                primary
              />
              {result.variants?.map((v, idx) => (
                <Suggestion
                  key={idx}
                  label={`Alternative ${idx + 1}`}
                  text={v}
                  onApply={apply}
                />
              ))}
              {result.note && (
                <p className="text-xs text-muted-foreground">💡 {result.note}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Suggestion({
  label,
  text,
  onApply,
  primary,
}: {
  label: string;
  text: string;
  onApply: (t: string) => void;
  primary?: boolean;
}) {
  if (!text) return null;
  return (
    <div
      className={
        "rounded-lg border p-3 " +
        (primary ? "border-primary/40 bg-primary/[0.04]" : "border-border")
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge variant={primary ? "default" : "secondary"}>{label}</Badge>
        <Button size="sm" variant={primary ? "default" : "outline"} onClick={() => onApply(text)}>
          <Check className="h-4 w-4" /> Use this
        </Button>
      </div>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}
