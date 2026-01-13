"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Star, AlertTriangle } from "lucide-react";
import { useQuickCheck } from "@/hooks/useQuickCheck";
import { BUNDESLAENDER, BUNDESLAND_NAMES, EMPLOYMENT_TYPES, type Bundesland, type EmploymentType } from "@/types";

export function Hero() {
  const router = useRouter();
  const { data, updateData } = useQuickCheck();
  const [step, setStep] = useState(0);
  const [localData, setLocalData] = useState({
    dueDate: data.dueDate ? data.dueDate.toISOString().split("T")[0] : "",
    employment: data.employment || ("" as EmploymentType | ""),
    monthlyNetIncome: data.monthlyNetIncome || 0,
    hasPartner: data.hasPartner,
    bundesland: data.bundesland || ("" as Bundesland | ""),
  });

  const totalSteps = 5;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Speichere und navigiere zum Ergebnis
      updateData({
        dueDate: localData.dueDate ? new Date(localData.dueDate) : null,
        employment: localData.employment as EmploymentType,
        monthlyNetIncome: localData.monthlyNetIncome,
        hasPartner: localData.hasPartner,
        bundesland: localData.bundesland as Bundesland,
      });
      router.push("/ergebnis");
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!localData.dueDate;
      case 1:
        return !!localData.employment;
      case 2:
        return localData.monthlyNetIncome > 0;
      case 3:
        return localData.hasPartner !== null;
      case 4:
        return !!localData.bundesland;
      default:
        return false;
    }
  };

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 gradient-subtle -z-10" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Loss Aversion Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 mb-6">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                Die meisten Eltern verschenken 1.000–5.000 €
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Wie viel Elterngeld{" "}
              <span className="gradient-text">verlierst du?</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Falsche Steuerklasse, schlechte Aufteilung, verpasste Fristen –
              finde in 2 Minuten heraus, wie viel du <strong className="text-foreground">gerade verschenkst</strong>.
            </p>
          </div>

          {/* Inline Quick-Check */}
          <Card className="shadow-2xl border-2 max-w-xl mx-auto">
            <CardContent className="p-6 md:p-8">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Schritt {step + 1} von {totalSteps}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Step 0: Geburtstermin */}
              {step === 0 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold mb-1">Wann ist der Geburtstermin?</h2>
                    <p className="text-sm text-muted-foreground">Errechneter Termin (ET) oder bereits geboren</p>
                  </div>
                  <Input
                    type="date"
                    value={localData.dueDate}
                    onChange={(e) => setLocalData({ ...localData, dueDate: e.target.value })}
                    className="h-14 text-lg text-center"
                  />
                </div>
              )}

              {/* Step 1: Beschäftigung */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold mb-1">Wie bist du beschäftigt?</h2>
                    <p className="text-sm text-muted-foreground">Deine aktuelle Beschäftigungsart</p>
                  </div>
                  <RadioGroup
                    value={localData.employment}
                    onValueChange={(v) => setLocalData({ ...localData, employment: v as EmploymentType })}
                    className="grid gap-2"
                  >
                    {EMPLOYMENT_TYPES.map((type) => (
                      <Label
                        key={type.value}
                        className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <RadioGroupItem value={type.value} />
                        <span className="font-medium">{type.label}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Step 2: Einkommen */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold mb-1">Wie hoch ist dein Netto-Einkommen?</h2>
                    <p className="text-sm text-muted-foreground">Durchschnittliches monatliches Netto</p>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="z.B. 2500"
                      value={localData.monthlyNetIncome || ""}
                      onChange={(e) => setLocalData({ ...localData, monthlyNetIncome: Number(e.target.value) })}
                      className="h-14 text-lg text-center pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      €
                    </span>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Dein Einkommen wird nur für die Berechnung verwendet und nicht gespeichert.
                  </p>
                </div>
              )}

              {/* Step 3: Partner */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold mb-1">Nimmt der andere Elternteil auch Elternzeit?</h2>
                    <p className="text-sm text-muted-foreground">Beide mind. 2 Monate = 14 statt 12 Monate</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={localData.hasPartner === true ? "default" : "outline"}
                      className={`h-auto py-5 flex-col gap-2 ${localData.hasPartner === true ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      onClick={() => setLocalData({ ...localData, hasPartner: true })}
                    >
                      <span className="font-semibold">Ja, beide</span>
                      <span className="text-xs opacity-70">14 Monate</span>
                    </Button>
                    <Button
                      type="button"
                      variant={localData.hasPartner === false ? "default" : "outline"}
                      className={`h-auto py-5 flex-col gap-2 ${localData.hasPartner === false ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      onClick={() => setLocalData({ ...localData, hasPartner: false })}
                    >
                      <span className="font-semibold">Nein, nur ich</span>
                      <span className="text-xs opacity-70">12 Monate</span>
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Ehe ist nicht nötig – gilt auch für unverheiratete Paare.
                  </p>
                </div>
              )}

              {/* Step 4: Bundesland */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold mb-1">In welchem Bundesland wohnst du?</h2>
                    <p className="text-sm text-muted-foreground">Für Landeserziehungsgeld & regionale Leistungen</p>
                  </div>
                  <Select
                    value={localData.bundesland}
                    onValueChange={(v) => setLocalData({ ...localData, bundesland: v as Bundesland })}
                  >
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Bundesland wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BUNDESLAENDER.map((bl) => (
                        <SelectItem key={bl} value={bl}>
                          {BUNDESLAND_NAMES[bl]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-8">
                {step > 0 && (
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`flex-1 ${step === 0 ? 'w-full' : ''}`}
                >
                  {step === totalSteps - 1 ? (
                    <>
                      Verschenktes Geld berechnen
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Weiter
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trust indicators below card */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>100% kostenlos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>BEEG-konform</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <span>Geld-zurück-Garantie</span>
            </div>
          </div>

          {/* Trustpilot */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-[#00b67a] text-[#00b67a]" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">4,9/5</strong> auf Trustpilot
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
