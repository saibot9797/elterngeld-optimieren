"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Clock, Puzzle } from "lucide-react";

const problems = [
  {
    icon: Puzzle,
    title: "Komplexe Aufteilung",
    description:
      "Basiselterngeld, ElterngeldPlus, Partnerschaftsbonus – die optimale Kombination zu finden ist ein Rätsel.",
  },
  {
    icon: Clock,
    title: "Verpasste Fristen",
    description:
      "Elterngeld wird nur 3 Monate rückwirkend gezahlt. Steuerklassenwechsel muss Monate vorher erfolgen.",
  },
  {
    icon: AlertTriangle,
    title: "Versteckte Leistungen",
    description:
      "Landeserziehungsgeld, Kinderzuschlag, Wohngeld – viele wissen nicht, was ihnen zusteht.",
  },
];

export function Problem() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Warum verlieren so viele Eltern Geld?
          </h2>
          <p className="text-lg text-muted-foreground">
            Laut Stiftung Warentest verschenken Eltern regelmäßig tausende Euro –
            einfach weil das System so komplex ist.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {problems.map((problem, index) => (
            <Card
              key={index}
              className="border-2 hover:border-primary/50 transition-colors"
            >
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <problem.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stat highlight */}
        <div className="mt-12 max-w-2xl mx-auto">
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="py-8 text-center">
              <div className="text-5xl font-bold gradient-text mb-2">
                51%
              </div>
              <p className="text-muted-foreground">
                der Eltern fühlen sich durch Bürokratie belastet
                <span className="block text-sm mt-1">
                  (Forsa-Studie 2025, Körber-Stiftung)
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
