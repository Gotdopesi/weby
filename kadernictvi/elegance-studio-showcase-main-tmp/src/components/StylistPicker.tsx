import { useState } from "react";
import { CalendarClock, UserRound, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STAFF_ANY,
  staffDisplayName,
  type StaffMember,
  type StaffSelection,
} from "@/lib/staff";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StylistPickerProps = {
  staff: StaffMember[];
  value: StaffSelection;
  onChange: (value: StaffSelection) => void;
};

type StaffOption = {
  id: StaffSelection;
  label: string;
  sub?: string;
  photo?: string;
};

export function StylistPicker({ staff, value, onChange }: StylistPickerProps) {
  const [preview, setPreview] = useState<StaffOption | null>(null);

  const options: StaffOption[] = [
    {
      id: STAFF_ANY,
      label: "Je mi to jedno",
      sub: "Vybrat nejbližší volný termín",
    },
    ...staff.map((s) => ({
      id: s.id as StaffSelection,
      label: staffDisplayName(s),
      sub: s.role_title,
      photo: s.photo_url,
    })),
  ];

  return (
    <>
      <div className="space-y-2" role="radiogroup" aria-label="Výběr kadeřníka">
        {options.map((opt) => {
          const selected = value === opt.id;
          const isAny = opt.id === STAFF_ANY;

          return (
            <div
              key={String(opt.id)}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl border p-3 transition-all",
                isAny && "border-dashed",
                selected
                  ? "border-gold bg-gold/10 ring-1 ring-gold/40"
                  : "border-border hover:border-gold/50 hover:bg-muted/40",
              )}
            >
              {!isAny && opt.photo ? (
                <button
                  type="button"
                  aria-label={`Zvětšit fotku: ${opt.label}`}
                  onClick={() => setPreview(opt)}
                  className={cn(
                    "shrink-0 h-12 w-12 rounded-full overflow-hidden border-2 relative group",
                    selected ? "border-gold" : "border-border",
                  )}
                >
                  <img src={opt.photo} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                    <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                  </span>
                </button>
              ) : (
                <div
                  className={cn(
                    "shrink-0 h-12 w-12 rounded-full overflow-hidden border-2 flex items-center justify-center",
                    selected ? "border-gold" : "border-border",
                    isAny && "bg-muted",
                  )}
                >
                  {isAny ? (
                    <CalendarClock className="h-5 w-5 text-gold" aria-hidden />
                  ) : (
                    <UserRound className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}

              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(opt.id)}
                className="min-w-0 flex-1 flex items-center gap-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className={cn("font-medium text-sm", isAny && "text-foreground")}>{opt.label}</p>
                  {opt.sub && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{opt.sub}</p>
                  )}
                </div>
                <div
                  className={cn(
                    "shrink-0 h-4 w-4 rounded-full border-2",
                    selected ? "border-gold bg-gold" : "border-muted-foreground/40",
                  )}
                  aria-hidden
                />
              </button>
            </div>
          );
        })}
      </div>

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-md z-[100]">
          <DialogHeader>
            <DialogTitle className="font-display">{preview?.label}</DialogTitle>
            {preview?.sub && <DialogDescription>{preview.sub}</DialogDescription>}
          </DialogHeader>
          {preview?.photo && (
            <div className="rounded-xl overflow-hidden border border-border bg-muted aspect-[3/4] max-h-[70vh]">
              <img
                src={preview.photo.replace("w=800", "w=1200")}
                alt={preview.label}
                className="h-full w-full object-cover object-top"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
