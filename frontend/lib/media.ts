/**
 * Cloudinary delivery helpers.
 *
 * Admin uploads land on Cloudinary at camera resolution (3–8 MB JPEGs), and
 * the storefront used to render those originals directly — a single product
 * page pulled ~15 MB. Cloudinary resizes and re-encodes on the fly when a
 * transformation segment follows `/upload/`, so every storefront <img> goes
 * through `cdn()` instead of the raw URL. Non-Cloudinary URLs pass through.
 */

const UPLOAD = "/upload/";

function isCloudinary(url: string) {
  return url.includes("res.cloudinary.com") && url.includes(UPLOAD);
}

function transform(url: string, t: string) {
  if (!url || !isCloudinary(url)) return url;
  const i = url.indexOf(UPLOAD) + UPLOAD.length;
  return url.slice(0, i) + t + "/" + url.slice(i);
}

/** Resized, auto-format (AVIF/WebP), auto-quality image of width `w`. */
export function cdn(url: string, w = 800) {
  return transform(url, `f_auto,q_auto,c_limit,w_${w}`);
}

/** A `srcSet` covering `widths`, for use with a `sizes` attribute. */
export function cdnSrcSet(url: string, widths: number[] = [320, 480, 640, 960, 1280]) {
  if (!isCloudinary(url)) return undefined;
  return widths.map((w) => `${cdn(url, w)} ${w}w`).join(", ");
}

/** First frame of a Cloudinary video as a resized JPEG poster. */
export function videoPoster(url: string, w = 800) {
  if (!isCloudinary(url)) return undefined;
  const still = url.replace(/\.(mp4|mov|webm|m4v)(\?.*)?$/i, ".jpg");
  return transform(still, `so_0,f_auto,q_auto,c_limit,w_${w}`);
}

/** Streaming-friendly re-encode of a Cloudinary video (smaller than the upload). */
export function cdnVideo(url: string, w = 1280) {
  return transform(url, `q_auto,vc_auto,c_limit,w_${w}`);
}
