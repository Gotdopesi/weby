import { BarChart3, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Mode = "table" | "chart";

type Props = {
  value: Mode;
  onChange: (mode: Mode) => void;
  className?: string;
};

export function AdminViewToggle({ value, onChange, className }: Props) {
  return (
    <div className={cn("inline-flex rounded-lg border border-border p-0.5 bg-muted/30", className)}>
      <Button
        type="button"
        size="sm"
        variant={value === "table" ? "default" : "ghost"}
        className="h-8 gap-1.5"
        onClick={() => onChange("table")}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Přehled
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "chart" ? "default" : "ghost"}
        className="h-8 gap-1.5"
        onClick={() => onChange("chart")}
      >
        <BarChart3 className="h-3.5 w-3.5" />
        Graf
      </Button>
    </div>
  );
}
