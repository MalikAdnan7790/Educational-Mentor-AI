"use client";

import { useRef, useState } from "react";

const MAX_PDF_PAGES = 40;

export interface UploadedNote {
  text: string;
  sourceType: "PDF" | "DOCX" | "TXT" | "MD";
  filename: string;
}

interface NoteUploadProps {
  onLoaded: (note: UploadedNote) => void;
  disabled?: boolean;
}

export function NoteUpload({ onLoaded, disabled }: NoteUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    setProcessing(true);
    try {
      if (ext === "pdf" || file.type === "application/pdf") {
        const text = await extractPdfText(file);
        if (!text.trim() || text.trim().length < 100) {
          setError("This PDF appears to be scanned (image-based) or too short. Please upload a text-based PDF, or paste the text instead.");
          return;
        }
        onLoaded({ text, sourceType: "PDF", filename: file.name });
      } else if (["docx", "txt", "md", "markdown"].includes(ext)) {
        const fileBase64 = await fileToBase64(file);
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, fileBase64 }),
        });
        
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          if (res.status === 413) {
            setError("File is too large. Please try a smaller file (max 3 MB).");
          } else if (res.status === 401) {
            setError("Please log in again to continue.");
          } else {
            setError(`Upload failed (error ${res.status}). Please try again.`);
          }
          return;
        }
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(EXTRACT_ERRORS[data.error] ?? "Failed to read this file.");
          return;
        }
        const data = await res.json();
        onLoaded({ text: data.text, sourceType: data.sourceType, filename: file.name });
      } else {
        setError("Supported formats: PDF, DOCX, TXT, MD.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read this file.");
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,.markdown"
        className="hidden"
        onChange={handleChange}
        disabled={disabled || processing}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || processing}
        className="btn-ghost"
      >
        {processing ? "Reading…" : "Choose file"}
      </button>
      {error && <span className="text-xs text-coral-500">{error}</span>}
    </div>
  );
}

const EXTRACT_ERRORS: Record<string, string> = {
  file_too_large: "File is too large (max 3 MB).",
  unsupported_type: "Supported formats: PDF, DOCX, TXT, MD.",
  no_text_extracted: "No readable text found in this file.",
  extraction_failed: "Could not extract text from this file.",
};

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const numPages = Math.min(pdf.numPages, MAX_PDF_PAGES);
  const pages: string[] = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .filter((item: any) => "str" in item)
        .map((item: any) => item.str)
        .join(" "),
    );
  }
  return pages.join("\n\n");
}
