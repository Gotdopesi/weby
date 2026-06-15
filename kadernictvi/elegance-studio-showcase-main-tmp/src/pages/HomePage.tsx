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

export default function HomePage() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStaffId, setBookingStaffId] = useState<StaffSelection>(STAFF_ANY);
  const [bookingServiceName, setBookingServiceName] = useState<string | undefined>();

  const openBooking = (opts?: { staffId?: number; serviceName?: string }) => {
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
      <SiteNav onReserve={() => openBooking()} />
      <HeroSection onReserve={() => openBooking()} />
      <PortfolioPreview />
      <TeamFlipCards onBookStaff={(staffId) => openBooking({ staffId })} />
      <ServicesPricing onReserveService={(serviceName) => openBooking({ serviceName })} />
      <ProductsSection />
      <AboutSection />
      <SiteFooter onReserve={() => openBooking()} />
      <BookingDialog
        open={bookingOpen}
        onOpenChange={closeBooking}
        initialStaffId={bookingStaffId}
        initialServiceName={bookingServiceName}
      />
    </main>
  );
}
