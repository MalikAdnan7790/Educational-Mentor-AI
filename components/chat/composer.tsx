"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, FileText, FileImage, File } from "lucide-react";
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
    <div className="border-t-2 border-ink-100 bg-white px-4 py-3">
      {/* Attachment previews */}
      {(imageBase64 || pdfText || docFile) && (
        <div className="mb-2 flex gap-2 flex-wrap">
          {imageBase64 && (
            <div className="relative group">
              <img
                src={imageBase64}
                alt="Attached question"
                className="h-20 w-20 rounded-xl object-cover border-2 border-ink-200"
              />
              <span className="absolute top-1 left-1 rounded-lg bg-mint-400 px-1.5 py-0.5 text-[9px] font-bold text-white">
                Question
              </span>
              <button
                type="button"
                onClick={() => setImageBase64(null)}
                aria-label="Remove attached image"
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-coral-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {pdfText && (
            <div className="relative group flex items-center gap-1.5 rounded-xl border-2 border-ink-200 bg-ink-50 px-2.5 py-1.5 text-xs text-ink-600 max-w-[200px]">
              <FileText className="h-3.5 w-3.5 shrink-0 text-purple-500" />
              <span className="truncate">{pdfText.slice(0, 60)}...</span>
              <button
                type="button"
                onClick={() => setPdfText(null)}
                aria-label="Remove PDF attachment"
                className="ml-1 shrink-0 text-ink-400 hover:text-coral-500"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {docFile && (
            <div className="relative group flex items-center gap-1.5 rounded-xl border-2 border-ink-200 bg-ink-50 px-2.5 py-1.5 text-xs text-ink-600 max-w-[220px]">
              <File className="h-3.5 w-3.5 shrink-0 text-sky-500" />
              <span className="truncate">{docFile.filename}</span>
              <button
                type="button"
                onClick={() => setDocFile(null)}
                aria-label="Remove file attachment"
                className="ml-1 shrink-0 text-ink-400 hover:text-coral-500"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
      {imageBase64 && (
        <p className="mb-2 text-[11px] text-ink-400">
          Your teacher will help you work through this step by step.
        </p>
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
          placeholder={isAiFree ? "AI-Free mode \u2014 try working it out first!" : "Ask anything\u2026"}
          disabled={disabled}
          rows={1}
          aria-label="Message input"
          className="input min-h-[44px] max-h-[160px] resize-none py-2.5 text-sm rounded-xl border-2 border-ink-200 focus:border-mint-400"
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className="shrink-0 h-10 w-10 rounded-full bg-mint-400 hover:bg-mint-500 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
