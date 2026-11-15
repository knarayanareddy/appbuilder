import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { getPhotoBlob } from "@/lib/repo";

/** Loads a photo blob from the local database and shows it, cleaning up the URL. */
export function PhotoThumb({
  photoId,
  alt,
  className,
  imgClassName,
}: {
  photoId: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setUrl(null);
    setFailed(false);
    if (!photoId) return;

    getPhotoBlob(photoId)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) {
          setFailed(true);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId]);

  if (!photoId || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-slate-100 text-slate-300", className)}>
        <ImageOff size={16} />
      </div>
    );
  }

  if (!url) {
    return <div className={cn("animate-pulse bg-slate-100", className)} aria-label={`Loading ${alt}`} />;
  }

  return <img src={url} alt={alt} className={cn("object-cover", className, imgClassName)} />;
}
