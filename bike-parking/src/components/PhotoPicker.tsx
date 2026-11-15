import { useRef } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { PhotoThumb } from "./PhotoThumb";

/**
 * Two inputs: one opens the camera directly (`capture`), one opens the gallery.
 * Both are plain <input type="file"> — the Android WebView routes them to the
 * system camera/gallery, so there is no plugin, no permission prompt and nothing
 * to download.
 */
export function PhotoPicker({
  label,
  photoId,
  previewUrl,
  onPick,
  onRemove,
}: {
  label: string;
  photoId: string | null;
  /** Local object URL for a photo picked but not saved yet. */
  previewUrl?: string | null;
  onPick: (file: Blob) => void;
  onRemove: () => void;
}) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onPick(file);
    event.target.value = "";
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        {photoId || previewUrl ? (
          <button type="button" onClick={onRemove} className="text-[11px] font-semibold text-red-600">
            Remove
          </button>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-lg">
        {previewUrl ? (
          <img src={previewUrl} alt={label} className="h-28 w-full object-cover" />
        ) : (
          <PhotoThumb photoId={photoId} alt={label} className="h-28 w-full" />
        )}
        <button
          type="button"
          onClick={() => cameraInput.current?.click()}
          aria-label={`Take ${label.toLowerCase()} photo`}
          className="absolute inset-0 flex items-end justify-center pb-1.5"
        >
          <span className="rounded-full bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
            {photoId || previewUrl ? "Replace" : "Tap to add"}
          </span>
        </button>
      </div>

      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => cameraInput.current?.click()}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 active:bg-slate-100"
        >
          <Camera size={13} /> Camera
        </button>
        <button
          type="button"
          onClick={() => libraryInput.current?.click()}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 active:bg-slate-100"
        >
          <ImagePlus size={13} /> Gallery
        </button>
      </div>

      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        aria-label={`${label} camera input`}
      />
      <input
        ref={libraryInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        aria-label={`${label} gallery input`}
      />
    </div>
  );
}
