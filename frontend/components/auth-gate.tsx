"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Sparkles, Loader2, X } from "lucide-react";

import {
  api,
  UnauthorizedError,
  getToken,
  setToken,
  clearToken,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landing } from "@/components/landing";
import { cn } from "@/lib/utils";

type Status = "checking" | "authed" | "guest";
type Mode = "login" | "register";

const EMAIL_KEY = "jobcopilot:email";

/**
 * Gates the app behind an account. Guests see the public landing page with a
 * sign-in / create-account modal; signed-in users see the app.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // On mount: validate any stored token.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) {
        if (!cancelled) setStatus("guest");
        return;
      }
      try {
        await api.me();
        if (!cancelled) setStatus("authed");
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          clearToken();
          if (!cancelled) setStatus("guest");
        } else if (!cancelled) {
          setStatus("authed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close the modal on Escape.
  useEffect(() => {
    if (!authOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authOpen]);

  function openAuth(next: Mode) {
    setMode(next);
    setError("");
    setAuthOpen(true);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const mail = email.trim();
    if (!mail || !password || submitting) return;
    if (mode === "register" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res =
        mode === "register"
          ? await api.register(mail, password)
          : await api.login(mail, password);
      setToken(res.access_token);
      window.localStorage.setItem(EMAIL_KEY, res.user.email);
      setStatus("authed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "guest") {
    return (
      <>
        <Landing
          onCreate={() => openAuth("register")}
          onSignIn={() => openAuth("login")}
        />
        {authOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setAuthOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-sm space-y-6 rounded-2xl border border-border/70 bg-card p-8 shadow-2xl"
            >
              <button
                type="button"
                aria-label="Close"
                onClick={() => setAuthOpen(false)}
                className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center gap-3 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight">
                    Job<span className="text-orange-600">Copilot</span>
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mode === "login"
                      ? "Welcome back. Sign in to continue."
                      : "Create an account to build your resume."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1 text-sm font-medium">
                {(["register", "login"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={cn(
                      "rounded-md py-1.5 transition-colors",
                      mode === m
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m === "login" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                    placeholder={
                      mode === "register"
                        ? "At least 8 characters"
                        : "Your password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={submitting || !email.trim() || !password}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === "login" ? "Signing in…" : "Creating account…"}
                    </>
                  ) : mode === "login" ? (
                    "Sign in"
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return <>{children}</>;
}
