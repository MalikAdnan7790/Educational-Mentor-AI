"use client";

import { useRef, useState } from "react";
import { FileUp } from "lucide-react";

const MAX_PAGES = 15;

interface PdfUploadProps {
  onText: (text: string) => void;
  disabled?: boolean;
}

export function PdfUpload({ onText, disabled }: PdfUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }

    setProcessing(true);
    try {
      const text = await extractPdfText(file);
      if (!text.trim()) {
        setError("This PDF appears to be scanned (image-based). Please type the question instead.");
        return;
      }
      onText(text);
    } catch (err: any) {
      setError(err.message || "Failed to read PDF.");
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleChange}
        disabled={disabled || processing}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || processing}
        className="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 hover:border-amber-400 hover:bg-amber-100 transition-colors disabled:opacity-50"
        title="Attach a PDF"
      >
        {processing ? (
          <span className="animate-pulse">Reading...</span>
        ) : (
          <>
            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-200">
              <FileUp className="h-3 w-3 text-amber-600" />
            </span>
            PDF
          </>
        )}
      </button>
      {error && <span className="text-xs text-coral-500 max-w-[200px]">{error}</span>}
    </div>
  );
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const numPages = Math.min(pdf.numPages, MAX_PAGES);
  const pages: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item: any) => "str" in item)
      .map((item: any) => item.str)
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n");
}
