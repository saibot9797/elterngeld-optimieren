"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 gradient-primary">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Bereit, dein Elterngeld zu optimieren?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Starte jetzt den kostenlosen Quick-Check und finde heraus, wie viel
            mehr dir zusteht.
          </p>

          <Button
            asChild
            size="lg"
            className="bg-white text-primary hover:bg-white/90 shadow-xl"
          >
            <Link href="/quick-check">
              Jetzt kostenlos starten
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <p className="mt-6 text-sm text-white/70">
            Keine Anmeldung erforderlich. Ergebnis in 2 Minuten.
          </p>

          {/* Geld-zurück-Garantie */}
          <div className="mt-8 pt-8 border-t border-white/20">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
              <ShieldCheck className="h-6 w-6 text-white" />
              <div className="text-left">
                <p className="text-white font-semibold text-sm">
                  Geld-zurück-Garantie
                </p>
                <p className="text-white/70 text-xs">
                  Volle Erstattung wenn Optimierung unter 500 €
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
