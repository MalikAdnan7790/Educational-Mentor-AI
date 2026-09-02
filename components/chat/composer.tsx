"use client";

import { useState, useRef, useEffect } from "react";
import { ImageUpload } from "./image-upload";
import { PdfUpload } from "./pdf-upload";
import { FileUpload } from "./file-upload";

interface ComposerProps {
  onSend: (content: string, imageBase64?: string) => void;
  disabled?: boolean;
  isAiFree?: boolean;
}

interface DocAttachment {
  text: string;
  sourceType: string;
  filename: string;
}

export function Composer({ onSend, disabled, isAiFree }: ComposerProps) {
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<DocAttachment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [text]);

  function handleSend() {
    let content = text;
    if (docFile) {
      content = `[From ${docFile.sourceType} file: ${docFile.filename}]\n${docFile.text}\n\nMy question: ${text}`;
    } else if (pdfText) {
      content = `[From PDF] ${pdfText}\n\nMy question: ${text}`;
    }
    if (!content.trim() && !imageBase64) return;
    onSend(content.trim(), imageBase64 ?? undefined);
    setText("");
    setImageBase64(null);
    setPdfText(null);
    setDocFile(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const canSend = !disabled && (text.trim().length > 0 || !!imageBase64);

  return (
    <div className="border-t border-ink-100 bg-white px-4 py-3">
      {/* Attachment previews */}
      {(imageBase64 || pdfText || docFile) && (
        <div className="mb-2 flex gap-2 flex-wrap">
          {imageBase64 && (
            <div className="relative group">
              <img
                src={imageBase64}
                alt="Attached"
                className="h-16 w-16 rounded-lg object-cover border border-ink-200"
              />
              <button
                type="button"
                onClick={() => setImageBase64(null)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-ink-900 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          )}
          {pdfText && (
            <div className="relative group flex items-center gap-1.5 rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1.5 text-xs text-ink-600 max-w-[200px]">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="truncate">{pdfText.slice(0, 60)}…</span>
              <button
                type="button"
                onClick={() => setPdfText(null)}
                className="ml-1 shrink-0 text-ink-400 hover:text-ink-600"
              >
                ×
              </button>
            </div>
          )}
          {docFile && (
            <div className="relative group flex items-center gap-1.5 rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1.5 text-xs text-ink-600 max-w-[220px]">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">{docFile.filename}</span>
              <button
                type="button"
                onClick={() => setDocFile(null)}
                className="ml-1 shrink-0 text-ink-400 hover:text-ink-600"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment buttons */}
        <div className="flex gap-1 pb-1">
          <ImageUpload onImage={setImageBase64} disabled={disabled || isAiFree} />
          <PdfUpload onText={setPdfText} disabled={disabled || isAiFree} />
          <FileUpload onText={(t, sourceType, filename) => setDocFile({ text: t, sourceType, filename })} disabled={disabled || isAiFree} />
        </div>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isAiFree ? "AI-Free mode — try working it out first!" : "Ask anything…"}
          disabled={disabled}
          rows={1}
          className="input min-h-[44px] max-h-[160px] resize-none py-2.5 text-sm"
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="btn-primary shrink-0 px-3 py-2.5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
