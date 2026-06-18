import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLink } from "@/lib/router";

export default function PrivacyPlaceholderPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl mb-3">Ochrana osobních údajů</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Text zásad ochrany osobních údajů doplníme brzy.
      </p>
      <Button asChild variant="outline">
        <AppLink to="/">
          <Home className="mr-2 h-4 w-4" />
          Zpět na úvod
        </AppLink>
      </Button>
    </div>
  );
}
