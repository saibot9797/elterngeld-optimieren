"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">EK</span>
          </div>
          <span className="font-bold text-lg">Eltern-Kompass</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/rechner/mutterschutz"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Mutterschutz-Rechner
          </Link>
          <Link
            href="#faq"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            FAQ
          </Link>
        </nav>

        <Button asChild size="sm">
          <Link href="/quick-check">Quick-Check starten</Link>
        </Button>
      </div>
    </header>
  );
}
