import { useState } from "react";
import { BookingDialog } from "@/components/BookingDialog";
import { TeamFlipCards } from "@/components/TeamFlipCards";
import { AboutSection } from "@/components/home/AboutSection";
import { HeroSection } from "@/components/home/HeroSection";
import { PortfolioPreview } from "@/components/home/PortfolioPreview";
import { ProductsSection } from "@/components/home/ProductsSection";
import { ServicesPricing } from "@/components/home/ServicesPricing";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteNav } from "@/components/home/SiteNav";
import { STAFF_ANY, type StaffSelection } from "@/lib/staff";
import { trackEvent } from "@/lib/analytics";

export default function HomePage() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStaffId, setBookingStaffId] = useState<StaffSelection>(STAFF_ANY);
  const [bookingServiceName, setBookingServiceName] = useState<string | undefined>();

  const openBooking = (opts?: {
    staffId?: number;
    serviceName?: string;
    source?: string;
  }) => {
    trackEvent("reserve_click", {
      source: opts?.source ?? "unknown",
      ...(opts?.serviceName ? { service: opts.serviceName } : {}),
      ...(opts?.staffId ? { staff_id: opts.staffId } : {}),
    });
    setBookingStaffId(opts?.staffId ?? STAFF_ANY);
    setBookingServiceName(opts?.serviceName);
    setBookingOpen(true);
  };

  const closeBooking = (open: boolean) => {
    setBookingOpen(open);
    if (!open) {
      setBookingStaffId(STAFF_ANY);
      setBookingServiceName(undefined);
    }
  };

  return (
    <main>
      <SiteNav onReserve={() => openBooking({ source: "nav" })} />
      <HeroSection onReserve={() => openBooking({ source: "hero" })} />
      <PortfolioPreview />
      <TeamFlipCards onBookStaff={(staffId) => openBooking({ staffId, source: "team" })} />
      <ServicesPricing
        onReserveService={(serviceName) => openBooking({ serviceName, source: "services" })}
      />
      <ProductsSection />
      <AboutSection />
      <SiteFooter onReserve={() => openBooking({ source: "footer" })} />
      <BookingDialog
        open={bookingOpen}
        onOpenChange={closeBooking}
        initialStaffId={bookingStaffId}
        initialServiceName={bookingServiceName}
      />
    </main>
  );
}
