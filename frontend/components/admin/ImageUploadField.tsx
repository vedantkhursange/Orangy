"use client";

import { useRef, useState } from "react";
import { Loader2, Pencil, Trash2, UploadCloud } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useToast } from "@/components/providers/Providers";
import { Label } from "@/components/ui/ui";

/**
 * Single-image upload field with a live preview — replaces a raw "paste a
 * URL" text input wherever a form needs exactly one image (variant / product
 * thumbnail). Uploads straight to Cloudinary; the field's value is always a
 * ready-to-use URL once upload finishes.
 */
export default function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const pick = (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    uploadToCloudinary(file, setProgress)
      .then((res) => onChange(res.url))
      .catch((err) => toast(err instanceof Error ? err.message : "Upload failed.", "error"))
      .finally(() => setUploading(false));
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div
          onClick={() => inputRef.current?.click()}
          className="group relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-ink/20 bg-sand transition hover:border-orange/60"
        >
          {value && !uploading ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-orange" />
          ) : (
            <UploadCloud className="h-5 w-5 text-orange/50" />
          )}
          {value && !uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
              <Pencil className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {uploading ? (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-orange transition-all" style={{ width: `${progress}%` }} />
            </div>
          ) : value ? (
            <div className="flex items-center gap-2">
              <p className="truncate text-xs text-ink/50">Image set</p>
              <button type="button" onClick={() => onChange("")} className="text-xs font-medium text-[#b3362b] hover:underline">
                <Trash2 className="mr-0.5 inline h-3 w-3" /> Remove
              </button>
            </div>
          ) : (
            <p className="text-xs text-ink/45">Click the box to upload an image</p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }}
        />
      </div>
    </div>
  );
}
