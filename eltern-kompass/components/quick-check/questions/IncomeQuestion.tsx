"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface IncomeQuestionProps {
  value: number;
  onChange: (income: number) => void;
}

export function IncomeQuestion({ value, onChange }: IncomeQuestionProps) {
  const [inputValue, setInputValue] = useState(value > 0 ? value.toString() : "");

  useEffect(() => {
    if (value > 0 && inputValue === "") {
      setInputValue(value.toString());
    }
  }, [value, inputValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    setInputValue(rawValue);
    const numValue = parseInt(rawValue, 10);
    onChange(isNaN(numValue) ? 0 : numValue);
  };

  // Calculate approximate Elterngeld for preview
  const getPreviewElterngeld = (income: number): string => {
    if (income <= 0) return "300";
    if (income < 1000) return String(Math.round(income * 0.8));
    if (income <= 1240) return String(Math.round(income * 0.67));
    return String(Math.min(Math.round(income * 0.65), 1800));
  };

  const previewAmount = getPreviewElterngeld(value);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          Wie hoch ist dein monatliches Netto-Einkommen?
        </h2>
        <p className="text-muted-foreground">
          Der Durchschnitt der letzten 12 Monate vor Mutterschutz.
        </p>
      </div>

      <div className="max-w-xs mx-auto">
        <Label htmlFor="income" className="sr-only">
          Monatliches Netto-Einkommen
        </Label>
        <div className="relative">
          <Input
            id="income"
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleChange}
            placeholder="z.B. 2500"
            className="text-center text-2xl h-16 pr-12"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
            €
          </span>
        </div>
      </div>

      {value > 0 && (
        <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground mb-1">
            Geschätztes Elterngeld pro Monat:
          </p>
          <p className="text-2xl font-bold text-primary">
            ca. {previewAmount} €
          </p>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Das Netto findest du auf deiner Gehaltsabrechnung. Bei Selbstständigen:
        Durchschnittlicher monatlicher Gewinn.
      </p>
    </div>
  );
}
