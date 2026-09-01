"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Sparkles,
  HelpCircle,
  MessageSquare,
  User,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getToken, clearToken } from "@/lib/api";

const links = [
  { href: "/", label: "Home", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/apply", label: "Apply", icon: MessageSquare },
  { href: "/questions", label: "Questions", icon: HelpCircle },
];

export function SiteNav() {
  const pathname = usePathname();
  // Client-only: show the signed-in account + sign-out when a token is stored.
  const [email, setEmail] = useState("");
  useEffect(() => {
    if (getToken()) {
      setEmail(window.localStorage.getItem("jobcopilot:email") || "");
    }
  }, []);

  function signOut() {
    clearToken();
    window.localStorage.removeItem("jobcopilot:email");
    window.location.reload();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg no-print">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-base">
            Job<span className="text-orange-600">Copilot</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          {email ? (
            <button
              type="button"
              onClick={signOut}
              title={`Sign out (${email})`}
              aria-label="Sign out"
              className="ml-1 flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
