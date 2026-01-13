import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-12 bg-muted/50 border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">EK</span>
            </div>
            <span className="font-bold">Eltern-Kompass</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/datenschutz"
              className="hover:text-foreground transition-colors"
            >
              Datenschutz
            </Link>
            <Link
              href="/impressum"
              className="hover:text-foreground transition-colors"
            >
              Impressum
            </Link>
            <Link
              href="/rechner/mutterschutz"
              className="hover:text-foreground transition-colors"
            >
              Mutterschutz-Rechner
            </Link>
          </nav>

          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Eltern-Kompass
          </p>
        </div>

        <div className="mt-8 pt-8 border-t text-center">
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            Hinweis: Die Berechnungen dienen der Orientierung und ersetzen keine
            Rechts- oder Steuerberatung. Die tatsächliche Höhe des Elterngeldes
            wird von der zuständigen Elterngeldstelle festgelegt.
          </p>
        </div>
      </div>
    </footer>
  );
}
