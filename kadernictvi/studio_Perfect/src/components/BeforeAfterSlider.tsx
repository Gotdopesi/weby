import { useCallback, useRef, useState } from "react";
import { GripVertical } from "lucide-react";

type Props = {
  before: string;
  after: string;
  title: string;
  note?: string;
  initialPosition?: number;
};

export function BeforeAfterSlider({
  before,
  after,
  title,
  note,
  initialPosition = 75,
}: Props) {
  const [position, setPosition] = useState(initialPosition);
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

  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    frame.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="mx-auto w-full max-w-[17.5rem] space-y-3 sm:max-w-xs md:max-w-sm">
      <div
        ref={frame}
        className="relative mx-auto aspect-[3/4] max-h-[min(72vw,22rem)] w-full max-w-[17.5rem] touch-none select-none overflow-hidden rounded-2xl border border-line shadow-[0_16px_40px_-24px_rgba(0,0,0,0.35)] sm:max-h-none sm:max-w-xs md:max-w-sm"
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
          draggable={false}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img
            src={before}
            alt={`Před — ${title}`}
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>

        <div
          className="absolute bottom-0 top-0 w-0.5 bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.35)]"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-accent bg-white text-ink shadow-lg sm:h-11 sm:w-11">
            <GripVertical className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        <span className="absolute left-3 top-3 rounded-full bg-ink/55 px-2.5 py-1 text-[9px] uppercase tracking-widest text-paper backdrop-blur-sm sm:left-4 sm:top-4 sm:text-[10px]">
          Před
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-accent/90 px-2.5 py-1 text-[9px] uppercase tracking-widest text-paper sm:right-4 sm:top-4 sm:text-[10px]">
          Po
        </span>
      </div>
      <div className="px-2 text-center">
        <p className="font-display text-lg leading-snug md:text-xl">{title}</p>
        {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      </div>
    </div>
  );
}
