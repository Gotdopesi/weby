import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BookingDialog } from "@/components/BookingDialog";
import { GalleryGrid } from "@/components/home/GalleryGrid";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteNav } from "@/components/home/SiteNav";
import { AppLink } from "@/lib/router";
import { STAFF_ANY } from "@/lib/staff";

export default function PortfolioPage() {
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main>
      <SiteNav onReserve={() => setBookingOpen(true)} />

      <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6">
          <AppLink
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Zpět na úvod
          </AppLink>

          <div className="max-w-2xl mb-12">
            <p className="text-gold tracking-[0.3em] text-xs uppercase mb-4">Portfolio</p>
            <h1 className="font-display text-4xl md:text-6xl mb-4 leading-tight">Naše portfolio</h1>
            <div className="hairline w-24 mb-6" />
            <p className="text-muted-foreground leading-relaxed">
              Střihy, barvení, styling a atmosféra salónu — výběr z naší práce.
            </p>
          </div>

          <GalleryGrid />
        </div>
      </section>

      <SiteFooter showReserve={false} />
      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} initialStaffId={STAFF_ANY} />
    </main>
  );
}
