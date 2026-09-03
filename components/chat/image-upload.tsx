"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

const MAX_DIMENSION = 1568;
const MAX_BYTES = 5 * 1024 * 1024;

interface ImageUploadProps {
  onImage: (base64: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ onImage, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    setProcessing(true);
    try {
      const base64 = await processImage(file);
      onImage(base64);
    } catch (err: any) {
      setError(err.message || "Failed to process image.");
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
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={disabled || processing}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || processing}
        className="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-600 hover:border-sky-400 hover:bg-sky-100 transition-colors disabled:opacity-50"
        title="Attach an image"
      >
        {processing ? (
          <span className="animate-pulse">Processing...</span>
        ) : (
          <>
            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-sky-200">
              <ImagePlus className="h-3 w-3 text-sky-600" />
            </span>
            Image
          </>
        )}
      </button>
      {error && <span className="text-xs text-coral-500">{error}</span>}
    </div>
  );
}

function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      // Check size
      const base64Part = dataUrl.split(",")[1] || "";
      if (base64Part.length > MAX_BYTES * 1.37) {
        reject(new Error("Image too large (max 5 MB after compression)."));
        return;
      }

      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image."));
    };

    img.src = url;
  });
}
