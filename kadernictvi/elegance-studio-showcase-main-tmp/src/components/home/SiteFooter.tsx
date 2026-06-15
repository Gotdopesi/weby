import { useState } from "react";
import { z } from "zod";
import {
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_BARBERSHOP_ID } from "@/lib/barbershop";
import { SHOWCASE_TABLES } from "@/lib/showcase-tables";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Zadejte jméno").max(100),
  email: z.string().trim().email("Neplatný e-mail").max(255),
  message: z.string().trim().min(5, "Napište prosím zprávu").max(1000),
});

type Props = {
  onReserve?: () => void;
  showReserve?: boolean;
};

export function SiteFooter({ onReserve, showReserve = true }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = contactSchema.safeParse({ name, email, message });
    if (!r.success) {
      toast.error(r.error.issues[0].message);
      return;
    }
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from(SHOWCASE_TABLES.portfolioPoptavky).insert({
        barbershop_id: DEFAULT_BARBERSHOP_ID,
        name: r.data.name,
        email: r.data.email,
        message: r.data.message,
      });
      if (error) {
        toast.error("Zprávu se nepodařilo uložit.", { description: error.message });
        return;
      }
    }
    toast.success("Děkujeme! Brzy se vám ozveme.");
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <footer id="kontakt" className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-10">
        <div className="grid lg:grid-cols-2 gap-16 mb-20">
          <div>
            <p className="text-gold tracking-[0.3em] text-xs uppercase mb-4">Kontakt</p>
            <h2 className="font-display text-4xl md:text-5xl mb-6 leading-tight">Těšíme se na vás.</h2>
            <div className="hairline w-24 mb-8" />
            <ul className="space-y-5 text-primary-foreground/85">
              <li className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                <span>
                  Pařížská 12
                  <br />
                  110 00 Praha 1
                </span>
              </li>
              <li className="flex items-center gap-4">
                <Phone className="h-5 w-5 text-gold shrink-0" />
                <a href="tel:+420222333444" className="hover:text-gold">
                  +420 222 333 444
                </a>
              </li>
              <li className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-gold shrink-0" />
                <a href="mailto:info@studio-elegance.cz" className="hover:text-gold">
                  info@studio-elegance.cz
                </a>
              </li>
              <li className="flex items-start gap-4">
                <Clock className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                <span>
                  Po–Pá 9:00 — 19:00
                  <br />
                  So 9:00 — 14:00
                </span>
              </li>
            </ul>
            {showReserve && onReserve && (
              <Button
                onClick={onReserve}
                className="mt-8 bg-gold text-primary hover:bg-gold/90"
              >
                Rezervovat termín online
              </Button>
            )}
            <div className="mt-8 rounded-xl overflow-hidden border border-primary-foreground/10 aspect-[16/9] max-w-lg">
              <iframe
                title="Mapa salónu"
                src="https://www.openstreetmap.org/export/embed.html?bbox=14.4180%2C50.0871%2C14.4250%2C50.0911&layer=mapnik&marker=50.0891%2C14.4215"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </div>

          <form
            onSubmit={send}
            className="bg-primary-foreground/5 backdrop-blur rounded-2xl border border-primary-foreground/10 p-8 space-y-4 self-start"
          >
            <h3 className="font-display text-2xl mb-2">Napište nám</h3>
            <p className="text-sm text-primary-foreground/60 mb-4">
              Máte dotaz k barvení, produktům nebo dárkovým poukazům? Ozveme se do 24 hodin.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="cname" className="text-primary-foreground/80">
                Jméno
              </Label>
              <Input
                id="cname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cemail" className="text-primary-foreground/80">
                E-mail
              </Label>
              <Input
                id="cemail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cmsg" className="text-primary-foreground/80">
                Zpráva
              </Label>
              <Textarea
                id="cmsg"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
              />
            </div>
            <Button type="submit" className="w-full bg-gold text-primary hover:bg-gold/90">
              Odeslat zprávu
            </Button>
          </form>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/60">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-gold" />
            <span className="font-display text-lg text-primary-foreground">Studio Elegance</span>
          </div>
          <p>© {new Date().getFullYear()} Studio Elegance. Všechna práva vyhrazena.</p>
          <div className="flex gap-3">
            <a href="#" aria-label="Instagram" className="hover:text-gold">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" aria-label="Facebook" className="hover:text-gold">
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
