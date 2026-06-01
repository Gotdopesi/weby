import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Team } from "@/components/Team";
import { Services } from "@/components/Services";
import { Gallery } from "@/components/Gallery";
import { Voucher } from "@/components/Voucher";
import { Contact, Footer } from "@/components/Contact";
import { BookingDialog } from "@/components/BookingDialog";
import { getServiceNameById } from "@/lib/reservation-data";

export default function HomePage() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectServiceName, setPreselectServiceName] = useState<string | undefined>();

  const onReserve = (preselectId?: string) => {
    setPreselectServiceName(preselectId ? getServiceNameById(preselectId) : undefined);
    setBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar onReserve={() => onReserve()} />
      <main>
        <Hero onReserve={() => onReserve()} />
        <About />
        <Team />
        <Services onReserve={onReserve} />
        <Gallery />
        <Voucher />
        <Contact />
      </main>
      <Footer />
      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        preselectServiceName={preselectServiceName}
      />
    </div>
  );
}
