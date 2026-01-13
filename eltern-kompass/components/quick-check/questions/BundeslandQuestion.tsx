"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Bundesland } from "@/types";
import { BUNDESLAND_NAMES } from "@/types";

interface BundeslandQuestionProps {
  value: Bundesland | null;
  onChange: (bundesland: Bundesland) => void;
}

const bundeslaender = Object.entries(BUNDESLAND_NAMES) as [Bundesland, string][];

// Bundesländer mit Zusatzleistungen
const bundeslandExtras: Partial<Record<Bundesland, string>> = {
  BY: "Bayerisches Familiengeld: bis 3.000€ extra",
  SN: "Landeserziehungsgeld: bis 1.800€ extra",
  TH: "Landeserziehungsgeld: bis 1.800€ extra",
};

export function BundeslandQuestion({ value, onChange }: BundeslandQuestionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">In welchem Bundesland wohnst du?</h2>
        <p className="text-muted-foreground">
          Einige Bundesländer bieten zusätzliche Familienleistungen.
        </p>
      </div>

      <div className="max-w-xs mx-auto">
        <Label htmlFor="bundesland" className="sr-only">
          Bundesland
        </Label>
        <Select value={value ?? undefined} onValueChange={(v) => onChange(v as Bundesland)}>
          <SelectTrigger className="h-14 text-lg">
            <SelectValue placeholder="Bundesland wählen..." />
          </SelectTrigger>
          <SelectContent>
            {bundeslaender.map(([code, name]) => (
              <SelectItem key={code} value={code}>
                <span className="flex items-center gap-2">
                  {name}
                  {bundeslandExtras[code] && (
                    <span className="text-xs text-green-600 font-medium">
                      +Extra
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value && bundeslandExtras[value] && (
        <div className="text-center p-4 rounded-xl bg-green-50 border border-green-200">
          <p className="text-sm font-medium text-green-800">
            Zusatzleistung in {BUNDESLAND_NAMES[value]}:
          </p>
          <p className="text-green-700">{bundeslandExtras[value]}</p>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Der Wohnsitz bestimmt auch die zuständige Elterngeldstelle.
      </p>
    </div>
  );
}
