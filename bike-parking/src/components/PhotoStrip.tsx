import { useRef } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { PhotoThumb } from "./PhotoThumb";
import { useObjectUrls } from "@/hooks/useObjectUrl";
import { canUseCameraCapture } from "@/lib/device";
import { MAX_ITEM_PHOTOS } from "@/types";

/**
 * A small gallery: saved photos plus any photos picked this session, with the
 * camera/gallery inputs underneath. Same plain <input type="file"> approach as
 * the bike photos — the Android WebView routes it to the system camera.
 *
 * Only phones and tablets honour `capture`; a laptop ignores it and opens the
 * file dialog from both inputs, so there we show a single picker instead.
 */
export function PhotoStrip({
  photoIds,
  newPhotos,
  onPick,
  onRemoveSaved,
  onRemoveNew,
  max = MAX_ITEM_PHOTOS,
}: {
  photoIds: string[];
  newPhotos: Blob[];
  onPick: (file: Blob) => void;
  onRemoveSaved: (photoId: string) => void;
  onRemoveNew: (index: number) => void;
  max?: number;
}) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const previews = useObjectUrls(newPhotos);

  const canCapture = canUseCameraCapture();
  const total = photoIds.length + newPhotos.length;
  const canAdd = total < max;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    for (const file of Array.from(event.target.files ?? [])) {
      if (total + 1 <= max) onPick(file);
    }
    event.target.value = "";
  };

  return (
    <div className="space-y-2">
      {total === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-[11px] text-slate-500">
          No pictures yet — a photo of the thing and one of its label saves a lot of guessing.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {photoIds.map((photoId) => (
            <div key={photoId} className="relative aspect-square overflow-hidden rounded-lg">
              <PhotoThumb photoId={photoId} alt="Item photo" className="h-full w-full" />
              <button
                type="button"
                onClick={() => onRemoveSaved(photoId)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white backdrop-blur active:bg-slate-900"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          {newPhotos.map((_, index) => (
            <div
              key={`new-${index}`}
              className="relative aspect-square overflow-hidden rounded-lg border border-emerald-300"
            >
              {previews[index] ? (
                <img src={previews[index]} alt="New item photo" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full animate-pulse bg-slate-100" />
              )}
              <button
                type="button"
                onClick={() => onRemoveNew(index)}
                aria-label="Remove new photo"
                className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white backdrop-blur active:bg-slate-900"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {canAdd ? (
        canCapture ? (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => cameraInput.current?.click()}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11px] font-semibold text-slate-700 active:bg-slate-100"
            >
              <Camera size={13} /> Take photo
            </button>
            <button
              type="button"
              onClick={() => libraryInput.current?.click()}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11px] font-semibold text-slate-700 active:bg-slate-100"
            >
              <ImagePlus size={13} /> From gallery
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => libraryInput.current?.click()}
              className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11px] font-semibold text-slate-700 active:bg-slate-100"
            >
              <ImagePlus size={13} /> Add photo
            </button>
            <p className="text-center text-[10px] text-slate-400">
              This device picks an image file. Taking the photo with the camera works on the phone.
            </p>
          </div>
        )
      ) : (
        <p className="text-[11px] text-slate-500">
          That is the maximum of {max} photos. Remove one to add another.
        </p>
      )}

      {canCapture ? (
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={handleChange}
          aria-label="Item photo camera input"
        />
      ) : null}
      <input
        ref={libraryInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
        aria-label="Item photo gallery input"
      />
    </div>
  );
}
