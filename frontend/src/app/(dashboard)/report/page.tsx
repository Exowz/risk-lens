"use client";

/**
 * Scrollytelling rapport Mistral.
 *
 * TracingBeam on left, sections fade in with whileInView,
 * BlurText on section titles, numbers highlighted in font-mono,
 * MultiStepLoader during generation.
 *
 * Depends on: lib/api/report.ts, lib/api/portfolios.ts, lib/store/portfolio-store.ts,
 *             ui/tracing-beam, ui/multi-step-loader, ui/blur-text
 * Used by: /report route
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

import { BlurText } from "@/components/ui/blur-text";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { usePortfolios } from "@/lib/api/portfolios";
import { useGenerateReport } from "@/lib/api/report";
import { usePortfolioStore } from "@/lib/store/portfolio-store";

// ── Loading steps ──

const LOADING_STEPS = [
  { text: "Collecte des données de marché..." },
  { text: "Analyse des risques en cours..." },
  { text: "Calcul des métriques de performance..." },
  { text: "Génération du rapport par IA..." },
  { text: "Finalisation..." },
];

// ── Highlight numbers in Mistral text ──

function highlightNumbers(text: string): React.ReactNode[] {
  const regex = /(-?\d+\.?\d*%|-?\d+\.?\d*)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (regex.test(part)) {
      // Reset lastIndex since we reuse regex
      regex.lastIndex = 0;
      return (
        <span key={i} className="font-mono text-foreground font-medium">
          {part}
        </span>
      );
    }
    regex.lastIndex = 0;
    return <span key={i}>{part}</span>;
  });
}

// ── Parse markdown into sections ──

interface ReportSection {
  title: string;
  content: string[];
}

function parseReportSections(markdown: string): ReportSection[] {
  const lines = markdown.split("\n");
  const sections: ReportSection[] = [];
  let currentSection: ReportSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    // Match ## or ### headers as section titles
    const headerMatch = /^#{1,3}\s+(.+)/.exec(trimmed);
    if (headerMatch) {
      if (currentSection && currentSection.content.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: headerMatch[1].replace(/\*+/g, ""), content: [] };
    } else if (trimmed && currentSection) {
      currentSection.content.push(trimmed);
    } else if (trimmed && !currentSection) {
      // Content before first header
      if (!sections.length) {
        currentSection = { title: "", content: [trimmed] };
      }
    }
  }
  if (currentSection && (currentSection.content.length > 0 || currentSection.title)) {
    sections.push(currentSection);
  }
  return sections;
}

// ── Render a content line (strips markdown bold/italic) ──

function renderLine(line: string): React.ReactNode {
  const plain = line
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1");

  // Bullet point
  if (/^[-*+]\s/.test(plain)) {
    const text = plain.replace(/^[-*+]\s+/, "");
    return (
      <li className="text-sm text-muted-foreground leading-relaxed ml-4 list-disc">
        {highlightNumbers(text)}
      </li>
    );
  }

  return (
    <p className="text-sm text-muted-foreground leading-relaxed">
      {highlightNumbers(plain)}
    </p>
  );
}

// ── PDF rendering (kept from original) ──

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
    pdf, y: 20, pageWidth: 210, marginLeft: 15, marginRight: 15,
    pageHeight: 297, bottomMargin: 20,
  };
  pdf.setTextColor(60, 60, 60);
  writeLine(w, "RiskLens — Rapport de Risque", 16, "bold", 2);
  w.y += 2;
  writeLine(w, `Portefeuille : ${portfolioName}`, 10, "normal", 1);
  writeLine(w, `Généré le : ${generatedAt}`, 10, "normal", 1);
  w.y += 4;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(w.marginLeft, w.y, w.pageWidth - w.marginRight, w.y);
  w.y += 8;
  pdf.setTextColor(30, 30, 30);
  const rawLines = markdown.split("\n");
  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (trimmed === "") { w.y += 3; continue; }
    if (/^-{3,}$|^\*{3,}$|^_{3,}$/.test(trimmed)) {
      w.y += 2; ensureSpace(w, 6);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(w.marginLeft, w.y, w.pageWidth - w.marginRight, w.y);
      w.y += 6; continue;
    }
    if (trimmed.startsWith("##### ")) { w.y += 3; writeLine(w, trimmed.slice(6).replace(/\*+/g, ""), 10, "bold", 1.5); continue; }
    if (trimmed.startsWith("#### ")) { w.y += 3; writeLine(w, trimmed.slice(5).replace(/\*+/g, ""), 10, "bold", 1.5); continue; }
    if (trimmed.startsWith("### ")) { w.y += 4; writeLine(w, trimmed.slice(4).replace(/\*+/g, ""), 11, "bold", 1.5); continue; }
    if (trimmed.startsWith("## ")) { w.y += 5; writeLine(w, trimmed.slice(3).replace(/\*+/g, ""), 13, "bold", 2); continue; }
    if (trimmed.startsWith("# ")) { w.y += 6; writeLine(w, trimmed.slice(2).replace(/\*+/g, ""), 14, "bold", 2); continue; }
    if (/^[-*+]\s/.test(trimmed)) { writeLine(w, `  •  ${trimmed.replace(/^[-*+]\s+/, "").replace(/\*+/g, "")}`, 9.5, "normal", 1.2); continue; }
    const nm = /^(\d+)[.)]\s+(.*)/.exec(trimmed);
    if (nm) { writeLine(w, `  ${nm[1]}. ${nm[2].replace(/\*+/g, "")}`, 9.5, "normal", 1.2); continue; }
    if (/^\*\*.+\*\*$/.test(trimmed)) { w.y += 3; writeLine(w, trimmed.replace(/\*+/g, ""), 10, "bold", 1.5); continue; }
    const plain = trimmed.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/__(.+?)__/g, "$1").replace(/_(.+?)_/g, "$1").replace(/`(.+?)`/g, "$1");
    writeLine(w, plain, 9.5, "normal", 1.2);
  }
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8); pdf.setFont("helvetica", "normal"); pdf.setTextColor(150, 150, 150);
    pdf.text(`RiskLens — Page ${i}/${totalPages}`, w.pageWidth / 2, w.pageHeight - 10, { align: "center" });
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

  useEffect(() => {
    if (activePortfolioId) reset();
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
        dateStyle: "long", timeStyle: "short",
      });
      renderMarkdownToPdf(pdf, data.content, activePortfolioName, generatedAt);
      const date = new Date().toISOString().slice(0, 10);
      const safeName = activePortfolioName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      pdf.save(`risklens-report-${safeName}-${date}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }, [data, activePortfolioName]);

  // Parse sections for scrollytelling
  const sections = data?.content ? parseReportSections(data.content) : [];

  if (!activePortfolioId) {
    return (
      <div className="p-6">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Aucun portefeuille sélectionné</CardTitle>
            <CardDescription>
              Créez ou sélectionnez un portefeuille pour générer un rapport
              d&apos;analyse de risque avec export PDF.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/portfolio">
              <Button>Voir les portefeuilles</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? "Génération..." : "Générer le rapport"}
        </Button>
        {data && (
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isExporting}
          >
            {isExporting ? "Export..." : "Télécharger PDF"}
          </Button>
        )}
      </div>

      {/* Error */}
      {generateError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {generateError instanceof Error
                ? generateError.message
                : typeof generateError === "object" &&
                    generateError !== null &&
                    "detail" in generateError
                  ? String((generateError as { detail: string }).detail)
                  : "Report generation failed"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Multi Step Loader */}
      <MultiStepLoader
        loadingStates={LOADING_STEPS}
        loading={isGenerating}
        duration={2000}
      />

      {/* Scrollytelling report */}
      {data && !isGenerating && (
        <TracingBeam className="px-2">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-8"
          >
            <BlurText
              text="Rapport de Risque"
              className="text-xl font-semibold tracking-tight text-foreground"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Généré le{" "}
              {new Date(data.generated_at).toLocaleString("fr-FR", {
                dateStyle: "long",
                timeStyle: "short",
              })}
              {data.from_cache && " (cache)"}
            </p>
          </motion.div>

          {/* Sections */}
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mb-10"
            >
              {section.title && (
                <BlurText
                  text={section.title}
                  className="text-base font-medium text-foreground mb-3"
                />
              )}
              <div className="space-y-2">
                {section.content.map((line, lineIdx) => (
                  <div key={lineIdx}>{renderLine(line)}</div>
                ))}
              </div>
            </motion.div>
          ))}
        </TracingBeam>
      )}
    </div>
  );
}
