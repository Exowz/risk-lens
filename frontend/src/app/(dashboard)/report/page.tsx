"use client";

/**
 * Narrative report page.
 *
 * Generate a Mistral AI risk report and download as PDF (client-side).
 * PDF export uses jspdf text rendering — no DOM capture, no canvas.
 *
 * Depends on: lib/api/report.ts, lib/api/portfolios.ts, lib/store/portfolio-store.ts
 * Used by: /report route
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { BlurText } from "@/components/ui/blur-text";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolios } from "@/lib/api/portfolios";
import { useGenerateReport } from "@/lib/api/report";
import { useMode } from "@/lib/store/mode-context";
import { usePortfolioStore } from "@/lib/store/portfolio-store";

// ── PDF text renderer ──

interface PdfWriter {
  pdf: InstanceType<typeof import("jspdf").jsPDF>;
  y: number;
  pageWidth: number;
  marginLeft: number;
  marginRight: number;
  pageHeight: number;
  bottomMargin: number;
}

function ensureSpace(w: PdfWriter, needed: number): void {
  if (w.y + needed > w.pageHeight - w.bottomMargin) {
    w.pdf.addPage();
    w.y = 20;
  }
}

function writeLine(
  w: PdfWriter,
  text: string,
  fontSize: number,
  style: "normal" | "bold",
  spacing: number,
): void {
  w.pdf.setFontSize(fontSize);
  w.pdf.setFont("helvetica", style);

  const maxWidth = w.pageWidth - w.marginLeft - w.marginRight;
  const lines = w.pdf.splitTextToSize(text, maxWidth) as string[];

  for (const line of lines) {
    ensureSpace(w, fontSize * 0.4 + spacing);
    w.pdf.text(line, w.marginLeft, w.y);
    w.y += fontSize * 0.4 + spacing;
  }
}

function renderMarkdownToPdf(
  pdf: InstanceType<typeof import("jspdf").jsPDF>,
  markdown: string,
  portfolioName: string,
  generatedAt: string,
): void {
  const w: PdfWriter = {
    pdf,
    y: 20,
    pageWidth: 210,
    marginLeft: 15,
    marginRight: 15,
    pageHeight: 297,
    bottomMargin: 20,
  };

  // Header
  pdf.setTextColor(60, 60, 60);
  writeLine(w, "RiskLens — Rapport de Risque", 16, "bold", 2);
  w.y += 2;
  writeLine(w, `Portefeuille : ${portfolioName}`, 10, "normal", 1);
  writeLine(w, `Généré le : ${generatedAt}`, 10, "normal", 1);

  // Separator
  w.y += 4;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(w.marginLeft, w.y, w.pageWidth - w.marginRight, w.y);
  w.y += 8;

  // Body
  pdf.setTextColor(30, 30, 30);
  const rawLines = markdown.split("\n");

  for (const raw of rawLines) {
    const trimmed = raw.trim();

    // Skip empty lines — add small spacing
    if (trimmed === "") {
      w.y += 3;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$|^\*{3,}$|^_{3,}$/.test(trimmed)) {
      w.y += 2;
      ensureSpace(w, 6);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(w.marginLeft, w.y, w.pageWidth - w.marginRight, w.y);
      w.y += 6;
      continue;
    }

    // Headers
    if (trimmed.startsWith("##### ")) {
      w.y += 3;
      writeLine(w, trimmed.slice(6).replace(/\*+/g, ""), 10, "bold", 1.5);
      continue;
    }
    if (trimmed.startsWith("#### ")) {
      w.y += 3;
      writeLine(w, trimmed.slice(5).replace(/\*+/g, ""), 10, "bold", 1.5);
      continue;
    }
    if (trimmed.startsWith("### ")) {
      w.y += 4;
      writeLine(w, trimmed.slice(4).replace(/\*+/g, ""), 11, "bold", 1.5);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      w.y += 5;
      writeLine(w, trimmed.slice(3).replace(/\*+/g, ""), 13, "bold", 2);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      w.y += 6;
      writeLine(w, trimmed.slice(2).replace(/\*+/g, ""), 14, "bold", 2);
      continue;
    }

    // Bullet points
    if (/^[-*+]\s/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[-*+]\s+/, "").replace(/\*+/g, "");
      writeLine(w, `  •  ${bulletText}`, 9.5, "normal", 1.2);
      continue;
    }

    // Numbered list
    const numberedMatch = /^(\d+)[.)]\s+(.*)/.exec(trimmed);
    if (numberedMatch) {
      const text = numberedMatch[2].replace(/\*+/g, "");
      writeLine(w, `  ${numberedMatch[1]}. ${text}`, 9.5, "normal", 1.2);
      continue;
    }

    // Bold-only lines (e.g. **Section Title**)
    if (/^\*\*.+\*\*$/.test(trimmed)) {
      w.y += 3;
      writeLine(w, trimmed.replace(/\*+/g, ""), 10, "bold", 1.5);
      continue;
    }

    // Regular paragraph text — strip markdown inline formatting
    const plain = trimmed
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/_(.+?)_/g, "$1")
      .replace(/`(.+?)`/g, "$1");
    writeLine(w, plain, 9.5, "normal", 1.2);
  }

  // Footer on every page
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `RiskLens — Page ${i}/${totalPages}`,
      w.pageWidth / 2,
      w.pageHeight - 10,
      { align: "center" },
    );
  }
}

// ── Page component ──

export default function ReportPage() {
  const { activePortfolioId } = usePortfolioStore();
  const { data: portfolios } = usePortfolios();
  const {
    mutate: generate,
    data,
    isPending: isGenerating,
    error: generateError,
    reset,
  } = useGenerateReport();

  const [isExporting, setIsExporting] = useState(false);

  const activePortfolioName =
    portfolios?.find((p) => p.id === activePortfolioId)?.name ?? "portfolio";

  // Reset when portfolio changes
  useEffect(() => {
    if (activePortfolioId) {
      reset();
    }
  }, [activePortfolioId, reset]);

  const handleGenerate = () => {
    if (!activePortfolioId) return;
    generate({ portfolio_id: activePortfolioId });
  };

  const handleDownloadPDF = useCallback(async () => {
    if (!data?.content) return;

    setIsExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF("p", "mm", "a4");

      const generatedAt = new Date(data.generated_at).toLocaleString("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
      });

      renderMarkdownToPdf(pdf, data.content, activePortfolioName, generatedAt);

      const date = new Date().toISOString().slice(0, 10);
      const safeName = activePortfolioName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      pdf.save(`risklens-report-${safeName}-${date}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }, [data, activePortfolioName]);

  if (!activePortfolioId) {
    return (
      <div className="space-y-8">
        <div>
          <BlurText text="Risk Report" className="text-3xl font-bold tracking-tight" />
          <p className="text-muted-foreground">
            AI-generated narrative risk analysis with PDF export
          </p>
        </div>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No Portfolio Selected</CardTitle>
            <CardDescription>
              Create or select a portfolio to generate an AI-powered narrative
              risk report with PDF export.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/portfolio">
              <Button>Go to Portfolios</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <BlurText text="Risk Report" className="text-3xl font-bold tracking-tight" />
          <p className="text-muted-foreground">
            AI-generated narrative risk analysis with PDF export
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate Report"}
          </Button>
          {data && (
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Download PDF"}
            </Button>
          )}
        </div>
      </div>

      {generateError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {generateError instanceof Error
                ? generateError.message
                : typeof generateError === "object" &&
                    generateError !== null &&
                    "detail" in generateError
                  ? String(
                      (generateError as { detail: string }).detail,
                    )
                  : "Report generation failed"}
            </p>
          </CardContent>
        </Card>
      )}

      {isGenerating && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      )}

      {data && !isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle>Rapport de Risque</CardTitle>
            <CardDescription>
              Generated{" "}
              {new Date(data.generated_at).toLocaleString("fr-FR", {
                dateStyle: "long",
                timeStyle: "short",
              })}
              {data.from_cache && " (cached)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {data.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
