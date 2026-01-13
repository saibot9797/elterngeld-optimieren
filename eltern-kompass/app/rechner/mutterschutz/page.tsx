"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, Calendar, Shield, Baby } from "lucide-react";
import {
  calculateMutterschutz,
  formatDateLong,
} from "@/lib/calculations/mutterschutz";
import type { MutterschutzResult } from "@/types";
import { Header } from "@/components/landing/Header";

export default function MutterschutzRechnerPage() {
  const [dueDate, setDueDate] = useState<string>("");
  const [birthType, setBirthType] = useState<"normal" | "twins" | "premature">(
    "normal"
  );
  const [result, setResult] = useState<MutterschutzResult | null>(null);

  const handleCalculate = () => {
    if (!dueDate) return;

    const calculated = calculateMutterschutz({
      dueDate: new Date(dueDate),
      isMultipleBirth: birthType === "twins",
      isPremature: birthType === "premature",
    });

    setResult(calculated);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen gradient-subtle pt-24 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border mb-4">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Kostenloser Rechner</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Mutterschutz-Rechner
            </h1>
            <p className="text-muted-foreground">
              Berechne deinen Mutterschutzzeitraum in Sekunden.
            </p>
          </div>

          {/* Calculator card */}
          <Card className="mb-6 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Deine Angaben
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Due date input */}
              <div className="space-y-2">
                <Label htmlFor="dueDate">Errechneter Geburtstermin (ET)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Birth type */}
              <div className="space-y-3">
                <Label>Art der Geburt</Label>
                <RadioGroup
                  value={birthType}
                  onValueChange={(v) =>
                    setBirthType(v as "normal" | "twins" | "premature")
                  }
                  className="grid gap-2"
                >
                  <Label
                    htmlFor="normal"
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="normal" id="normal" />
                    <span>Einzelkind (normale Geburt)</span>
                  </Label>
                  <Label
                    htmlFor="twins"
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="twins" id="twins" />
                    <span>Mehrlingsgeburt (Zwillinge, Drillinge, ...)</span>
                  </Label>
                  <Label
                    htmlFor="premature"
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="premature" id="premature" />
                    <span>Frühgeburt erwartet</span>
                  </Label>
                </RadioGroup>
              </div>

              <Button
                className="w-full h-12"
                onClick={handleCalculate}
                disabled={!dueDate}
              >
                Mutterschutz berechnen
              </Button>
            </CardContent>
          </Card>

          {/* Result card */}
          {result && (
            <Card className="mb-6 shadow-lg border-2 border-primary/20">
              <CardHeader className="gradient-primary text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <Baby className="h-5 w-5" />
                  Dein Mutterschutzzeitraum
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">
                      Beginn Mutterschutz
                    </p>
                    <p className="font-semibold text-lg">
                      {formatDateLong(result.startDate)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ({result.daysBeforeBirth} Tage vor ET)
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">
                      Ende Mutterschutz
                    </p>
                    <p className="font-semibold text-lg">
                      {formatDateLong(result.endDate)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ({result.daysAfterBirth} Tage nach ET)
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Gesamtdauer Mutterschutz
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {result.totalDays} Tage
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ({Math.round(result.totalDays / 7)} Wochen)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA to Quick-Check */}
          <Card className="mb-6 border-2 border-primary/20 bg-white">
            <CardContent className="py-6">
              <h3 className="text-xl font-bold mb-2 text-center">
                Wie viel Elterngeld bekommst du?
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                Mach den kostenlosen Quick-Check und finde es in 2 Minuten heraus.
              </p>
              <div className="flex justify-center">
                <Button asChild size="lg">
                  <Link href="/quick-check">
                    Elterngeld berechnen
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info section */}
          <div className="space-y-4 text-sm text-muted-foreground">
            <h3 className="font-semibold text-foreground">Gut zu wissen:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Der Mutterschutz beginnt <strong>6 Wochen vor</strong> dem
                errechneten Geburtstermin.
              </li>
              <li>
                Nach der Geburt beträgt die Schutzfrist normalerweise{" "}
                <strong>8 Wochen</strong>.
              </li>
              <li>
                Bei Früh- und Mehrlingsgeburten verlängert sich die Schutzfrist
                nach der Geburt auf <strong>12 Wochen</strong>.
              </li>
              <li>
                Während des Mutterschutzes erhältst du{" "}
                <strong>Mutterschaftsgeld</strong> von deiner Krankenkasse und
                einen <strong>Arbeitgeberzuschuss</strong>.
              </li>
            </ul>
          </div>

          {/* Back link */}
          <div className="mt-8 text-center">
            <Button variant="ghost" asChild>
              <Link href="/">Zur Startseite</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
