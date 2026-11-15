import { useState } from "react";
import { KeyRound, MapPin, Pencil, Trash2 } from "lucide-react";
import { Badge, Button, Chip, Notice, Sheet } from "./ui";
import { PhotoThumb } from "./PhotoThumb";
import { keysForBike, slotById } from "@/lib/model";
import {
  BIKE_STATUSES,
  STATUS_LABEL,
  type Bike,
  type BikeStatus,
  type InventorySnapshot,
} from "@/types";

export interface BikeDetailProps {
  snapshot: InventorySnapshot;
  bike: Bike;
  onClose: () => void;
  onEdit: (bike: Bike) => void;
  onDelete: (bikeId: string) => Promise<unknown>;
  onSetStatus: (bikeId: string, status: BikeStatus) => Promise<unknown>;
}

export const BikeDetail = ({ snapshot, bike, onClose, onEdit, onDelete, onSetStatus }: BikeDetailProps) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const slot = slotById(snapshot, bike.slotId);
  const keys = keysForBike(snapshot, bike);

  return (
    <Sheet
      open
      onClose={onClose}
      title={bike.name}
      subtitle={slot ? `Place ${slot.code}` : "No place assigned"}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => onEdit(bike)}>
            <Pencil size={15} /> Edit
          </Button>
          <Button
            variant={confirmingDelete ? "danger" : "secondary"}
            onClick={async () => {
              if (!confirmingDelete) {
                setConfirmingDelete(true);
                return;
              }
              await onDelete(bike.id);
              onClose();
            }}
            aria-label={confirmingDelete ? "Confirm delete" : "Delete bike"}
          >
            <Trash2 size={15} />
            {confirmingDelete ? "Really delete" : "Delete"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 pb-2">
        <div className="grid grid-cols-2 gap-2">
          <figure className="space-y-1">
            <PhotoThumb
              photoId={bike.bikePhotoId}
              alt={`${bike.name} bike`}
              className="h-36 w-full rounded-xl"
            />
            <figcaption className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              The bike
            </figcaption>
          </figure>
          <figure className="space-y-1">
            <PhotoThumb
              photoId={bike.slotPhotoId}
              alt={`${slot?.code ?? "place"} photo`}
              className="h-36 w-full rounded-xl"
            />
            <figcaption className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              The place
            </figcaption>
          </figure>
        </div>

        <div className="rounded-xl border border-slate-200 p-2.5">
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <MapPin size={14} className="text-slate-400" />
            {slot ? `${slot.code}` : "Not in a place"}
          </p>
          {slot ? <p className="mt-0.5 text-[11px] text-slate-500">Zone {slot.zone}</p> : null}
        </div>

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Keys that fit</p>
          {keys.length === 0 ? (
            <p className="text-xs text-amber-700">No key recorded — edit the bike to add one.</p>
          ) : (
            <ul className="space-y-1">
              {keys.map((key) => (
                <li
                  key={key.id}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700"
                >
                  <KeyRound size={13} className="text-slate-400" />
                  <span className="font-semibold">{key.label}</span>
                  {key.keptAt ? <span className="text-slate-500">· kept at {key.keptAt}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {bike.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {bike.tags.map((tag) => (
              <Badge key={tag} tone="violet">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {BIKE_STATUSES.map((value) => (
              <Chip
                key={value}
                active={bike.status === value}
                onClick={() => void onSetStatus(bike.id, value)}
              >
                {STATUS_LABEL[value]}
              </Chip>
            ))}
          </div>
        </div>

        {bike.notes ? (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Notes</p>
            <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-700">
              {bike.notes}
            </p>
          </div>
        ) : null}

        {confirmingDelete ? (
          <Notice tone="red">
            Deleting removes the record and both photos from this phone. This cannot be undone.
          </Notice>
        ) : null}
      </div>
    </Sheet>
  );
};
