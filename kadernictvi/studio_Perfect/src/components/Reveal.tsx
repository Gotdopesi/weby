import { useEffect, useRef, useState, type ReactNode } from "react";

type Variant = "up" | "left" | "right" | "scale" | "fade";

const hidden: Record<Variant, string> = {
  up: "translate-y-10 opacity-0",
  left: "-translate-x-10 opacity-0",
  right: "translate-x-10 opacity-0",
  scale: "scale-95 opacity-0",
  fade: "opacity-0",
};

const shown: Record<Variant, string> = {
  up: "translate-y-0 opacity-100",
  left: "translate-x-0 opacity-100",
  right: "translate-x-0 opacity-100",
  scale: "scale-100 opacity-100",
  fade: "opacity-100",
};

type Props = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  delay?: number;
  duration?: number;
  as?: "div" | "section" | "article" | "li" | "blockquote";
};

export function Reveal({
  children,
  className = "",
  variant = "up",
  delay = 0,
  duration = 700,
  as: Tag = "div",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`will-change-transform ${visible ? shown[variant] : hidden[variant]} ${className}`}
      style={{
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}

export function useParallax(factor = 0.25) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => setOffset(window.scrollY * factor);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [factor]);

  return offset;
}
