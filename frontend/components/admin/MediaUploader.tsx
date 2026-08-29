"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { cloudinaryConfigured, MAX_UPLOAD_MB, uploadToCloudinary, type UploadResult } from "@/lib/cloudinary";
import { useToast } from "@/components/providers/Providers";

type Job = { id: string; name: string; progress: number; error?: string };

/**
 * Drag-and-drop / click-to-browse uploader for the admin media gallery.
 * Accepts multiple images/videos, uploads each straight to Cloudinary, and
 * reports every finished upload via onUploaded — the caller registers it
 * with POST /api/admin/media.
 */
export default function MediaUploader({
  onUploaded,
  accept = "image/*,video/*",
  multiple = true,
}: {
  onUploaded: (result: UploadResult) => void;
  accept?: string;
  multiple?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (!cloudinaryConfigured) {
        toast("Media storage isn't configured yet — ask the site owner to set up Cloudinary.", "error");
        return;
      }
      [...files].forEach((file) => {
        if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
          toast(`${file.name} is over ${MAX_UPLOAD_MB} MB — that's Cloudinary's own per-file limit on this plan, not something the app restricts. Compress or trim it, or upgrade the Cloudinary plan for larger uploads.`, "error");
          return;
        }
        const id = `${file.name}-${Date.now()}-${Math.random()}`;
        setJobs((j) => [...j, { id, name: file.name, progress: 0 }]);
        uploadToCloudinary(file, (pct) => {
          setJobs((j) => j.map((job) => (job.id === id ? { ...job, progress: pct } : job)));
        })
          .then((result) => {
            setJobs((j) => j.filter((job) => job.id !== id));
            onUploaded(result);
          })
          .catch((err) => {
            setJobs((j) => j.map((job) => (job.id === id ? { ...job, error: err.message } : job)));
            toast(`Upload failed: ${file.name}`, "error");
          });
      });
    },
    [onUploaded, toast],
  );

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragOver ? "border-orange bg-orange/8" : "border-ink/20 hover:border-orange/50 hover:bg-sand/50"
        }`}
      >
        <UploadCloud className="h-8 w-8 text-orange-deep" />
        <p className="text-sm font-semibold text-ink">Drop images or videos here, or click to browse</p>
        <p className="text-xs text-ink/50">JPG, PNG, WebP or MP4 · up to {MAX_UPLOAD_MB} MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {jobs.length > 0 && (
        <ul className="mt-3 space-y-2">
          {jobs.map((job) => (
            <li key={job.id} className="rounded-xl border border-ink/10 bg-cream-soft p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 truncate text-ink/75">
                  {job.error ? <ImagePlus className="h-4 w-4 shrink-0 text-[#b3362b]" /> : <Loader2 className="h-4 w-4 shrink-0 animate-spin text-orange" />}
                  <span className="truncate">{job.name}</span>
                </span>
                <span className={`shrink-0 text-xs font-semibold ${job.error ? "text-[#b3362b]" : "text-ink/50"}`}>
                  {job.error ? "Failed" : `${job.progress}%`}
                </span>
              </div>
              {!job.error && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <div className="h-full rounded-full bg-orange transition-all" style={{ width: `${job.progress}%` }} />
                </div>
              )}
              {job.error && <p className="mt-1 text-xs text-[#b3362b]">{job.error}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
