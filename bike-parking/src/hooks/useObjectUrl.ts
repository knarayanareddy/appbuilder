import { useEffect, useState } from "react";

/** Object URL for a single in-memory blob, revoked when it changes or unmounts. */
export function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return url;
}

/** Object URLs for a list of in-memory blobs (photos picked but not saved yet). */
export function useObjectUrls(blobs: Blob[]): string[] {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const created = blobs.map((blob) => URL.createObjectURL(blob));
    setUrls(created);
    return () => created.forEach((url) => URL.revokeObjectURL(url));
  }, [blobs]);

  return urls;
}
