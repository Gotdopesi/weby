import { CalendarClock, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STAFF_ANY,
  staffDisplayName,
  type StaffMember,
  type StaffSelection,
} from "@/lib/staff";

type StylistPickerProps = {
  staff: StaffMember[];
  value: StaffSelection;
  onChange: (value: StaffSelection) => void;
};

export function StylistPicker({ staff, value, onChange }: StylistPickerProps) {
  const options: { id: StaffSelection; label: string; sub?: string; photo?: string }[] = [
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
    <div className="space-y-2" role="radiogroup" aria-label="Výběr kadeřníka">
      {options.map((opt) => {
        const selected = value === opt.id;
        const isAny = opt.id === STAFF_ANY;

        return (
          <button
            key={String(opt.id)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.id)}
            className={cn(
              "w-full flex items-center gap-4 rounded-xl border p-3 text-left transition-all",
              isAny && "border-dashed",
              selected
                ? "border-gold bg-gold/10 ring-1 ring-gold/40"
                : "border-border hover:border-gold/50 hover:bg-muted/40",
            )}
          >
            <div
              className={cn(
                "shrink-0 h-12 w-12 rounded-full overflow-hidden border-2 flex items-center justify-center",
                selected ? "border-gold" : "border-border",
                isAny && "bg-muted",
              )}
            >
              {isAny ? (
                <CalendarClock className="h-5 w-5 text-gold" aria-hidden />
              ) : opt.photo ? (
                <img src={opt.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
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
        );
      })}
    </div>
  );
}
