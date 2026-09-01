import { describe, it, expect } from "vitest";
import { estimateLines, fitScale } from "./fit";
import type { Resume } from "./types";

const base = (over: Partial<Resume> = {}): Resume => ({
  name: "A",
  title: "",
  contact: { email: "a@b.com", phone: "1", location: "X", links: [] },
  summary: "",
  skills: [],
  experience: [],
  projects: [],
  education: [],
  ...over,
});

const longExp = (count: number, bulletsEach: number) =>
  Array.from({ length: count }, () => ({
    company: "Company",
    role: "Senior Engineer",
    location: "Remote",
    start: "2020",
    end: "2024",
    bullets: Array.from({ length: bulletsEach }, () => "Delivered a big impactful project ".repeat(3)),
  }));

describe("fitScale", () => {
  it("returns 1 in multi-page mode regardless of size", () => {
    expect(fitScale(base({ experience: longExp(10, 6) }), "multi")).toBe(1);
  });

  it("returns 1 for a short one-page resume", () => {
    expect(fitScale(base({ summary: "short summary" }), "one")).toBe(1);
  });

  it("scales below 1 for a long one-page resume", () => {
    const s = fitScale(base({ experience: longExp(8, 5) }), "one");
    expect(s).toBeLessThan(1);
    expect(s).toBeGreaterThanOrEqual(0.62);
  });

  it("never drops below the 0.62 readability floor", () => {
    expect(fitScale(base({ experience: longExp(40, 8) }), "one")).toBe(0.62);
  });

  it("estimateLines grows with more content", () => {
    expect(estimateLines(base({ summary: "x".repeat(400) }))).toBeGreaterThan(
      estimateLines(base())
    );
  });
});
