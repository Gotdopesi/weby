import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StatsPeriod } from "@/lib/admin-statistics-period";

const ALL_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: "week", label: "Týden" },
  { value: "month", label: "Měsíc" },
  { value: "year", label: "Rok" },
];

type Props = {
  value: StatsPeriod;
  onChange: (period: StatsPeriod) => void;
  className?: string;
  modes?: StatsPeriod[];
};

export function AdminPeriodToggle({ value, onChange, className, modes }: Props) {
  const options = modes
    ? ALL_OPTIONS.filter((o) => modes.includes(o.value))
    : ALL_OPTIONS;

  return (
    <div className={cn("inline-flex rounded-lg border border-border p-0.5 bg-muted/30", className)}>
      {options.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          size="sm"
          variant={value === opt.value ? "default" : "ghost"}
          className="h-8 px-3"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
