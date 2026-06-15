import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import {
  FALLBACK_STAFF,
  fetchActiveStaff,
  staffDisplayName,
  staffShortLabel,
  type StaffMember,
} from "@/lib/staff";

type TeamFlipCardProps = {
  member: StaffMember;
  onBook: (staffId: number) => void;
};

function TeamFlipCard({ member, onBook }: TeamFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setFinePointer(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const handleCardClick = () => {
    if (finePointer) return;
    setFlipped((f) => !f);
  };

  return (
    <article
      className="team-flip-scene h-[min(72vw,420px)] sm:h-[400px] lg:h-[440px] cursor-pointer sm:cursor-default"
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (!finePointer) {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${staffDisplayName(member)} — ${member.role_title}. ${finePointer ? "Najeďte myší pro detail." : "Klepněte pro otočení karty."}`}
    >
      <div
        className={cn(
          "team-flip-inner h-full w-full",
          !finePointer && flipped && "team-flip-inner--flipped",
        )}
      >
        {/* Přední strana */}
        <div className="team-flip-face team-flip-face--front overflow-hidden rounded-2xl border border-border/80 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.35)]">
          <img
            src={member.photo_url}
            alt={staffDisplayName(member)}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/25 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
            <p className="text-[10px] uppercase tracking-[0.35em] text-gold mb-2">Náš tým</p>
            <h3 className="font-display text-2xl md:text-3xl leading-tight">
              {staffShortLabel(member)}
            </h3>
          </div>
          {!finePointer && (
            <p className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-primary-foreground/70 bg-primary/40 backdrop-blur px-2 py-1 rounded-full">
              Klepněte pro detail
            </p>
          )}
        </div>

        {/* Zadní strana */}
        <div className="team-flip-face team-flip-face--back rounded-2xl border border-border bg-card p-6 flex flex-col shadow-[0_20px_50px_-24px_rgba(0,0,0,0.2)]">
          <div>
            <h3 className="font-display text-2xl text-foreground">{staffDisplayName(member)}</h3>
            <p className="text-xs uppercase tracking-[0.2em] text-gold mt-1">{member.role_title}</p>
            <div className="hairline w-12 my-4" />
            {member.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{member.bio}</p>
            )}
          </div>

          {member.specializations.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {member.specializations.map((s) => (
                <li
                  key={s}
                  className="text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-full border border-gold/30 bg-gold/10 text-foreground/90"
                >
                  {s}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto pt-5">
            <Button
              type="button"
              className="w-full bg-gold text-primary hover:bg-gold/90"
              onClick={(e) => {
                e.stopPropagation();
                onBook(member.id);
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Objednat se ke mně
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

type TeamFlipCardsProps = {
  onBookStaff: (staffId: number) => void;
};

export function TeamFlipCards({ onBookStaff }: TeamFlipCardsProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchActiveStaff().then((rows) => {
      if (cancelled) return;
      if (rows.length > 0) {
        setStaff(rows);
      } else if (!isSupabaseConfigured()) {
        setStaff(FALLBACK_STAFF);
      } else {
        setStaff([]);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="tym" className="py-24 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-4">Lidé</p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Náš tým</h2>
          <div className="hairline w-24 mx-auto mb-6" />
          <p className="text-muted-foreground leading-relaxed">
            Seznamte se s lidmi, kteří za vaším účesem stojí. Na počítači najeďte na kartu,
            na mobilu klepněte pro bio a specializace.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
            Načítám tým…
          </div>
        ) : staff.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm max-w-md mx-auto">
            Tým zatím není v databázi. Spusť v Supabase SQL soubor{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">showcase_staff.sql</code>.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8 lg:gap-6">
            {staff.map((m) => (
              <TeamFlipCard key={m.id} member={m} onBook={onBookStaff} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
