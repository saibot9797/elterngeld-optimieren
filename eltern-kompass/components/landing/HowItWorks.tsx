"use client";

import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    number: "01",
    title: "5 Fragen beantworten",
    description:
      "Geburtstermin, Einkommen, Bundesland – mehr brauchen wir für den Quick-Check nicht.",
    duration: "2 Min.",
  },
  {
    number: "02",
    title: "Ergebnis sehen",
    description:
      "Dein geschätztes Elterngeld und Optimierungspotenzial werden sofort berechnet.",
    duration: "Sofort",
  },
  {
    number: "03",
    title: "Mehr herausholen",
    description:
      "Mit dem Premium-Rechner bekommst du konkrete Optimierungsvorschläge und vorausgefüllte Anträge.",
    duration: "Optional",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            So einfach geht&apos;s
          </h2>
          <p className="text-lg text-muted-foreground">
            In nur 2 Minuten weißt du, wie viel Elterngeld dir zusteht – und was
            du optimieren kannst.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-1/2 z-0" />
                )}

                <Card className="relative z-10 h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl font-bold gradient-text">
                        {step.number}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                        {step.duration}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
