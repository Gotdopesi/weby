import { useCallback, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  before: string;
  after: string;
  title: string;
  className?: string;
  beforePosition?: string;
  afterPosition?: string;
  /** Stejná fotka — „před“ vypadá přirozeněji (méně upravené). */
  samePerson?: boolean;
};

export function BeforeAfterSlider({
  before,
  after,
  title,
  className,
  beforePosition = "center center",
  afterPosition = "center center",
  samePerson = false,
}: Props) {
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);
  const frame = useRef<HTMLDivElement>(null);

  const setFromClientX = useCallback((clientX: number) => {
    const el = frame.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(98, Math.max(2, pct)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    frame.current?.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setFromClientX(e.clientX);
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div className={cn("space-y-2 sm:space-y-3 w-full", className)}>
      <div
        ref={frame}
        className="relative w-full max-w-[17.5rem] sm:max-w-xs md:max-w-sm mx-auto aspect-[3/4] max-h-[min(72vw,22rem)] sm:max-h-none rounded-xl sm:rounded-2xl overflow-hidden border border-border shadow-[0_16px_40px_-24px_rgba(0,0,0,0.35)] select-none touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-label={`Před a po: ${title}`}
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <img
          src={after}
          alt={`Po — ${title}`}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: afterPosition }}
          draggable={false}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img
            src={before}
            alt={`Před — ${title}`}
            className={cn(
              "h-full w-full object-cover",
              samePerson && "scale-[1.06] saturate-[0.55] brightness-[0.9] contrast-[1.02]",
            )}
            style={{ objectPosition: beforePosition }}
            draggable={false}
          />
        </div>

        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.4)]"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-white text-primary shadow-lg flex items-center justify-center border-2 border-gold">
            <GripVertical className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        <span className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 text-[9px] sm:text-[10px] uppercase tracking-widest bg-black/50 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full backdrop-blur-sm">
          Před
        </span>
        <span className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 text-[9px] sm:text-[10px] uppercase tracking-widest bg-gold/90 text-primary px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
          Po
        </span>
      </div>
      <p className="font-display text-base sm:text-lg md:text-xl text-center px-2 leading-snug">{title}</p>
    </div>
  );
}
