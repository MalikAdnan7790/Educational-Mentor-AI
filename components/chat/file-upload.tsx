"use client";

import { useRef, useState } from "react";

interface FileUploadProps {
  onText: (text: string, sourceType: string, filename: string) => void;
  disabled?: boolean;
}

const ACCEPT = ".docx,.txt,.md,.markdown";
const MAX_BYTES = 10 * 1024 * 1024;

export function FileUpload({ onText, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["docx", "txt", "md", "markdown"].includes(ext)) {
      setError("Please select a DOCX, TXT, or MD file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is too large (max 10 MB).");
      return;
    }

    setProcessing(true);
    try {
      const fileBase64 = await readAsBase64(file);
      const resp = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, fileBase64 }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(friendlyError(data.error));
        return;
      }
      onText(data.text, data.sourceType, file.name);
    } catch {
      setError("Failed to read the file.");
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
        accept={ACCEPT}
        className="hidden"
        onChange={handleChange}
        disabled={disabled || processing}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || processing}
        className="btn-ghost px-3 py-1.5 text-xs gap-1.5"
        title="Attach a DOCX, TXT, or Markdown file"
      >
        {processing ? (
          <span className="animate-pulse">Reading…</span>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            DOC
          </>
        )}
      </button>
      {error && <span className="text-xs text-coral-500 max-w-[200px]">{error}</span>}
    </div>
  );
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

function friendlyError(code: string): string {
  switch (code) {
    case "unsupported_type":
      return "Unsupported file type.";
    case "file_too_large":
      return "File is too large (max 10 MB).";
    case "empty_file":
      return "The file is empty.";
    case "no_text_extracted":
      return "No readable text found in this file.";
    case "extraction_failed":
      return "Could not read this file — it may be corrupted.";
    default:
      return "Failed to read the file.";
  }
}
