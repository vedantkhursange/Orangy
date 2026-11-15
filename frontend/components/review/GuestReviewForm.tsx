"use client";

import { FormEvent, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, CheckCircle2, X } from "lucide-react";
import { api } from "@/lib/api";
import { cloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import type { Review } from "@/lib/types";
import { useToast } from "@/components/providers/Providers";
import { Button, Input, Label, Stars, Textarea } from "@/components/ui/ui";

const MAX_PHOTO_MB = 10;

/**
 * Review without an account: stars, name, city, an optional photo and a note.
 * Used on the gift-card QR page and under each product for signed-out visitors.
 */
export default function GuestReviewForm({ productId, compact = false }: { productId: string; compact?: boolean }) {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast("Please choose a photo.", "error");
    if (f.size > MAX_PHOTO_MB * 1024 * 1024) return toast(`Photo must be under ${MAX_PHOTO_MB} MB.`, "error");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      let photoUrl: string | undefined;
      if (file) {
        setProgress(0);
        photoUrl = (await uploadToCloudinary(file, setProgress)).url;
      }
      await api.post<Review>("/api/public/reviews", { productId, rating, name, city, comment, photoUrl });
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      setDone(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not send your review.", "error");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
        <CheckCircle2 className="h-12 w-12 text-orange" />
        <p className="display text-xl font-bold text-ink">Thank you, {name.split(" ")[0]}!</p>
        <p className="max-w-xs text-sm text-ink/60">Your review is in. It shows on the site once our team gives it a quick look.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <Label>Your rating</Label>
        <Stars value={rating} onChange={setRating} size={compact ? "h-6 w-6" : "h-9 w-9"} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <Label>Name</Label>
          <Input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" />
        </label>
        <label>
          <Label>City</Label>
          <Input required maxLength={80} value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" placeholder="e.g. Nagpur" />
        </label>
      </div>
      <label>
        <Label>Your review</Label>
        <Textarea rows={compact ? 3 : 4} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How were the oranges?" />
      </label>

      {cloudinaryConfigured && (
        <div>
          <Label>Photo (optional)</Label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          {preview ? (
            <div className="relative w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Your photo" className="h-32 w-auto rounded-xl object-cover" />
              <button type="button" aria-label="Remove photo" onClick={() => { setFile(null); setPreview(null); }} className="absolute -right-2 -top-2 rounded-full bg-ink p-1 text-cream">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} className="glass flex w-full items-center justify-center gap-2 rounded-2xl border-dashed px-4 py-5 text-sm font-semibold text-ink/70 transition hover:text-orange">
              <Camera className="h-5 w-5" /> Add a photo of your oranges
            </button>
          )}
        </div>
      )}

      <Button type="submit" size="lg" loading={busy} className="w-full">
        {progress != null ? `Uploading photo ${Math.round(progress)}%` : "Post review"}
      </Button>
    </form>
  );
}
