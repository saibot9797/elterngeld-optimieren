"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, RefreshCw, TrendingUp, Calendar, MapPin, CheckCircle2, ShieldCheck } from "lucide-react";
import { useQuickCheck } from "@/hooks/useQuickCheck";
import { calculateQuickCheck, formatCurrency } from "@/lib/calculations/elterngeld-quick";
import { BUNDESLAND_NAMES } from "@/types";
import { Header } from "@/components/landing/Header";

export default function ErgebnisPage() {
  const router = useRouter();
  const { data, isLoaded, isComplete, reset } = useQuickCheck();
  const [result, setResult] = useState<ReturnType<typeof calculateQuickCheck> | null>(null);

  useEffect(() => {
    if (isLoaded && !isComplete) {
      router.push("/quick-check");
    }
  }, [isLoaded, isComplete, router]);

  useEffect(() => {
    if (isLoaded && isComplete) {
      setResult(calculateQuickCheck(data));
    }
  }, [isLoaded, isComplete, data]);

  if (!isLoaded || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-subtle">
        <div className="animate-pulse text-muted-foreground">
          Berechnung läuft...
        </div>
      </div>
    );
  }

  const handleRestart = () => {
    reset();
    router.push("/quick-check");
  };

  return (
    <>
      <Header />
      <div className="min-h-screen gradient-subtle pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Page Header - Loss Aversion */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 mb-4">
              <span className="text-amber-700 font-medium">Ergebnis deiner Analyse</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Du verschenkst vermutlich <span className="gradient-text">{formatCurrency(result.optimizationPotential)}</span>
            </h1>
            <p className="text-muted-foreground">
              Mit der richtigen Strategie kannst du dieses Geld zurückholen
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Main Results Grid - Loss Aversion Focus */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* What you're losing */}
              <Card className="shadow-lg border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-amber-700 mb-2">Das verlierst du aktuell</p>
                      <p className="text-4xl font-bold text-amber-600 mb-1">
                        -{formatCurrency(result.optimizationPotential)}
                      </p>
                      <p className="text-amber-700/70">
                        Durch fehlende Optimierung
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-amber-600 rotate-180" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What you could have */}
              <Card className="shadow-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-green-700 mb-2">Mit Optimierung möglich</p>
                      <p className="text-4xl font-bold text-green-600 mb-1">
                        {formatCurrency(result.totalElterngeld + result.optimizationPotential)}
                      </p>
                      <p className="text-green-700/70">
                        {formatCurrency(result.monthlyElterngeld)}/Monat × {result.months} Monate + Bonus
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Geburtstermin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">
                    {data.dueDate?.toLocaleDateString("de-DE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Bundesland
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">
                    {data.bundesland && BUNDESLAND_NAMES[data.bundesland]}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CTA Card - Loss Aversion */}
            <Card className="mb-8 shadow-xl overflow-hidden">
              <div className="gradient-primary p-5 text-white">
                <h2 className="text-xl md:text-2xl font-bold text-center">
                  Hol dir deine {formatCurrency(result.optimizationPotential)} zurück
                </h2>
              </div>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground mb-6 max-w-lg mx-auto">
                  Der Premium-Optimierer analysiert deine Situation im Detail und zeigt dir
                  konkret, wie du dein Elterngeld maximierst.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-8 max-w-xl mx-auto">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Optimale Steuerklassen-Strategie</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Beste Aufteilung Basis vs. Plus</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Partnerschaftsbonus nutzen</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Zusatzleistungen prüfen</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <Button
                    size="lg"
                    className="px-8"
                    onClick={() => router.push('/registrieren')}
                  >
                    Optimierung starten → {formatCurrency(result.optimizationPotential)} Potenzial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>

                  {/* Geld-zurück-Garantie prominent */}
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-full px-5 py-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm text-green-800">Geld-zurück-Garantie</p>
                      <p className="text-xs text-green-600">
                        Volle Erstattung wenn Optimierung unter 500 €
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button variant="outline" onClick={handleRestart}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Neu berechnen
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/">Zur Startseite</Link>
              </Button>
            </div>

            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-muted/50 border max-w-2xl mx-auto">
              <p className="text-xs text-muted-foreground text-center">
                <strong>Hinweis:</strong> Dies ist eine vereinfachte Schätzung
                basierend auf den BEEG-Formeln. Die tatsächliche Höhe des
                Elterngeldes wird von der zuständigen Elterngeldstelle berechnet und
                kann abweichen. Diese Berechnung ersetzt keine Rechts- oder
                Steuerberatung.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
