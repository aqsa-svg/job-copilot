import { describe, it, expect } from "vitest";
import { atsReport } from "./ats";
import type { Resume } from "./types";

const strong = (over: Partial<Resume> = {}): Resume => ({
  name: "Jane Doe",
  title: "ML Engineer",
  contact: { email: "j@x.com", phone: "123", location: "Delhi", links: [{ label: "GitHub", url: "u" }] },
  summary: "Machine learning engineer with production experience.",
  skills: [{ category: "ML", items: ["PyTorch", "RAG", "SQL", "Docker", "AWS", "Go"] }],
  experience: [
    {
      company: "Acme",
      role: "MLE",
      location: "Remote",
      start: "2021",
      end: "Present",
      bullets: ["Built a system that increased revenue by 20%", "Led a team of 4 engineers"],
    },
  ],
  projects: [],
  education: [{ school: "IIT", degree: "B.Tech", field: "CS", start: "2016", end: "2020", details: "" }],
  ...over,
});

const empty: Resume = {
  name: "",
  title: "",
  contact: { email: "", phone: "", location: "", links: [] },
  summary: "",
  skills: [],
  experience: [],
  projects: [],
  education: [],
};

describe("atsReport", () => {
  it("returns a bounded score and a real checklist", () => {
    const r = atsReport(strong());
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.checks.length).toBeGreaterThan(5);
  });

  it("scores a strong resume high", () => {
    expect(atsReport(strong()).score).toBeGreaterThan(75);
  });

  it("scores a weak resume much lower than a strong one", () => {
    expect(atsReport(empty).score).toBeLessThan(atsReport(strong()).score);
  });

  it("flags unfilled [add metric] placeholders", () => {
    const r = atsReport(
      strong({
        experience: [
          { company: "C", role: "R", location: "", start: "", end: "", bullets: ["Did a thing [add metric]"] },
        ],
      })
    );
    const ph = r.checks.find((c) => c.label.toLowerCase().includes("placeholder"))!;
    expect(ph.status).not.toBe("pass");
  });

  it("rewards action-verb bullets", () => {
    const check = atsReport(strong()).checks.find((c) => c.label.includes("Action-verb"))!;
    expect(check.status).toBe("pass");
  });

  it("adds a JD keyword check only when a job description is provided", () => {
    const withJd = atsReport(strong(), "We need PyTorch, Kubernetes and Docker experience");
    const noJd = atsReport(strong());
    expect(withJd.checks.some((c) => c.label.toLowerCase().includes("keyword"))).toBe(true);
    expect(noJd.checks.some((c) => c.label.toLowerCase().includes("keyword"))).toBe(false);
  });
});
