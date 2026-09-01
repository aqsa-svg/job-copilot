"use client";

import { useState } from "react";
import { Download, FileText, Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Resume, ResumeTemplate } from "@/lib/types";
import { resumeToMarkdown, downloadText, slugify } from "@/lib/resume-markdown";

export function ResumeExport({
  resume,
  scale = 1,
  template = "classic",
}: {
  resume: Resume;
  scale?: number;
  template?: ResumeTemplate;
}) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPdf = async () => {
    setPdfLoading(true);
    const toastId = toast.loading("Rendering PDF…");
    try {
      // Load the (heavy) PDF renderer only when the user actually exports.
      const [{ pdf }, mod] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./resume-pdf"),
      ]);
      const Doc = mod.ResumePdfDocument;
      const blob = await pdf(<Doc resume={resume} scale={scale} template={template} />).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slugify(resume.name)}-resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded", { id: toastId });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to export PDF", {
        id: toastId,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadMd = () => {
    downloadText(`${slugify(resume.name)}-resume.md`, resumeToMarkdown(resume));
    toast.success("Markdown downloaded");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={downloadPdf} disabled={pdfLoading}>
        {pdfLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Download PDF
      </Button>
      <Button variant="outline" onClick={downloadMd}>
        <FileText className="h-4 w-4" /> Markdown
      </Button>
      <Button variant="ghost" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> Print
      </Button>
    </div>
  );
}
