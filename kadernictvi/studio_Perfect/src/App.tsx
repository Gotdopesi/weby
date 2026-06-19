import { useCallback, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { HeroSection } from "@/components/HeroSection";
import { BeforeAfterSection } from "@/components/BeforeAfterSection";
import { ServicesSection } from "@/components/ServicesSection";
import { ProductsSection } from "@/components/ProductsSection";
import { ReviewsSection } from "@/components/ReviewsSection";
import { AboutSection } from "@/components/AboutSection";
import { ContactSection, SiteFooter } from "@/components/ContactSection";

function ReserveToast({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[min(100%-2rem,380px)] -translate-x-1/2">
      <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 shadow-xl">
        <div className="flex-1">
          <p className="font-medium text-ink">Rezervace brzy</p>
          <p className="mt-1 text-sm text-muted">
            Online objednávání zatím připravujeme. Zavolejte prosím na{" "}
            <a href="tel:+420731160074" className="text-accent underline-offset-2 hover:underline">
              731 160 074
            </a>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-sm text-muted hover:text-ink"
          aria-label="Zavřít"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [toastOpen, setToastOpen] = useState(false);

  const onReserve = useCallback(() => {
    setToastOpen(true);
    window.setTimeout(() => setToastOpen(false), 5000);
  }, []);

  return (
    <>
      <SiteNav onReserve={onReserve} />
      <main className="relative">
        <HeroSection onReserve={onReserve} />
        <BeforeAfterSection />
        <ServicesSection onReserve={onReserve} />
        <ProductsSection />
        <ReviewsSection />
        <AboutSection />
        <ContactSection onReserve={onReserve} />
        <SiteFooter />
      </main>
      <ReserveToast visible={toastOpen} onClose={() => setToastOpen(false)} />
    </>
  );
}
