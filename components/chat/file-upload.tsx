"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

interface FileUploadProps {
  onText: (text: string, sourceType: string, filename: string) => void;
  disabled?: boolean;
}

const ACCEPT = ".docx,.txt,.md,.markdown";
const MAX_BYTES = 3 * 1024 * 1024;

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
      setError("File is too large (max 3 MB).");
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
      
      const contentType = resp.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        if (resp.status === 413) {
          setError("File is too large. Please try a smaller file (max 3 MB).");
        } else if (resp.status === 401) {
          setError("Please log in again to continue.");
        } else {
          setError(`Upload failed (error ${resp.status}). Please try again.`);
        }
        return;
      }
      
      const data = await resp.json();
      if (!resp.ok) {
        setError(friendlyError(data.error));
        return;
      }
      onText(data.text, data.sourceType, file.name);
    } catch {
      setError("Failed to read the file. Please check your connection and try again.");
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
        className="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-600 hover:border-purple-400 hover:bg-purple-100 transition-colors disabled:opacity-50"
        title="Attach a DOCX, TXT, or Markdown file"
      >
        {processing ? (
          <span className="animate-pulse">Reading...</span>
        ) : (
          <>
            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-purple-200">
              <Upload className="h-3 w-3 text-purple-600" />
            </span>
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
      return "File is too large (max 3 MB).";
    case "empty_file":
      return "The file is empty.";
    case "no_text_extracted":
      return "No readable text found in this file.";
    case "extraction_failed":
      return "Could not read this file \u2014 it may be corrupted.";
    default:
      return "Failed to read the file.";
  }
}
