"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Calendar,
  PiggyBank,
  Users,
  Lock,
} from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { calculateMonthlyElterngeld, formatCurrency } from "@/lib/calculations/elterngeld-quick";

export default function PortalErgebnisPage() {
  const router = useRouter();
  const { data, isLoaded, isComplete } = useOnboarding();
  const [isCalculating, setIsCalculating] = useState(true);

  // Simuliere Berechnung
  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => {
        setIsCalculating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  // Redirect wenn Onboarding nicht abgeschlossen
  useEffect(() => {
    if (isLoaded && !isComplete) {
      router.push("/portal/onboarding");
    }
  }, [isLoaded, isComplete, router]);

  if (!isLoaded || isCalculating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Berechnung läuft...</h2>
          <p className="text-muted-foreground">
            Wir analysieren deine individuelle Situation
          </p>
        </div>
      </div>
    );
  }

  // Berechne Ergebnisse basierend auf Onboarding-Daten
  const mutterMonatlich = calculateMonthlyElterngeld(data.mutter.monatlichesNetto);
  const partnerMonatlich = data.partner
    ? calculateMonthlyElterngeld(data.partner.monatlichesNetto)
    : 0;

  const ohneOptimierung =
    mutterMonatlich * data.elternzeitPlan.monateMutter +
    partnerMonatlich * data.elternzeitPlan.monatePartner;

  // Simuliertes Optimierungspotenzial (in Produktion: echte Berechnung)
  const optimierungsProzent = data.hatPartner ? 0.18 : 0.12;
  const optimierungsPotenzial = Math.round(ohneOptimierung * optimierungsProzent);
  const mitOptimierung = ohneOptimierung + optimierungsPotenzial;

  const handlePayment = () => {
    // TODO: Stripe Integration
    router.push("/portal/strategie");
  };

  const features = [
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "Optimale Steuerklassen-Strategie",
      description: "Wann der Wechsel sich lohnt und welche Kombination optimal ist",
    },
    {
      icon: <PiggyBank className="h-5 w-5" />,
      title: "Beste Aufteilung Basis vs. ElterngeldPlus",
      description: "Konkrete Empfehlung für deine Situation",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Monatsgenauer Bezugsplan",
      description: "Visualisierung wer wann wie viel bekommt",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "PDF-Export",
      description: "Für Arbeitgeber und Elterngeldstelle",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-6 lg:py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 mb-4">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-green-700 font-medium text-sm">
              Berechnung abgeschlossen
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Deine Berechnung ist fertig!
          </h1>
          <p className="text-muted-foreground">
            Basierend auf deinen Angaben haben wir dein Optimierungspotenzial berechnet
          </p>
        </div>

        {/* Ergebnis-Karten */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="border-2 border-gray-200">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Ohne Optimierung
                  </p>
                  <p className="text-3xl font-bold text-gray-600 mb-1">
                    {formatCurrency(ohneOptimierung)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Gesamt-Elterngeld
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-green-700 mb-1">Mit Optimierung</p>
                  <p className="text-3xl font-bold text-green-600 mb-1">
                    {formatCurrency(mitOptimierung)}
                  </p>
                  <p className="text-sm text-green-700/70">
                    Gesamt-Elterngeld
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Potenzial-Highlight */}
        <Card className="mb-8 overflow-hidden">
          <div className="gradient-primary p-5 text-center">
            <p className="text-white/90 mb-1">Dein Optimierungspotenzial</p>
            <p className="text-4xl font-bold text-white">
              +{formatCurrency(optimierungsPotenzial)}
            </p>
          </div>
        </Card>

        {/* Paywall Card */}
        <Card className="mb-8 shadow-xl overflow-hidden">
          <CardContent className="py-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">
                Deine personalisierte Strategie enthält:
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Blurred Preview */}
            <div className="relative mb-8 rounded-lg overflow-hidden border">
              <div className="p-6 bg-gray-50 blur-sm select-none pointer-events-none">
                <div className="h-4 w-3/4 bg-gray-300 rounded mb-4" />
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="h-20 bg-gray-200 rounded" />
                  <div className="h-20 bg-gray-200 rounded" />
                  <div className="h-20 bg-gray-200 rounded" />
                </div>
                <div className="h-32 bg-gray-200 rounded mb-4" />
                <div className="h-4 w-1/2 bg-gray-300 rounded" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                <div className="text-center">
                  <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="font-medium text-gray-600">Premium-Inhalt</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-4">
              <Button size="lg" className="px-8 text-lg" onClick={handlePayment}>
                Strategie freischalten – 79 €
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              {/* Geld-zurück-Garantie */}
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-full px-5 py-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm text-green-800">
                    100% Geld-zurück-Garantie
                  </p>
                  <p className="text-xs text-green-600">
                    Wenn deine Ersparnis unter 500 € liegt
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Signals */}
        <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            <span>Sichere Zahlung via Stripe</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>DSGVO konform</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            <span>Sofortiger Zugang</span>
          </div>
        </div>
      </div>
    </div>
  );
}
