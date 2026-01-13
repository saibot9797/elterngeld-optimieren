"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Minus } from "lucide-react";

// Echte Wettbewerber basierend auf Recherche
const competitors = [
  { name: "Eltern-Kompass", price: "79 €", highlight: true },
  { name: "Elterngeldhelden", price: "169–299 €", highlight: false },
  { name: "Elterngeldexperten", price: "179–329 €", highlight: false },
  { name: "Elterngeld.net", price: "120–240 €", highlight: false },
  { name: "Steuerberater", price: "200–500 €", highlight: false },
];

const features = [
  {
    name: "Kostenloser Quick-Check",
    values: [true, false, false, false, false],
  },
  {
    name: "BEEG-konforme Berechnung",
    values: [true, true, true, true, true],
  },
  {
    name: "Steuerklassen-Optimierung",
    values: [true, true, true, true, true],
  },
  {
    name: "ElterngeldPlus-Simulation",
    values: [true, true, true, true, "partial"],
  },
  {
    name: "Partnerschaftsbonus-Rechner",
    values: [true, true, true, "partial", "partial"],
  },
  {
    name: "Interaktiver Monatsplaner",
    values: [true, false, false, false, false],
  },
  {
    name: "Zusatzleistungen prüfen",
    values: [true, "partial", "partial", false, false],
  },
  {
    name: "Unbegrenzte Nachfragen",
    values: [true, true, true, "partial", false],
  },
  {
    name: "Geld-zurück-Garantie",
    values: [true, false, false, false, false],
  },
];

function FeatureIcon({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
        <Check className="h-4 w-4 text-green-600" />
      </div>
    );
  }
  if (value === "partial") {
    return (
      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
        <Minus className="h-4 w-4 text-amber-600" />
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
      <X className="h-4 w-4 text-gray-400" />
    </div>
  );
}

export function Comparison() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Warum Eltern-Kompass?
          </h2>
          <p className="text-lg text-muted-foreground">
            Im Vergleich zu anderen Elterngeld-Beratern bieten wir mehr Funktionen
            zum günstigeren Preis – mit Geld-zurück-Garantie.
          </p>
        </div>

        <div className="max-w-6xl mx-auto overflow-x-auto">
          <Card className="shadow-lg">
            <CardContent className="p-0">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Funktion
                    </th>
                    {competitors.map((comp, i) => (
                      <th key={comp.name} className={`p-4 text-center ${i === 0 ? 'bg-primary/5' : ''}`}>
                        <div className={`font-bold ${comp.highlight ? 'gradient-text' : ''}`}>
                          {comp.name}
                        </div>
                        <div className={`text-xs ${comp.highlight ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                          {comp.price}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, rowIndex) => (
                    <tr
                      key={feature.name}
                      className={rowIndex % 2 === 0 ? "bg-muted/20" : ""}
                    >
                      <td className="p-4 text-sm font-medium">{feature.name}</td>
                      {feature.values.map((value, colIndex) => (
                        <td
                          key={colIndex}
                          className={`p-4 ${colIndex === 0 ? 'bg-primary/5' : ''}`}
                        >
                          <div className="flex justify-center">
                            <FeatureIcon value={value} />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-6 justify-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FeatureIcon value={true} />
              <span>Enthalten</span>
            </div>
            <div className="flex items-center gap-2">
              <FeatureIcon value="partial" />
              <span>Teilweise / Aufpreis</span>
            </div>
            <div className="flex items-center gap-2">
              <FeatureIcon value={false} />
              <span>Nicht enthalten</span>
            </div>
          </div>

          {/* Source note */}
          <p className="mt-4 text-xs text-center text-muted-foreground">
            Preise und Funktionen basierend auf öffentlich verfügbaren Informationen der Anbieter (Stand: Januar 2026).
          </p>
        </div>
      </div>
    </section>
  );
}
