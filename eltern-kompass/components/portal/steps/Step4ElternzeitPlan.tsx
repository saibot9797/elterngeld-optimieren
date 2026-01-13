"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Calendar, Clock, Users, Info } from "lucide-react";
import type { OnboardingData, ElternzeitPlan } from "@/hooks/useOnboarding";

interface Step4Props {
  data: OnboardingData;
  updateElternzeitPlan: (data: Partial<ElternzeitPlan>) => void;
}

export function Step4ElternzeitPlan({ data, updateElternzeitPlan }: Step4Props) {
  const { elternzeitPlan } = data;
  const maxMonate = 14;

  // Berechne verbleibende Monate
  const genutzteMonate = elternzeitPlan.monateMutter + elternzeitPlan.monatePartner;
  const verbleibendeMonate = maxMonate - genutzteMonate;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Elternzeit-Plan</h2>
        <p className="text-muted-foreground">
          Wie möchtet ihr die Elternzeit aufteilen?
        </p>
      </div>

      {/* Übersicht */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-primary">
                {elternzeitPlan.monateMutter}
              </p>
              <p className="text-xs text-muted-foreground">
                Monate {data.mutter.vorname || "Mutter"}
              </p>
            </div>
            <div className="text-center px-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-primary">
                {data.hatPartner ? elternzeitPlan.monatePartner : 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Monate {data.partner?.vorname || "Partner"}
              </p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm">
              <span
                className={`font-medium ${
                  verbleibendeMonate < 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {verbleibendeMonate >= 0 ? verbleibendeMonate : 0} Monate
              </span>{" "}
              <span className="text-muted-foreground">
                von {maxMonate} Basis-Monaten verfügbar
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Monate Mutter */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {data.mutter.vorname || "Mutter"}: Elterngeld-Monate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>0 Monate</span>
              <span className="font-medium">
                {elternzeitPlan.monateMutter} Monate
              </span>
              <span>14 Monate</span>
            </div>
            <Slider
              value={[elternzeitPlan.monateMutter]}
              onValueChange={([value]) =>
                updateElternzeitPlan({ monateMutter: value })
              }
              max={14}
              step={1}
              className="w-full"
            />
          </div>

          {/* Teilzeit */}
          <div className="pt-4 border-t space-y-3">
            <Label>Teilzeit während Elternzeit?</Label>
            <RadioGroup
              value={elternzeitPlan.teilzeitMutter ? "ja" : "nein"}
              onValueChange={(value) =>
                updateElternzeitPlan({ teilzeitMutter: value === "ja" })
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ja" id="teilzeit-mutter-ja" />
                <Label htmlFor="teilzeit-mutter-ja">Ja</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nein" id="teilzeit-mutter-nein" />
                <Label htmlFor="teilzeit-mutter-nein">Nein</Label>
              </div>
            </RadioGroup>

            {elternzeitPlan.teilzeitMutter && (
              <div className="flex items-center gap-3 mt-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="20"
                  className="w-20"
                  value={elternzeitPlan.teilzeitStundenMutter || ""}
                  onChange={(e) =>
                    updateElternzeitPlan({
                      teilzeitStundenMutter: Number(e.target.value) || 0,
                    })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  Stunden pro Woche
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monate Partner */}
      {data.hatPartner && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {data.partner?.vorname || "Partner"}: Elterngeld-Monate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>0 Monate</span>
                <span className="font-medium">
                  {elternzeitPlan.monatePartner} Monate
                </span>
                <span>14 Monate</span>
              </div>
              <Slider
                value={[elternzeitPlan.monatePartner]}
                onValueChange={([value]) =>
                  updateElternzeitPlan({ monatePartner: value })
                }
                max={14}
                step={1}
                className="w-full"
              />
            </div>

            {/* Teilzeit Partner */}
            <div className="pt-4 border-t space-y-3">
              <Label>Teilzeit während Elternzeit?</Label>
              <RadioGroup
                value={elternzeitPlan.teilzeitPartner ? "ja" : "nein"}
                onValueChange={(value) =>
                  updateElternzeitPlan({ teilzeitPartner: value === "ja" })
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ja" id="teilzeit-partner-ja" />
                  <Label htmlFor="teilzeit-partner-ja">Ja</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nein" id="teilzeit-partner-nein" />
                  <Label htmlFor="teilzeit-partner-nein">Nein</Label>
                </div>
              </RadioGroup>

              {elternzeitPlan.teilzeitPartner && (
                <div className="flex items-center gap-3 mt-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="20"
                    className="w-20"
                    value={elternzeitPlan.teilzeitStundenPartner || ""}
                    onChange={(e) =>
                      updateElternzeitPlan({
                        teilzeitStundenPartner: Number(e.target.value) || 0,
                      })
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    Stunden pro Woche
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partnerschaftsbonus */}
      {data.hatPartner && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Partnerschaftsbonus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Was ist der Partnerschaftsbonus?</p>
                  <p>
                    Wenn beide Eltern gleichzeitig 4 Monate lang zwischen 24 und
                    32 Stunden pro Woche arbeiten, erhaltet ihr zusätzlich 4
                    ElterngeldPlus-Monate pro Person.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Partnerschaftsbonus nutzen?</Label>
              <RadioGroup
                value={elternzeitPlan.partnerschaftsbonus ? "ja" : "nein"}
                onValueChange={(value) =>
                  updateElternzeitPlan({ partnerschaftsbonus: value === "ja" })
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ja" id="bonus-ja" />
                  <Label htmlFor="bonus-ja">Ja, interessiert mich</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nein" id="bonus-nein" />
                  <Label htmlFor="bonus-nein">Nein</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
