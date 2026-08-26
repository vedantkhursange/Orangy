"use client";

/**
 * Direct-from-browser upload to Cloudinary using an unsigned upload preset.
 * The backend never sees the file — only the resulting secure URL (matching
 * the documented Orangy media architecture: admin media rows store a URL,
 * the binary lives in a cloud bucket).
 *
 * Requires two PUBLIC, non-secret build-time values (unsigned presets are
 * designed to be used client-side and are restricted server-side by the
 * preset's own settings — folder, formats, size caps):
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 */

export const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
export const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

export const cloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

export type UploadResult = {
  url: string;
  resourceType: "image" | "video";
  width?: number;
  height?: number;
  bytes: number;
};

/**
 * Uploads a single file with progress reporting. Uses XMLHttpRequest because
 * fetch() has no upload-progress event.
 */
export function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    if (!cloudinaryConfigured) {
      reject(new Error("Cloudinary isn't configured yet. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."));
      return;
    }
    const resourceType = file.type.startsWith("video/") ? "video" : "image";
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);
    form.append("folder", "orangy");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && body.secure_url) {
          resolve({
            url: body.secure_url as string,
            resourceType,
            width: body.width,
            height: body.height,
            bytes: body.bytes,
          });
        } else {
          reject(new Error(body?.error?.message ?? `Upload failed (${xhr.status})`));
        }
      } catch {
        reject(new Error("Upload failed — unexpected response from Cloudinary."));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed — network error."));
    xhr.send(form);
  });
}

export const MAX_UPLOAD_MB = 25;
